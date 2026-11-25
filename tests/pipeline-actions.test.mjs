import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
const source=(await readFile(new URL('../worker.js',import.meta.url),'utf8')).replace('import HTML from "./index.html";','const HTML="<script></script>";').replace('import {readRuns} from "./github-runs.js";','const readRuns=async()=>({runs:[]});');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const base='https://lts-pipeline.pasqualemilano0.workers.dev',root='https://api.github.com/repos/pasqualemilano0-rgb/LTS-Cloud';
const env={GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',SESSION_SECRET:'synthetic-test-only-'.repeat(4)};
const payload=Buffer.from(JSON.stringify({kind:'session',sub:'287172713',exp:Math.floor(Date.now()/1000)+600})).toString('base64url');
const cookie='__Host-lts_session='+payload+'.'+createHmac('sha256',env.SESSION_SECRET).update(payload).digest('base64url');
const send=(path,e,headers={Cookie:cookie,Origin:base},method='POST')=>worker.fetch(new Request(base+'/api/github/actions/'+path,{method,headers}),e);
test('no anonymous writes, no GET, no cross-origin, no arbitrary paths, no missing credential',async()=>{
  assert.equal((await send('dispatch',env,{})).status,401);
  assert.equal((await send('dispatch',env,{Cookie:cookie,Origin:'https://other.test'})).status,403);
  assert.equal((await send('dispatch',env,{Cookie:cookie},'GET')).status,405);
  assert.equal((await send('dispatch?ref=other',env)).status,400);
  assert.equal((await send('cancel/0',env)).status,400);
  assert.equal((await send('dispatch',env)).status,503);
});
test('fixed repository, private guard, run allowlist and atomic quota',async()=>{
  const original=globalThis.fetch;let calls=[],priv=false,quota=true,managed=true,runStatus='completed';
  const e={...env,GITHUB_ACTIONS_TOKEN:'github_'+'pat_synthetic_only',CLOUD_DB:{prepare(sql){assert.match(sql,/ON CONFLICT/);return {bind(){return {first:async()=>quota?{used:1}:null}}}}}};
  globalThis.fetch=async(url,opts)=>{
    assert.equal(opts.redirect,'manual');assert.ok(url.startsWith(root));assert.ok(opts.headers.Authorization.startsWith('Bearer '));calls.push({url,method:opts.method,body:opts.body});
    if(url===root)return Response.json({id:1471822523,private:priv,visibility:priv?'private':'public',default_branch:'main'});
    if(url===root+'/actions/runs/123')return Response.json({id:123,event:managed?'workflow_dispatch':'pull_request',head_branch:'main',head_repository:{id:1471822523},path:'.github/workflows/cloud-validation.yml',status:runStatus,conclusion:'failure'});
    return new Response(null,{status:204});
  };
  try{
    priv=true;assert.equal((await send('dispatch',e)).status,409);assert.equal(calls.length,1);
    priv=false;quota=false;assert.equal((await send('dispatch',e)).status,429);assert.equal(calls.filter(x=>x.method==='POST').length,0);
    quota=true;const ok=await send('dispatch',e);assert.equal(ok.status,202);assert.deepEqual(JSON.parse(calls.at(-1).body),{ref:'main'});assert.equal(calls.at(-1).url,root+'/actions/workflows/cloud-validation.yml/dispatches');
    managed=false;assert.equal((await send('rerun/123',e)).status,403);
    managed=true;assert.equal((await send('cancel/123',e)).status,409);
    assert.equal((await send('rerun/123',e)).status,202);assert.equal(calls.at(-1).url,root+'/actions/runs/123/rerun');
    runStatus='in_progress';assert.equal((await send('cancel/123',e)).status,202);assert.equal(calls.at(-1).url,root+'/actions/runs/123/cancel');
  }finally{globalThis.fetch=original}
});
