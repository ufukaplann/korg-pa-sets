(() => {
  // ---- Base path (GitHub Pages project)
  const DEFAULT_BASE = "/korg-pa-sets";
  const basePath = (() => {
    // If site is hosted as project pages, path starts with /korg-pa-sets
    const p = window.location.pathname;
    if (p.startsWith(DEFAULT_BASE + "/") || p === DEFAULT_BASE || p === DEFAULT_BASE + "/") return DEFAULT_BASE;
    return ""; // allow local file / root hosting
  })();

  // ---- Storage keys (v1)
  const KEY_USER = "korg_user_v1";
  const KEY_USERS = "korg_users_v1";
  const KEY_DL_PREFIX = "korg_dl_v1_"; // per user

  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  function toast(msg){
    const t = $("#toast");
    if(!t) return alert(msg);
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(()=> t.style.display="none", 2500);
  }

  function navLink(href, text, active=false){
    const a = document.createElement("a");
    a.className = "pill" + (active ? " active":"");
    a.href = basePath + href;
    a.textContent = text;
    return a;
  }

  function getUser(){
    try{ return JSON.parse(localStorage.getItem(KEY_USER) || "null"); }catch{ return null; }
  }
  function setUser(u){
    localStorage.setItem(KEY_USER, JSON.stringify(u));
  }
  function logout(){
    localStorage.removeItem(KEY_USER);
    toast("Çıkış yapıldı.");
    window.location.href = basePath + "/index.html";
  }

  // --- Password hashing (client-side, NOT real security)
  async function sha256(s){
    const enc = new TextEncoder().encode(s);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function loadUsers(){
    try{ return JSON.parse(localStorage.getItem(KEY_USERS) || "[]"); }catch{ return []; }
  }
  function saveUsers(users){
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  }

  async function register(username, password){
    username = (username||"").trim();
    if(username.length < 3) return toast("Kullanıcı adı en az 3 karakter.");
    if((password||"").length < 4) return toast("Şifre en az 4 karakter.");
    const users = loadUsers();
    if(users.some(u => u.username.toLowerCase() === username.toLowerCase())) return toast("Bu kullanıcı adı zaten var.");
    const passHash = await sha256(password);
    users.push({username, passHash, createdAt: new Date().toISOString()});
    saveUsers(users);
    toast("Kayıt tamam. Şimdi giriş yap.");
  }

  async function login(username, password){
    username = (username||"").trim();
    const users = loadUsers();
    const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
    if(!u) return toast("Kullanıcı bulunamadı.");
    const passHash = await sha256(password||"");
    if(passHash !== u.passHash) return toast("Şifre yanlış.");
    setUser({username: u.username, loginAt: new Date().toISOString()});
    toast("Giriş başarılı.");
    // return to ?return=
    const params = new URLSearchParams(location.search);
    const ret = params.get("return");
    window.location.href = ret ? decodeURIComponent(ret) : (basePath + "/index.html");
  }

  function requireLoginOrRedirect(){
    const u = getUser();
    if(u) return u;
    const ret = encodeURIComponent(window.location.href);
    window.location.href = basePath + "/login.html?return=" + ret;
    return null;
  }

  // ---- Downloads tracking
  function markDownloaded(user, setId){
    if(!user) return;
    const key = KEY_DL_PREFIX + user.username;
    const list = (()=>{ try{return JSON.parse(localStorage.getItem(key) || "[]")}catch{return []} })();
    if(!list.some(x => x.id === setId)){
      list.unshift({id:setId, at:new Date().toISOString()});
      localStorage.setItem(key, JSON.stringify(list.slice(0,200)));
    }
  }
  function getDownloads(user){
    if(!user) return [];
    const key = KEY_DL_PREFIX + user.username;
    try{ return JSON.parse(localStorage.getItem(key) || "[]"); }catch{ return []; }
  }

  // ---- Data
  async function fetchSets(){
    const res = await fetch(basePath + "/data/sets.json", {cache:"no-store"});
    if(!res.ok) throw new Error("sets.json okunamadı");
    return await res.json();
  }

  // ---- Common nav
  function renderNav(active){
    const nav = $("#nav-links");
    if(!nav) return;
    nav.innerHTML = "";

    nav.append(
      navLink("/index.html", "Ana Sayfa", active==="home"),
      navLink("/models/pa1000.html", "PA1000", active==="PA1000"),
      navLink("/models/pa700.html", "PA700", active==="PA700"),
      navLink("/models/pa4x.html", "PA4X", active==="PA4X"),
      navLink("/models/pa5x.html", "PA5X", active==="PA5X"),
    );

    const u = getUser();
    const userArea = $("#user-area");
    userArea.innerHTML = "";

    if(u){
      const btn = document.createElement("button");
      btn.className = "userbtn";
      btn.type = "button";
      btn.innerHTML = `<div class="avatar">${u.username.slice(0,1).toUpperCase()}</div><div style="display:flex;flex-direction:column;line-height:1.1"><div style="font-weight:800">${u.username}</div><small style="color:var(--muted);font-weight:700">Hesabım</small></div>`;
      userArea.append(btn);

      const dd = $("#dropdown");
      dd.style.display = "none";
      btn.addEventListener("click", () => {
        dd.style.display = (dd.style.display === "block") ? "none" : "block";
      });
      document.addEventListener("click", (e) => {
        if(!userArea.contains(e.target)) dd.style.display = "none";
      });

      $("#dd-account").href = basePath + "/account.html";
      $("#dd-logout").onclick = logout;
    }else{
      const a = document.createElement("a");
      a.className = "pill";
      a.href = basePath + "/login.html";
      a.textContent = "Giriş";
      userArea.append(a);
      const dd = $("#dropdown");
      if(dd) dd.style.display = "none";
    }
  }

  // ---- Pages
  async function pageIndex(){
    renderNav("home");

    const u = getUser();
    const gate = $("#login-gate");
    const content = $("#content");

    if(!u){
      gate.style.display = "block";
      content.style.display = "none";
    }else{
      gate.style.display = "none";
      content.style.display = "block";
    }

    // wire login/register on page
    const liBtn = $("#li-btn");
    if(liBtn){
      liBtn.addEventListener("click", async () => {
        await login($("#li-user").value, $("#li-pass").value);
      });
    }
    const regBtn = $("#reg-btn");
    if(regBtn){
      regBtn.addEventListener("click", async () => {
        await register($("#reg-user").value, $("#reg-pass").value);
      });
    }

    if(!u) return;

    const sets = await fetchSets();
    const q = $("#search");
    const modelSel = $("#model");
    const list = $("#set-list");

    function render(){
      const query = (q.value||"").trim().toLowerCase();
      const model = modelSel.value;
      const filtered = sets.filter(s => (model==="ALL" ? true : (s.model===model)) )
        .filter(s => !query || (s.title+" "+(s.description||"")+" "+(s.tags||[]).join(" ")).toLowerCase().includes(query));

      list.innerHTML = "";
      if(filtered.length === 0){
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h2>Sonuç yok</h2><p>Filtreyi değiştir veya aramayı temizle.</p>`;
        list.append(div);
        return;
      }

      for(const s of filtered){
        const item = document.createElement("div");
        item.className = "item";
        const tags = (s.tags||[]).slice(0,6).map(t => `<span class="badge tag">${t}</span>`).join("");
        item.innerHTML = `
          <div class="meta">
            <span class="badge">${s.model}</span>
            <span class="badge">${formatDate(s.date)}</span>
            ${tags}
          </div>
          <h3>${escapeHtml(s.title)}</h3>
          <p class="desc">${escapeHtml(s.description||"")}</p>
          <div class="actions">
            <a class="btn secondary" href="${basePath}/set/index.html?id=${encodeURIComponent(s.id)}">Detay</a>
            <button class="btn" data-dl="${escapeAttr(s.id)}">İndir</button>
            <span class="small">İçerik: ${escapeHtml(s.id)}</span>
          </div>
        `;
        list.append(item);
      }

      // download buttons
      $$("[data-dl]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-dl");
          const set = sets.find(x => x.id === id);
          if(!set) return toast("Set bulunamadı.");
          // user already logged here
          markDownloaded(getUser(), id);
          window.open(set.download_url, "_blank");
        });
      });
    }

    q.addEventListener("input", render);
    modelSel.addEventListener("change", render);
    render();
  }

  async function pageModel(modelName){
    renderNav(modelName);
    const u = getUser();
    if(!u){
      const ret = encodeURIComponent(window.location.href);
      window.location.href = basePath + "/login.html?return=" + ret;
      return;
    }
    const sets = await fetchSets();
    const list = $("#set-list");
    const header = $("#model-title");
    header.textContent = modelName + " Setleri";

    const filtered = sets.filter(s => s.model === modelName);
    list.innerHTML = "";
    if(filtered.length === 0){
      list.innerHTML = `<div class="card"><h2>Henüz set yok</h2><p>Bu model için set eklenmemiş.</p></div>`;
      return;
    }
    for(const s of filtered){
      const item = document.createElement("div");
      item.className = "item";
      const tags = (s.tags||[]).slice(0,6).map(t => `<span class="badge tag">${t}</span>`).join("");
      item.innerHTML = `
        <div class="meta">
          <span class="badge">${s.model}</span>
          <span class="badge">${formatDate(s.date)}</span>
          ${tags}
        </div>
        <h3>${escapeHtml(s.title)}</h3>
        <p class="desc">${escapeHtml(s.description||"")}</p>
        <div class="actions">
          <a class="btn secondary" href="${basePath}/set/index.html?id=${encodeURIComponent(s.id)}">Detay</a>
          <button class="btn" data-dl="${escapeAttr(s.id)}">İndir</button>
        </div>
      `;
      list.append(item);
    }
    $$("[data-dl]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-dl");
        const set = sets.find(x => x.id === id);
        if(!set) return toast("Set bulunamadı.");
        markDownloaded(getUser(), id);
        window.open(set.download_url, "_blank");
      });
    });
  }

  async function pageSetDetail(){
    renderNav(null);
    const u = getUser();
    const must = $("#must-login");
    const content = $("#detail-content");

    if(!u){
      must.style.display = "block";
      content.style.display = "none";
      $("#go-login").href = basePath + "/login.html?return=" + encodeURIComponent(window.location.href);
      return;
    }
    must.style.display = "none";
    content.style.display = "block";

    const params = new URLSearchParams(location.search);
    const id = params.get("id") || "";
    const sets = await fetchSets();
    const s = sets.find(x => x.id === id);
    if(!s){
      $("#title").textContent = "Set bulunamadı";
      $("#desc").textContent = "Bu ID ile kayıt yok: " + id;
      $("#download").style.display = "none";
      return;
    }

    $("#title").textContent = s.title;
    $("#desc").textContent = s.description || "";
    $("#meta").innerHTML = `
      <span class="badge">${s.model}</span>
      <span class="badge">${formatDate(s.date)}</span>
      ${(s.tags||[]).map(t => `<span class="badge tag">${escapeHtml(t)}</span>`).join("")}
    `;
    $("#notes").textContent = s.notes || "Not yok.";
    $("#download").addEventListener("click", () => {
      markDownloaded(getUser(), s.id);
      window.open(s.download_url, "_blank");
    });
    $("#back").href = basePath + "/models/" + s.model.toLowerCase() + ".html";
  }

  function pageLogin(){
    renderNav(null);
    // if already logged, go home
    if(getUser()){
      window.location.href = basePath + "/index.html";
      return;
    }
    $("#li-btn").addEventListener("click", async () => {
      await login($("#li-user").value, $("#li-pass").value);
    });
    $("#reg-btn").addEventListener("click", async () => {
      await register($("#reg-user").value, $("#reg-pass").value);
    });
  }

  async function pageAccount(){
    renderNav(null);
    const u = requireLoginOrRedirect();
    if(!u) return;

    const sets = await fetchSets();
    $("#username").textContent = u.username;

    const dls = getDownloads(u);
    const list = $("#downloads");
    list.innerHTML = "";

    if(dls.length === 0){
      list.innerHTML = `<div class="card"><h2>İndirme yok</h2><p>Henüz indirme yapmadın.</p></div>`;
      return;
    }

    for(const d of dls){
      const s = sets.find(x => x.id === d.id);
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div class="meta">
          <span class="badge">${s ? s.model : "?"}</span>
          <span class="badge">${formatDate(d.at)}</span>
        </div>
        <h3>${escapeHtml(s ? s.title : d.id)}</h3>
        <div class="actions">
          ${s ? `<a class="btn secondary" href="${basePath}/set/index.html?id=${encodeURIComponent(s.id)}">Detay</a>` : ""}
          ${s ? `<button class="btn" data-dl="${escapeAttr(s.id)}">Tekrar indir</button>` : ""}
        </div>
      `;
      list.append(item);
    }

    $$("[data-dl]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-dl");
        const s = sets.find(x => x.id === id);
        if(!s) return toast("Set bulunamadı.");
        window.open(s.download_url, "_blank");
      });
    });
  }

  // ---- Utils
  function formatDate(d){
    if(!d) return "—";
    const dt = new Date(d);
    if(Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("tr-TR", {year:"numeric", month:"short", day:"2-digit"});
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){
    return String(s).replace(/"/g, "&quot;");
  }

  // ---- Router by body data-page
  document.addEventListener("DOMContentLoaded", async () => {
    const page = document.body.getAttribute("data-page") || "";
    try{
      if(page === "index") await pageIndex();
      else if(page === "model") await pageModel(document.body.getAttribute("data-model"));
      else if(page === "set") await pageSetDetail();
      else if(page === "login") pageLogin();
      else if(page === "account") await pageAccount();
      else renderNav(null);
    }catch(e){
      console.error(e);
      toast("Hata: " + (e?.message || e));
    }
  });

  // expose for quick debug
  window.__korg = { basePath, KEY_USER, KEY_USERS };
})();