(function () {
  const { C, ABI, configured, short, placeholderSvg, imageFromTokenURI, notConfigured } = window.Rozet;
  const $ = (id) => document.getElementById(id);

  if (C.MINT_URL) {
    $("url").textContent = C.MINT_URL.replace(/^https?:\/\//, "");
    $("qr").textContent = "";
    if (window.QRCode) new QRCode($("qr"), { text: C.MINT_URL, width: 300, height: 300, colorDark: "#1C1B22", colorLight: "#F6F1E7" });
  }

  if (!configured) {
    notConfigured($("body"));
    $("status").textContent = "";
    return;
  }

  const nft = new ethers.Contract(C.CONTRACT_ADDRESS, ABI, new ethers.JsonRpcProvider(C.RPC_URL, C.CHAIN_ID, { staticNetwork: true }));
  let shown = 0n;
  let busy = false;

  async function tile(id, animate) {
    const el = document.createElement("div");
    el.className = "tile" + (animate ? " new" : "");
    el.innerHTML = `<img alt="Rozet #${id}"><span class="num">#${id}</span><span class="own">…</span>`;
    $("grid").prepend(el);
    const [owner, uri] = await Promise.all([nft.ownerOf(id), nft.tokenURI(id).catch(() => "")]);
    el.querySelector(".own").textContent = short(owner);
    let src = placeholderSvg("#" + id);
    if (uri) {
      try { src = await imageFromTokenURI(uri); } catch (e) { /* yer tutucu kalsın */ }
    }
    el.querySelector("img").src = src;
  }

  async function poll() {
    if (busy) return;
    busy = true;
    try {
      const [supply, open] = await Promise.all([nft.totalSupply(), nft.mintOpen()]);
      const first = shown === 0n;
      while (shown < supply) {
        shown += 1n;
        await tile(shown, !first);
      }
      $("count").textContent = supply.toString();
      $("empty").hidden = supply > 0n;
      $("status").textContent = (open ? "● Mint açık" : "○ Mint kapalı") + " · son kontrol " + new Date().toLocaleTimeString("tr-TR");
    } catch (e) {
      console.error(e);
      $("status").textContent = "Ağa ulaşılamadı, tekrar deneniyor…";
    }
    busy = false;
  }

  poll();
  setInterval(poll, 8000);
})();
