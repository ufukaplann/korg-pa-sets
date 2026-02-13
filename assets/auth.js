const AUTH_KEY_USERS = "korg_users_v1";
const AUTH_KEY_SESSION = "korg_session_v1";
const AUTH_KEY_DL = "korg_downloads_v1";

function _load(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch(e){ return fallback; }
}
function _save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

function hashPass(p){
  let h = 0; p = String(p || "");
  for(let i=0;i<p.length;i++){ h = ((h<<5)-h) + p.charCodeAt(i); h |= 0; }
  return "h" + Math.abs(h);
}

export function currentUser(){
  return _load(AUTH_KEY_SESSION, null);
}

export function register(username, password){
  username = String(username||"").trim();
  password = String(password||"");
  if(username.length < 3) throw new Error("Kullanıcı adı en az 3 karakter.");
  if(password.length < 4) throw new Error("Şifre en az 4 karakter.");
  const users = _load(AUTH_KEY_USERS, []);
  if(users.some(x => x.username.toLowerCase() === username.toLowerCase())){
    throw new Error("Bu kullanıcı adı alınmış.");
  }
  users.push({ username, pass: hashPass(password), created_at: new Date().toISOString() });
  _save(AUTH_KEY_USERS, users);
  _save(AUTH_KEY_SESSION, { username, login_at: new Date().toISOString() });
  return { username };
}

export function login(username, password){
  username = String(username||"").trim();
  password = String(password||"");
  const users = _load(AUTH_KEY_USERS, []);
  const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if(!u) throw new Error("Kullanıcı bulunamadı.");
  if(u.pass !== hashPass(password)) throw new Error("Şifre yanlış.");
  _save(AUTH_KEY_SESSION, { username, login_at: new Date().toISOString() });
  return { username };
}

export function logout(){
  localStorage.removeItem(AUTH_KEY_SESSION);
}

export function addDownload(setObj){
  const sess = currentUser();
  if(!sess) return;
  const all = _load(AUTH_KEY_DL, {});
  const arr = all[sess.username] ?? [];
  arr.unshift({
    set_id: setObj.id,
    title: setObj.title,
    model: setObj.model,
    url: setObj.download_url,
    at: new Date().toISOString()
  });
  all[sess.username] = arr.slice(0, 200);
  _save(AUTH_KEY_DL, all);
}

export function listDownloads(){
  const sess = currentUser();
  const all = _load(AUTH_KEY_DL, {});
  return (sess && all[sess.username]) ? all[sess.username] : [];
}
