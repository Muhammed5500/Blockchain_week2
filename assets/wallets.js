// Tarayıcıda birden fazla cüzdan eklentisi varsa (MetaMask, Rainbow, Rabby...) kullanıcıya seçtirir.
// EIP-6963: her eklenti kendini "eip6963:announceProvider" olayıyla duyurur. Duyurmayan eski eklentiler için window.ethereum'a düşer.
(function () {
  const KEY = "rozet-wallet";
  const found = new Map();

  window.addEventListener("eip6963:announceProvider", (e) => {
    if (e.detail && e.detail.info && e.detail.provider) found.set(e.detail.info.uuid, e.detail);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} },
  };

  async function list() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    await wait(300);
    const out = [...found.values()];
    if (!out.length && window.ethereum) {
      out.push({ info: { uuid: "legacy", rdns: "legacy", name: window.ethereum.isMetaMask ? "MetaMask" : "Tarayıcı cüzdanı", icon: "" }, provider: window.ethereum });
    }
    // MetaMask'ı başa al: derste herkes onu kullanıyor.
    return out.sort((a, b) => (b.info.rdns === "io.metamask") - (a.info.rdns === "io.metamask"));
  }

  // Daha önce seçilen cüzdan hâlâ varsa onu döndürür (sormadan yeniden bağlanmak için).
  async function remembered() {
    const rdns = store.get();
    if (!rdns) return null;
    const w = (await list()).find((x) => x.info.rdns === rdns);
    return w ? w.provider : null;
  }

  function modal(wallets) {
    return new Promise((resolve) => {
      const bg = document.createElement("div");
      bg.style.cssText = "position:fixed;inset:0;background:rgba(28,27,34,.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px";
      const box = document.createElement("div");
      box.style.cssText = "background:#F6F1E7;color:#1C1B22;border-radius:18px;padding:22px;width:100%;max-width:380px;font-family:'IBM Plex Sans',system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.3)";
      box.innerHTML = '<p style="margin:0 0 4px;font-weight:700;font-size:20px">Cüzdan seç</p><p style="margin:0 0 14px;color:#4A4652;font-size:15px">Tarayıcında birden fazla cüzdan var. Bugün MetaMask kullanıyoruz.</p>';
      wallets.forEach((w) => {
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "display:flex;align-items:center;gap:12px;width:100%;margin:0 0 8px;padding:12px 14px;border:2px solid #1C1B22;border-radius:12px;background:#FBF8F1;color:#1C1B22;font:600 17px 'IBM Plex Sans',system-ui,sans-serif;cursor:pointer;text-align:left";
        if (w.info.icon) {
          const img = document.createElement("img");
          img.src = w.info.icon;
          img.alt = "";
          img.style.cssText = "width:28px;height:28px;border-radius:6px";
          b.appendChild(img);
        }
        b.appendChild(document.createTextNode(w.info.name));
        b.onclick = () => { bg.remove(); resolve(w); };
        box.appendChild(b);
      });
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = "Vazgeç";
      cancel.style.cssText = "width:100%;padding:10px;border:0;background:transparent;color:#4A4652;font:600 15px 'IBM Plex Sans',system-ui,sans-serif;cursor:pointer";
      cancel.onclick = () => { bg.remove(); resolve(null); };
      box.appendChild(cancel);
      bg.appendChild(box);
      bg.onclick = (e) => { if (e.target === bg) { bg.remove(); resolve(null); } };
      document.body.appendChild(bg);
    });
  }

  // Tek cüzdan varsa doğrudan onu, birden fazlaysa seçtirdiğini döndürür. Hiç cüzdan yoksa null, vazgeçilirse false.
  async function pick() {
    const wallets = await list();
    if (!wallets.length) return null;
    const w = wallets.length === 1 ? wallets[0] : await modal(wallets);
    if (!w) return false;
    store.set(w.info.rdns);
    return w.provider;
  }

  window.RozetWallets = { list, pick, remembered };
})();
