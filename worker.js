import HTML from "./index.html";
const BASE = "https://lts-pipeline.pasqualemilano0.workers.dev";
const CALLBACK = BASE + "/auth/callback";
const OWNER = "287172713";
const STATE = "__Host-lts_oauth";
const SESSION = "__Host-lts_session";
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64 = value => Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"=")), x=>x.charCodeAt(0));
const random = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const now = () => Math.floor(Date.now()/1000);
const cookie = (name,value,age) => name+"="+value+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age="+age;
function readCookie(req,name) {
  const values = (req.headers.get("Cookie")||"").split(";").map(s=>s.trim()).filter(s=>s.startsWith(name+"="));
  return values.length===1 ? values[0].slice(name.length+1) : "";
}
async function key(env) {
  return crypto.subtle.importKey("raw",enc.encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
async function seal(value,env) {
  const payload=b64(enc.encode(JSON.stringify(value)));
  return payload+"."+b64(await crypto.subtle.sign("HMAC",await key(env),enc.encode(payload)));
}
async function unseal(value,kind,env) {
  try {
    if(!value || value.length>4096) return null;
    const parts=value.split(".");
    if(parts.length!==2 || !parts.every(p=>/^[A-Za-z0-9_-]+$/.test(p))) return null;
    if(!await crypto.subtle.verify("HMAC",await key(env),unb64(parts[1]),enc.encode(parts[0]))) return null;
    const data=JSON.parse(dec.decode(unb64(parts[0])));
    return data.kind===kind && Number.isSafeInteger(data.exp) && data.exp>now() ? data : null;
  } catch { return null; }
}
function reply(body,status=200,extra={},cookies=[]) {
  const h=new Headers({"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY","Referrer-Policy":"no-referrer","Strict-Transport-Security":"max-age=31536000","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'","Permissions-Policy":"camera=(), microphone=(), geolocation=()"});
  for(const [k,v] of Object.entries(extra)) h.set(k,v);
  for(const c of cookies) h.append("Set-Cookie",c);
  return new Response(body,{status,headers:h});
}
const redirect=(url,cookies=[])=>reply(null,303,{Location:url},cookies);
function authFailure(code,status,clear) {
  return reply(`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LTS Pipeline — Accesso</title><style>body{font:16px system-ui;background:#f4f6f8;color:#20262d;margin:0;padding:24px}main{max-width:480px;margin:10vh auto;background:white;border:1px solid #ddd;padding:28px;border-radius:10px}a{display:block;background:#137e58;color:white;text-decoration:none;padding:12px;text-align:center;border-radius:6px}code{overflow-wrap:anywhere}</style><main><h1>Accesso non completato</h1><p>Il collegamento con GitHub non è riuscito.</p><p>Codice: <code>${code}</code></p><a href="/">Riprova dalla pagina di accesso</a></main></html>`,status,{"Content-Type":"text/html; charset=utf-8"},clear);
}
function login(configured) {
  return reply(`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LTS Pipeline — Accesso</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6f7;color:#20262d;font:16px system-ui;min-height:100vh;display:grid;place-items:center;padding:22px}main{background:white;border:1px solid #d8dde1;border-radius:12px;width:min(100%,440px);padding:36px}small{color:#52606b}a{display:block;text-align:center;background:#137e58;color:white;padding:13px;border-radius:6px;text-decoration:none;font-weight:650;margin-top:25px}h1{margin:14px 0 8px}p{line-height:1.6}</style><main><small>WORKSPACE PRIVATO · CI/CD</small><h1>LTS Pipeline</h1><p>${configured?"Accedi con il tuo account GitHub autorizzato.":"Accesso in configurazione. La console resta protetta."}</p>${configured?'<a href="/auth/login">Accedi con GitHub</a>':'<small>Configurazione OAuth non completata.</small>'}</main></html>`,configured?200:503,{"Content-Type":"text/html; charset=utf-8"});
}
async function consolePage() {
  const scripts=[...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const hashes=await Promise.all(scripts.map(async m=>"'sha256-"+btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(m[1])))))+"'"));
  const page=HTML.replace('<span>Workspace personale</span>','<span>Workspace personale · DEMO</span><form action="/auth/logout" method="post"><button type="submit">Esci</button></form>');
  return reply(page,200,{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; script-src "+hashes.join(" ")+"; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; connect-src 'none'"});
}
export default {async fetch(req,env) {
  const u=new URL(req.url);
  if(u.origin!==BASE) return reply("Accesso negato",403);
  if(!["GET","POST"].includes(req.method)) return reply("Metodo non consentito",405);
  const configured=typeof env.GITHUB_CLIENT_ID==="string" && !!env.GITHUB_CLIENT_ID && typeof env.GITHUB_CLIENT_SECRET==="string" && !!env.GITHUB_CLIENT_SECRET && typeof env.SESSION_SECRET==="string" && env.SESSION_SECRET.length>=43;
  if(!configured) return u.pathname==="/" && req.method==="GET"?login(false):reply("Configurazione non completata",503);
  let stage = "LTS-AUTH-01";
  try {
    if(u.pathname==="/auth/login" && req.method==="GET") {
      stage = "LTS-AUTH-02";
      const state=random(), verifier=random();
      const challenge=b64(await crypto.subtle.digest("SHA-256",enc.encode(verifier)));
      const target=new URL("https://github.com/login/oauth/authorize");
      target.search=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID.trim(),redirect_uri:CALLBACK,state,code_challenge:challenge,code_challenge_method:"S256",allow_signup:"false"}).toString();
      stage = "LTS-AUTH-03";
      return redirect(target.toString(),[cookie(STATE,await seal({kind:"oauth",state,verifier,exp:now()+600},env),600)]);
    }
    if(u.pathname==="/auth/callback" && req.method==="GET") {
      const clear=[cookie(STATE,"",0),cookie(SESSION,"",0)];
      const flow=await unseal(readCookie(req,STATE),"oauth",env);
      const code=u.searchParams.get("code");
      if(!flow || u.searchParams.getAll("state").length!==1 || u.searchParams.get("state")!==flow.state || u.searchParams.getAll("code").length!==1 || !code || code.length>1024 || u.searchParams.has("error")) return reply("Accesso non valido. Torna alla pagina iniziale.",403,{},clear);
      stage = "LTS-AUTH-04";
      const form=new URLSearchParams({client_id:env.GITHUB_CLIENT_ID.trim(),client_secret:env.GITHUB_CLIENT_SECRET.trim(),code,redirect_uri:CALLBACK,code_verifier:flow.verifier,grant_type:"authorization_code"});
      let tokenResponse;
      try {
        tokenResponse=await globalThis.fetch("https://github.com/login/oauth/access_token",{
          method:"POST",
          redirect:"manual",
          headers:{"Accept":"application/json","Content-Type":"application/x-www-form-urlencoded","User-Agent":"LTS-Pipeline/0.3"},
          body:form.toString()
        });
      } catch (err) {
        const kind=err?.name==="TypeError"?"NETWORK":err?.name==="AbortError"?"TIMEOUT":"EXCEPTION";
        return authFailure("LTS-AUTH-04-"+kind,502,clear);
      }
      if(tokenResponse.status>=300 && tokenResponse.status<400) return authFailure("LTS-AUTH-04-REDIRECT-"+tokenResponse.status,502,clear);
      if(!tokenResponse.ok) return authFailure("LTS-AUTH-04-HTTP-"+tokenResponse.status,502,clear);
      stage = "LTS-AUTH-05";
      const token=await tokenResponse.json();
      if(!token || typeof token.access_token!=="string" || !token.access_token || token.error) {
        const allowed=["incorrect_client_credentials","bad_verification_code","redirect_uri_mismatch","invalid_grant","invalid_request","invalid_client","unverified_user_email","access_denied","unsupported_grant_type"];
        return authFailure("LTS-AUTH-05-"+(allowed.includes(token?.error)?token.error:"INVALID_RESPONSE"),403,clear);
      }
      stage = "LTS-AUTH-06";
      let userResponse;
      try {
        userResponse=await globalThis.fetch("https://api.github.com/user",{
          method:"GET",
          redirect:"manual",
          headers:{"Authorization":"Bearer "+token.access_token,"Accept":"application/vnd.github+json","User-Agent":"LTS-Pipeline/0.3","X-GitHub-Api-Version":"2022-11-28"}
        });
      } catch (err) {
        const kind=err?.name==="TypeError"?"NETWORK":err?.name==="AbortError"?"TIMEOUT":"EXCEPTION";
        return authFailure("LTS-AUTH-06-"+kind,502,clear);
      }
      if(userResponse.status>=300 && userResponse.status<400) return authFailure("LTS-AUTH-06-REDIRECT-"+userResponse.status,502,clear);
      if(!userResponse.ok) return authFailure("LTS-AUTH-06-HTTP-"+userResponse.status,502,clear);
      let user;
      try { user=await userResponse.json(); } catch { return authFailure("LTS-AUTH-06-INVALID-JSON",502,clear); }
      if(!user || !Number.isSafeInteger(user.id) || String(user.id)!==OWNER) return reply("Account non autorizzato",403,{},clear);
      stage = "LTS-AUTH-07";
      const ttl=3600;
      return redirect(BASE+"/",[cookie(STATE,"",0),cookie(SESSION,await seal({kind:"session",sub:OWNER,exp:now()+ttl},env),ttl)]);
    }
    if(u.pathname==="/auth/logout" && req.method==="POST") {
      if(req.headers.get("Origin")!==BASE) return reply("Origine non autorizzata",403);
      return redirect(BASE+"/",[cookie(SESSION,"",0),cookie(STATE,"",0)]);
    }
    if(u.pathname!=="/" || req.method!=="GET") return reply("Non trovato",404);
    const session=await unseal(readCookie(req,SESSION),"session",env);
    stage = "LTS-AUTH-08";
    return session?.sub===OWNER?await consolePage():login(true);
  } catch { return authFailure(stage,503,[cookie(STATE,"",0),cookie(SESSION,"",0)]); }
}};
