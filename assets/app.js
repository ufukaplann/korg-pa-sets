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

function fmtDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", {year:"numeric", month:"short", day:"2-digit"});
  }catch(e){ return iso || ""; }
}

async function loadModel(){
  const main = $("main[data-model]");
  if(!main) return;

  const model = main.dataset.model;
  const data = await readJSON("../data/sets.json");
  let items = data.filter(x => x.model === model);

  const q = $("#q");
  const sort = $("#sort");
  const list = $("#list");
  const count = $("#count");

  function render(){
    const s = (q.value || "").trim().toLowerCase();

    let filtered = items.filter(x=>{
      const blob = (x.title+" "+(x.style||"")+" "+(x.description||"")+" "+(x.tags||[]).join(" ")).toLowerCase();
      return blob.includes(s);
    });

    const mode = sort.value;
    if(mode === "new") filtered.sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""));
    if(mode === "az") filtered.sort((a,b)=>(a.title||"").localeCompare(b.title||""));
    if(mode === "tag") filtered.sort((a,b)=>((a.tags?.[0]||"").localeCompare(b.tags?.[0]||"")));

    count.textContent = filtered.length;

    list.innerHTML = filtered.map(x=>`
      <a class="card" href="../set/index.html?id=${encodeURIComponent(x.id)}">
        <div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between">
          <div>
            <h3>${esc(x.title)}</h3>
            <p>${esc(x.style||"")} ${x.style ? "•" : ""} ${esc((x.description||"").slice(0,120))}${(x.description||"").length>120?"…":""}</p>
            <div class="pills">
              <span class="pill">${esc(x.model)}</span>
              <span class="pill">${esc(x.category||"Set")}</span>
              ${(x.tags||[]).slice(0,3).map(t=>`<span class="pill">${esc(t)}</span>`).join("")}
            </div>
          </div>
          <span class="pill">${fmtDate(x.created_at||"")}</span>
        </div>
      </a>
    `).join("");
  }

  q.addEventListener("input", render);
  sort.addEventListener("change", render);
  render();
}

async function loadSet(){
  const id = qp("id");
  if(!id) return;

  const data = await readJSON("../data/sets.json");
  const x = data.find(s=>s.id === id);

  if(!x){
    $("#title").textContent = "Set bulunamadı";
    $("#desc").textContent = "Bu set yok. Geri dönüp listeden seç.";
    $("#dl").style.display = "none";
    return;
  }

  $("#title").textContent = x.title;
  $("#model").textContent = x.model;
  $("#date").textContent = fmtDate(x.created_at||"");
  $("#desc").textContent = x.description || "";
  $("#tags").innerHTML = (x.tags||[]).map(t=>`<span class="pill">${esc(t)}</span>`).join(" ");
  $("#howto").textContent = x.howto || "ZIP/RAR çıkar → USB → Media > Load.";

  const dl = $("#dl");
  dl.href = x.download_url || "#";

  const pv = $("#preview");
  if(x.preview_url){
    pv.innerHTML = `<iframe src="${esc(x.preview_url)}" allowfullscreen></iframe>`;
  } else {
    pv.innerHTML = `<div class="small" style="padding:12px">Preview yok.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  loadModel().catch(console.error);
  loadSet().catch(console.error);
});
