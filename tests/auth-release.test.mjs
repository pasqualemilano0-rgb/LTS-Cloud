import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const src=source.replace('import HTML from "./index.html";','const HTML='+JSON.stringify(html)+';').replace('import {readRuns} from "./github-runs.js";','const readRuns=async()=>({runs:[]});');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const BASE='https://lts-pipeline.pasqualemilano0.workers.dev';
const env={GITHUB_CLIENT_ID:'synthetic-client',GITHUB_CLIENT_SECRET:'synthetic-secret',SESSION_SECRET:'synthetic-test-only-'.repeat(4)};
const req=(path,options)=>worker.fetch(new Request(BASE+path,options),env);
function cookie(response,name){
  const c=response.headers.getSetCookie().find(x=>x.startsWith(name+'='));
  assert.ok(c);return c.split(';')[0];
}
test('OAuth PKCE, owner gate, signed session, CSP and logout with synthetic upstream',async()=>{
  const original=globalThis.fetch;
  let user=287172713,calls=0,challenge;
  globalThis.fetch=async(url,opts)=>{
    calls++;
    if(url==='https://github.com/login/oauth/access_token'){
      assert.equal(opts.method,'POST');assert.equal(opts.redirect,'manual');
      const form=new URLSearchParams(opts.body);
      assert.equal(form.get('redirect_uri'),BASE+'/auth/callback');
      assert.equal(createHash('sha256').update(form.get('code_verifier')).digest('base64url'),challenge);
      return Response.json({access_token:'synthetic-access'});
    }
    assert.equal(url,'https://api.github.com/user');assert.equal(opts.headers.Authorization,'Bearer synthetic-access');
    return Response.json({id:user});
  };
  try{
    const loginPage=await req('/');
    assert.equal(loginPage.status,200);assert.match(await loginPage.text(),/Accedi con GitHub/);
    const start=await req('/auth/login');
    assert.equal(start.status,303);
    const loc=new URL(start.headers.get('Location'));
    assert.equal(loc.origin,'https://github.com');assert.equal(loc.searchParams.get('code_challenge_method'),'S256');
    assert.equal(loc.searchParams.has('scope'),false);
    challenge=loc.searchParams.get('code_challenge');
    const state=loc.searchParams.get('state'), flow=cookie(start,'__Host-lts_oauth');
    assert.match(start.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
    assert.equal((await req('/auth/callback?code=test&state=bad',{headers:{Cookie:flow}})).status,403);
    assert.equal(calls,0);
    const callback='/auth/callback?code=test&state='+encodeURIComponent(state);
    const success=await req(callback,{headers:{Cookie:flow}});
    assert.equal(success.status,303);
    const session=cookie(success,'__Host-lts_session');
    assert.match(success.headers.get('set-cookie'),/Max-Age=3600/);
    const page=await req('/',{headers:{Cookie:session}});
    assert.equal(page.status,200);
    assert.equal(page.headers.get('Cache-Control'),'no-store');
    assert.equal(page.headers.get('X-Frame-Options'),'DENY');
    assert.equal(page.headers.get('X-Content-Type-Options'),'nosniff');
    const content=await page.text();assert.match(content,/1\.0\.0-rc\.2/);
    for(const match of content.matchAll(/<script>([\s\S]*?)<\/script>/g)){
      assert.ok(page.headers.get('Content-Security-Policy').includes("'sha256-"+createHash('sha256').update(match[1]).digest('base64')+"'"));
    }
    assert.ok(!content.includes('synthetic-access'));
    assert.ok(!page.headers.get('Content-Security-Policy').includes("unsafe-eval"));
    assert.equal((await req('/auth/logout',{method:'POST',headers:{Origin:'https://other.test',Cookie:session}})).status,403);
    const out=await req('/auth/logout',{method:'POST',headers:{Origin:BASE,Cookie:session}});
    assert.equal(out.status,303);assert.match(out.headers.get('set-cookie'),/__Host-lts_session=;.*Max-Age=0/);
    user=1;
    assert.equal((await req(callback,{headers:{Cookie:flow}})).status,403);
  }finally{globalThis.fetch=original}
});
test('unknown origin, methods, invalid callback and missing config fail closed',async()=>{
  assert.equal((await worker.fetch(new Request('https://other.test/'),env)).status,403);
  assert.equal((await req('/',{method:'DELETE'})).status,405);
  assert.equal((await req('/auth/callback?code=test&state=test')).status,403);
  assert.equal((await worker.fetch(new Request(BASE+'/'),{})).status,503);
  assert.equal((await req('/api/github/runs')).status,401);
});
