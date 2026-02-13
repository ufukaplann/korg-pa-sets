import { currentUser, addDownload } from "./auth.js";
const $ = (s, r=document) => r.querySelector(s);

function esc(s){
  return String(s).replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function qp(name){ return new URL(location.href).searchParams.get(name); }

async function readJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error("JSON load failed: " + url);
  return r.json();
}

function hydrateUserSlot(){
  const u = currentUser();
  const slot = document.querySelector("[data-user-slot]");
  if(!slot) return;
  slot.innerHTML = u
    ? `<a class="link" href="../account.html">@${esc(u.username)}</a>`
    : `<a class="link" href="../login.html">Giriş</a>`;
}

async function loadModel(){
  const main = $("main[data-model]");
  if(!main) return;
  const model = main.dataset.model;
  const data = await readJSON("../data/sets.json");
  const items = data.filter(x => x.model === model);
  const list = $("#list");
  list.innerHTML = items.map(x=>`
    <a class="card" href="../set/index.html?id=${encodeURIComponent(x.id)}">
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
