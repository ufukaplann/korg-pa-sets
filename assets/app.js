
const SITE_BASE = "/korg-pa-sets";
const KEY_USER = "korg_user_v1";
const KEY_DL = "korg_dl_v1";

function qs(s,r=document){return r.querySelector(s)}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function initials(name){name=String(name||"").trim(); return name?name.slice(0,2).toUpperCase():"?";}

export function currentUser(){ return localStorage.getItem(KEY_USER); }
export function setUser(u){ localStorage.setItem(KEY_USER,u); }
export function logout(){ localStorage.removeItem(KEY_USER); }

export function addDownload(item){
  const u=currentUser(); if(!u) return;
  const all=JSON.parse(localStorage.getItem(KEY_DL)||"{}");
  const arr=all[u]||[];
  arr.unshift({...item, at:new Date().toISOString()});
  all[u]=arr.slice(0,200);
  localStorage.setItem(KEY_DL, JSON.stringify(all));
}
export function listDownloads(){
  const u=currentUser(); 
  const all=JSON.parse(localStorage.getItem(KEY_DL)||"{}");
  return u && all[u] ? all[u] : [];
}

function hydrateNav(){
  const slot = document.querySelector("[data-user-slot]");
  if(!slot) return;
  const u = currentUser();
  if(!u) {
    slot.innerHTML = `<a href="${SITE_BASE}/login.html">Giriş</a>`;
    return;
  }
  slot.innerHTML = `
    <div class="dropdown">
      <a class="avatar" href="javascript:void(0)" id="avBtn">
        <span class="bubble">${initials(u)}</span>
        <span class="small">@${esc(u)}</span>
      </a>
      <div class="menu" id="avMenu">
        <a href="${SITE_BASE}/account.html">Hesabım</a>
        <a href="javascript:void(0)" id="loBtn">Çıkış</a>
      </div>
    </div>
  `;
  const btn=qs("#avBtn"), menu=qs("#avMenu");
  btn?.addEventListener("click",()=>menu.style.display = (menu.style.display==="block"?"none":"block"));
  document.addEventListener("click",(e)=>{ if(!e.target.closest(".dropdown")) menu.style.display="none"; });
  qs("#loBtn")?.addEventListener("click",()=>{logout(); location.href = `${SITE_BASE}/index.html`; });
}

function applyLocks(){
  const locked = !currentUser();
  document.querySelectorAll("[data-lock-card]").forEach(el=> {
    el.classList.toggle("locked", locked);
  });
  document.querySelectorAll("[data-require-login]").forEach(el=> {
    if(!locked) return;
    el.addEventListener("click",(e)=>{
      e.preventDefault();
      location.href = `${SITE_BASE}/login.html?return=` + encodeURIComponent(location.href);
    },{once:true});
  });
}

document.addEventListener("DOMContentLoaded", ()=>{ hydrateNav(); applyLocks(); });
