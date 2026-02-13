import { currentUser, addDownload } from "./auth.js";
const $ = (s, r=document) => r.querySelector(s);

function esc(s){
  return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function qp(name){ return new URL(location.href).searchParams.get(name); }


function isAdmin(u){
  // Admin users list: add your username(s) here
  const admins = ["ufukaplann"];
  return !!u && admins.includes(String(u.username||"").toLowerCase());
}

function initials(name){
  name = String(name||"").trim();
  if(!name) return "?";
  return name.slice(0,2).toUpperCase();
}

function hydrateUserSlot(){
  const u = currentUser();
  const slot = document.querySelector("[data-user-slot]");
  if(!slot) return;

  if(!u){
    slot.innerHTML = `<a class="link" href="../login.html">Giriş</a>`;
    return;
  }

  const admin = isAdmin(u);
  slot.innerHTML = `
    <div class="dropdown">
      <a class="avatar" href="javascript:void(0)" id="avBtn">
        <span class="bubble">${initials(u.username)}</span>
        <span style="color:#a7b3d6;font-size:13px">@${esc(u.username)}</span>
      </a>
      <div class="menu" id="avMenu">
        <a href="../account.html">Hesabım</a>
        ${admin ? `<a href="../admin.html">Admin: Set Ekle</a>` : ``}
        <a href="../login.html">Hesap değiştir</a>
      </div>
    </div>
  `;
  const btn = document.getElementById("avBtn");
  const menu = document.getElementById("avMenu");
  btn?.addEventListener("click", ()=>{
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", (e)=>{
    if(!menu) return;
    if(!e.target.closest(".dropdown")) menu.style.display = "none";
  });
}

function showLock(){
  const lock = document.getElementById("lock");
  if(lock) lock.style.display = "flex";
}

async function readJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error("JSON load failed: " + url);
  return r.json();
}


async function loadModel(){
  const main = $("main[data-model]");
  if(!main) return;
  const model = main.dataset.model;
  const data = await readJSON("../data/sets.json");
  const items = data.filter(x => x.model === model);
  const list = $("#list");
  const u = currentUser();
  const locked = !u;
  list.innerHTML = items.map(x=>`
    <a class="card ${locked ? "locked" : ""}" href="${locked ? ("../login.html?return="+encodeURIComponent(location.href)) : ("../set/index.html?id="+encodeURIComponent(x.id))}">
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.description||"")}</p>
    </a>
  `).join("");
}

async function loadSet(){
  const id = qp("id");
  if(!id) return;
  const data = await readJSON("../data/sets.json");
  const x = data.find(s=>s.id === id);
  if(!x) return;
  $("#title").textContent = x.title;
  $("#desc").textContent = x.description || "";
  const lockedSet = !currentUser();
  if(lockedSet){
    document.querySelectorAll(".detail, #desc, #tags").forEach(el=>el && el.classList.add("locked"));
  }
  const dl = $("#dl");
  const u = currentUser();
  if(!u){
    dl.textContent = "Giriş yap ve indir";
    dl.href = "../login.html?return=" + encodeURIComponent(location.href);
  } else {
    dl.textContent = "İndir";
    dl.href = x.download_url || "#";
    dl.addEventListener("click", ()=>addDownload(x));
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  hydrateUserSlot();
  loadModel().catch(console.error);
  loadSet().catch(console.error);
});
