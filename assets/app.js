
async function loadModel(model){
 const res=await fetch("../data/sets.json");
 const data=await res.json();
 const list=document.getElementById("list");
 const filtered=data.filter(x=>x.model===model);
 list.innerHTML=filtered.map(x=>`<div><a href="../set/index.html?id=${x.id}">${x.title}</a><p>${x.description}</p></div>`).join("");
}
async function loadSet(){
 const params=new URLSearchParams(location.search);
 const id=params.get("id");
 if(!id)return;
 const res=await fetch("../data/sets.json");
 const data=await res.json();
 const x=data.find(s=>s.id===id);
 if(!x)return;
 document.getElementById("title").innerText=x.title;
 document.getElementById("desc").innerText=x.description;
 document.getElementById("dl").href=x.download_url;
}
