async function readJSON(u){ const r=await fetch(u,{cache:"no-store"}); return r.json(); }
function esc(s){return String(s).replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));}
function qp(n){return new URL(location.href).searchParams.get(n);}
async function modelPage(){
  const m=document.querySelector("main")?.dataset?.model; if(!m) return;
  const data=(await readJSON("/data/sets.json")).filter(x=>x.model===m);
  const list=document.querySelector("#list"); const q=document.querySelector("#q");
  function render(){
    const s=(q.value||"").toLowerCase().trim();
    const items=data.filter(x=>(x.title+" "+x.tags.join(" ")+" "+(x.description||"")).toLowerCase().includes(s));
    list.innerHTML=items.map(x=>`<a href="/set/index.html?id=${encodeURIComponent(x.id)}"><b>${esc(x.title)}</b><div>${esc((x.description||"").slice(0,120))}</div></a><hr/>`).join("");
  }
  q.addEventListener("input",render); render();
}
async function setPage(){
  const id=qp("id"); if(!id) return;
  const x=(await readJSON("/data/sets.json")).find(s=>s.id===id);
  if(!x){ document.querySelector("#title").textContent="Set bulunamadı"; return; }
  document.querySelector("#title").textContent=x.title;
  document.querySelector("#desc").textContent=x.description||"";
  const a=document.querySelector("#dl"); a.href=x.download_url||"#"; a.textContent="İndir ("+(x.credits||1)+" kredi)";
}
document.addEventListener("DOMContentLoaded",()=>{modelPage(); setPage();});
