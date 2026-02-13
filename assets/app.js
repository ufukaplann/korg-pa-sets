
function isLoggedIn(){
    return localStorage.getItem("user") !== null;
}

function updateLock(){
    if(isLoggedIn()){
        document.querySelectorAll(".card").forEach(c=>c.classList.remove("locked"));
    }
}

function login(){
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;
    if(u && p){
        localStorage.setItem("user",u);
        alert("Giriş başarılı");
        window.location.href="index.html";
    }
}

function logout(){
    localStorage.removeItem("user");
    location.reload();
}

document.addEventListener("DOMContentLoaded",updateLock);
