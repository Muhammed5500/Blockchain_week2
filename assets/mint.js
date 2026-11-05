(function () {
  const { C, ABI, configured, short, txUrl, addrUrl, placeholderSvg, imageFromTokenURI, notConfigured } = window.Rozet;
  const $ = (id) => document.getElementById(id);
  const show = (id, on = true) => ($(id).hidden = !on);

  if (!configured) {
    notConfigured($("app"));
    return;
  }

  const reader = new ethers.Contract(C.CONTRACT_ADDRESS, ABI, new ethers.JsonRpcProvider(C.RPC_URL, C.CHAIN_ID, { staticNetwork: true }));
  const chainHex = "0x" + C.CHAIN_ID.toString(16);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let account = null;
  let open = false;
  let myId = 0n;

  function error(text) {
    $("err").innerHTML = text || "";
    show("err", !!text);
  }

  // Cüzdan bağlanmadan da rozet durumu görünsün.
  async function refreshStats() {
    try {
      const [isOpen, supply, max, base] = await Promise.all([reader.mintOpen(), reader.totalSupply(), reader.maxSupply(), reader.baseURI()]);
      open = isOpen;
      $("count").textContent = max > 0n ? `${supply} / ${max}` : `${supply}`;
      $("state").innerHTML = open ? '<span class="dot on"></span>Mint açık' : '<span class="dot off"></span>Mint şu an kapalı';
      $("mintBtn").disabled = !open;
      if (myId === 0n) {
        // Gerçek tasarım yüklendiyse onu, yoksa sıradaki numarayla yer tutucuyu göster.
        // Tek görsel (data: ya da tek dosya) ise rozet basılmadan da gösterilebilir.
        if (base && !base.endsWith("/")) $("preview").src = await imageFromTokenURI(base);
        else if (base && supply > 0n) $("preview").src = await imageFromTokenURI(await reader.tokenURI(1n));
        else $("preview").src = placeholderSvg("#" + (supply + 1n));
      }
    } catch (e) {
      console.error(e);
      $("state").innerHTML = '<span class="dot"></span>Ağa ulaşılamadı';
    }
  }

  // Seçilen cüzdan (birden fazla eklenti varsa kullanıcı seçer, bkz. wallets.js).
  let eth = null;
  function wallet() {
    return eth;
  }

  function listen() {
    if (eth && eth.on) {
      eth.on("accountsChanged", () => location.reload());
      eth.on("chainChanged", () => location.reload());
    }
  }

  async function connect() {
    error("");
    const chosen = await window.RozetWallets.pick();
    if (chosen === false) return;
    if (chosen) { eth = chosen; listen(); }
    if (!eth) {
      if (isMobile) {
        const link = "https://metamask.app.link/dapp/" + location.host + location.pathname;
        error(`Telefonda cüzdan bulunamadı. Siteyi <b>MetaMask uygulamasının içindeki tarayıcıdan</b> aç.<br><a href="${link}">MetaMask'ta aç</a>`);
      } else {
        error('Tarayıcında cüzdan bulunamadı. <a href="https://metamask.io/download/" target="_blank" rel="noopener">MetaMask eklentisini kur</a>, sonra sayfayı yenile.');
      }
      return;
    }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      account = ethers.getAddress(accounts[0]);
      await afterConnect();
    } catch (e) {
      error(explain(e));
    }
  }

  async function afterConnect() {
    $("acct").textContent = short(account);
    show("acct");
    show("connectBox", false);
    const chain = await wallet().request({ method: "eth_chainId" });
    if (parseInt(chain, 16) !== C.CHAIN_ID) {
      show("networkBox");
      show("mintBox", false);
      return;
    }
    show("networkBox", false);
    myId = await reader.mintedId(account);
    if (myId > 0n) return showOwned(null);
    show("mintBox");
  }

  async function switchNetwork() {
    error("");
    try {
      await wallet().request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
    } catch (e) {
      if (e && e.code === 4902) {
        try {
          await wallet().request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainHex,
              chainName: C.CHAIN_NAME,
              nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [C.RPC_URL],
              blockExplorerUrls: [C.EXPLORER_URL],
            }],
          });
        } catch (e2) {
          return error(explain(e2));
        }
      } else {
        return error(explain(e));
      }
    }
    await afterConnect();
  }

  async function mint() {
    error("");
    $("mintBtn").disabled = true;
    try {
      const provider = new ethers.BrowserProvider(wallet());
      const signer = await provider.getSigner();
      const nft = new ethers.Contract(C.CONTRACT_ADDRESS, ABI, signer);
      // Önce dene: kapalıysa ya da zaten mintlediyse MetaMask'ı hiç açmadan anlaşılır bir hata göster.
      await nft.mint.staticCall();
      if ((await provider.getBalance(account)) === 0n) throw { code: "INSUFFICIENT_FUNDS" };
      const tx = await nft.mint();
      show("mintBox", false);
      $("pendingLink").textContent = tx.hash;
      $("pendingLink").href = txUrl(tx.hash);
      show("pendingBox");
      const receipt = await tx.wait();
      const log = receipt.logs.map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } }).find((l) => l && l.name === "Transfer");
      myId = log ? log.args.tokenId : await reader.mintedId(account);
      show("pendingBox", false);
      await showOwned(tx.hash);
      refreshStats();
    } catch (e) {
      console.error(e);
      show("pendingBox", false);
      show("mintBox");
      $("mintBtn").disabled = !open;
      error(explain(e));
    }
  }

  async function showOwned(hash) {
    show("mintBox", false);
    $("doneTitle").textContent = hash ? `Tebrikler! Rozet #${myId} senin` : `Rozet #${myId} zaten senin`;
    $("doneText").textContent = hash
      ? "Rozetin zincire yazıldı. Artık kulübün kontratındaki tabloda sahibi olarak senin adresin yazıyor."
      : "Bu adres rozetini daha önce almış. Kural kodda yazılı: adres başına bir rozet.";
    if (hash) {
      $("txLink").href = txUrl(hash);
      $("txLink").textContent = "İşlemi Etherscan'de gör";
    } else {
      $("txLink").href = addrUrl(account) + "#nfttransfers";
      $("txLink").textContent = "Adresimi Etherscan'de gör";
    }
    try {
      $("preview").src = await imageFromTokenURI(await reader.tokenURI(myId));
    } catch (e) {
      $("preview").src = placeholderSvg("#" + myId);
    }
    show("doneBox");
  }

  async function watch(params, okText, failText) {
    $("watchMsg").hidden = true;
    try {
      const added = await wallet().request({ method: "wallet_watchAsset", params });
      $("watchMsg").className = "msg " + (added === false ? "info" : "ok");
      $("watchMsg").innerHTML = added === false ? "Ekleme iptal edildi." : okText;
    } catch (e) {
      $("watchMsg").className = "msg info";
      $("watchMsg").innerHTML = failText;
    }
    $("watchMsg").hidden = false;
  }

  function watchNft() {
    watch(
      { type: "ERC721", options: { address: C.CONTRACT_ADDRESS, tokenId: myId.toString() } },
      "Rozet cüzdanına eklendi. MetaMask'ta NFT sekmesine bak.",
      `Cüzdanın bunu otomatik ekleyemedi. NFT sekmesinde "Import NFT" ile elle ekle:<br>Adres: <span class="mono">${C.CONTRACT_ADDRESS}</span><br>Token ID: <b>${myId}</b>`
    );
  }

  function watchUsdc() {
    watch(
      { type: "ERC20", options: { address: C.USDC_ADDRESS, symbol: "USDC", decimals: 6 } },
      "USDC cüzdanına eklendi. Token sekmesinde görebilirsin.",
      `Cüzdanın bunu otomatik ekleyemedi. "Import token" ile elle ekle:<br><span class="mono">${C.USDC_ADDRESS}</span>`
    );
  }

  function explain(e) {
    const err = e && (e.error || e);
    const text = String((err && (err.shortMessage || err.message)) || "");
    const revert = e && e.revert && e.revert.name;
    if (e && (e.code === "ACTION_REJECTED" || e.code === 4001)) return "İşlemi reddettin. Hazır olunca tekrar dene.";
    if (revert === "AlreadyMinted" || text.includes("AlreadyMinted")) return "Zaten mintledin. Kural: adres başına bir rozet.";
    if (revert === "MintClosed" || text.includes("MintClosed")) return "Mint şu an kapalı. Ders sırasında açılacak.";
    if (revert === "SoldOut" || text.includes("SoldOut")) return "Bütün rozetler basıldı.";
    if ((e && e.code === "INSUFFICIENT_FUNDS") || /insufficient funds/i.test(text)) return "Gas için Sepolia ETH yok, önce faucet'ten al.";
    if (e && e.code === -32002) return "MetaMask'ta bekleyen bir istek var. MetaMask'ı açıp ona bak.";
    if (/network|chain/i.test(text)) return "Ağ hatası. Cüzdanının Sepolia'da olduğundan emin ol ve tekrar dene.";
    return "Bir şeyler ters gitti: " + (text || "bilinmeyen hata");
  }

  $("connectBtn").onclick = connect;
  $("switchBtn").onclick = switchNetwork;
  $("mintBtn").onclick = mint;
  $("watchNftBtn").onclick = watchNft;
  $("watchUsdcBtn").onclick = watchUsdc;

  // Daha önce bu sayfada bir cüzdan seçilip bağlandıysa sormadan devam et.
  window.RozetWallets.remembered().then((p) => {
    if (!p) return;
    p.request({ method: "eth_accounts" }).then((a) => {
      if (a && a.length && !eth) {
        eth = p;
        listen();
        account = ethers.getAddress(a[0]);
        afterConnect().catch((e) => error(explain(e)));
      }
    }).catch(() => {});
  });

  refreshStats();
  setInterval(refreshStats, 15000);
})();
