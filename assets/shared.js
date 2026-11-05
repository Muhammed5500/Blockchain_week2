// Mint sayfası ve galerinin ortak parçaları.
(function () {
  const C = window.ROZET_CONFIG;

  const ABI = [
    "function mint() returns (uint256)",
    "function mintOpen() view returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function mintedId(address) view returns (uint256)",
    "function baseURI() view returns (string)",
    "function tokenURI(uint256) view returns (string)",
    "function ownerOf(uint256) view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "error MintClosed()",
    "error AlreadyMinted()",
    "error SoldOut()",
  ];

  const configured = /^0x[0-9a-fA-F]{40}$/.test(C.CONTRACT_ADDRESS || "");

  const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);
  const txUrl = (h) => `${C.EXPLORER_URL}/tx/${h}`;
  const addrUrl = (a) => `${C.EXPLORER_URL}/address/${a}`;

  // Kontrat tasarımının aynısı: gerçek görsel hazır olana kadar önizleme olarak kullanılır.
  function placeholderSvg(label) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
      '<rect width="600" height="600" fill="#1C1B22"/>' +
      '<circle cx="300" cy="250" r="150" fill="none" stroke="#F7931A" stroke-width="10"/>' +
      `<text x="300" y="285" font-family="Georgia,serif" font-size="110" fill="#F6F1E7" text-anchor="middle">${label}</text>` +
      '<text x="300" y="470" font-family="Arial,sans-serif" font-size="30" fill="#F6F1E7" text-anchor="middle">Blockchain 101 - Hafta 2</text>' +
      '<text x="300" y="520" font-family="Arial,sans-serif" font-size="22" fill="#F7931A" text-anchor="middle" letter-spacing="3">METU BLOCKCHAIN CLUB</text>' +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const ipfs = (u) => (u.startsWith("ipfs://") ? "https://ipfs.io/ipfs/" + u.slice(7) : u);

  // tokenURI → görsel adresi. Zincir üstü (data:) ve IPFS/HTTP JSON'u destekler.
  async function imageFromTokenURI(uri) {
    let meta;
    if (uri.startsWith("data:application/json;base64,")) {
      const bin = atob(uri.slice(29));
      meta = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    } else if (uri.startsWith("data:application/json")) {
      meta = JSON.parse(decodeURIComponent(uri.slice(uri.indexOf(",") + 1)));
    } else {
      meta = await (await fetch(ipfs(uri))).json();
    }
    return ipfs(meta.image || "");
  }

  function notConfigured(el) {
    el.innerHTML =
      '<div class="card center"><h2>Kontrat henüz ayarlanmadı</h2>' +
      "<p>Kulüp kontratı deploy edip <code>config.js</code> dosyasına adresini yazınca bu sayfa çalışacak.</p></div>";
  }

  window.Rozet = { C, ABI, configured, short, txUrl, addrUrl, placeholderSvg, imageFromTokenURI, notConfigured };
})();
