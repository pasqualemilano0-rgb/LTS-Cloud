import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../github-runs.js',import.meta.url),'utf8');
const adapter=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('fixed GET destination, bounded response and cache',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url,opts)=>{
    calls++;assert.equal(url,'https://api.github.com/repos/pasqualemilano0-rgb/LTS-Cloud/actions/runs?per_page=20');
    assert.equal(opts.method,'GET');assert.equal(opts.redirect,'manual');assert.equal(opts.headers.Authorization,undefined);
    return Response.json({workflow_runs:Array.from({length:25},(_,i)=>({id:i+1,name:'test',head_branch:'main',status:'completed',conclusion:'success',private_field:'omit'}))});
  };
  try{const r=await adapter.readRuns();assert.equal(r.runs.length,20);assert.equal(r.runs[0].private_field,undefined);await adapter.readRuns();assert.equal(calls,1)}finally{globalThis.fetch=original}
});
test('API authorization and method checks before upstream call',async()=>{
  const src=(await readFile(new URL('../worker.js',import.meta.url),'utf8')).replace('import HTML from "./index.html";','const HTML="<script></script>";').replace('import {readRuns} from "./github-runs.js";','const readRuns=()=>{throw Error("unexpected upstream")};');
  const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
  const url='https://lts-pipeline.pasqualemilano0.workers.dev/api/github/runs';
  const env={GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',SESSION_SECRET:'test'.repeat(12)};
  assert.equal((await worker.fetch(new Request(url),env)).status,401);
  assert.equal((await worker.fetch(new Request(url,{headers:{Cookie:'__Host-lts_session=invalid.signature'}}),env)).status,401);
  assert.equal((await worker.fetch(new Request(url,{method:'POST'}),env)).status,405);
  assert.equal((await worker.fetch(new Request(url+'?repo=other'),env)).status,400);
  assert.equal((await worker.fetch(new Request(url),{})).status,503);
});

test('valid owner session succeeds; other owner, expired and cross-site sessions fail',async()=>{
  const {createHmac}=await import('node:crypto');
  const src=(await readFile(new URL('../worker.js',import.meta.url),'utf8')).replace('import HTML from "./index.html";','const HTML="<script></script>";').replace('import {readRuns} from "./github-runs.js";','const readRuns=async()=>({repository:"LTS-Cloud",runs:[]});');
  const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
  const env={GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',SESSION_SECRET:'test'.repeat(12)};
  const url='https://lts-pipeline.pasqualemilano0.workers.dev/api/github/runs';
  const now=Math.floor(Date.now()/1000);
  const cookie=(sub,exp)=>{
    const payload=Buffer.from(JSON.stringify({kind:'session',sub,exp})).toString('base64url');
    return '__Host-lts_session='+payload+'.'+createHmac('sha256',env.SESSION_SECRET).update(payload).digest('base64url');
  };
  const get=(sub,exp,extra={})=>worker.fetch(new Request(url,{headers:{Cookie:cookie(sub,exp),...extra}}),env);
  const ok=await get('287172713',now+60);
  assert.equal(ok.status,200);assert.equal(ok.headers.get('Cache-Control'),'no-store');assert.deepEqual(await ok.json(),{repository:'LTS-Cloud',runs:[],actionsConfigured:false});
  assert.equal((await get('1',now+60)).status,401);
  assert.equal((await get('287172713',now-1)).status,401);
  assert.equal((await get('287172713',now+60,{'Sec-Fetch-Site':'cross-site'})).status,403);
});

test('upstream errors are classified without disclosing response bodies',async()=>{
  const original=globalThis.fetch;
  try{
    for(const [status,headers,code] of [[403,{'X-RateLimit-Remaining':'0'},'GH-RATE-LIMIT'],[429,{},'GH-RATE-LIMIT'],[403,{},'GH-FORBIDDEN'],[404,{},'GH-NOT-FOUND'],[302,{},'GH-REDIRECT'],[500,{},'GH-HTTP']]){
      const fresh=await import('data:text/javascript;base64,'+Buffer.from(source+'\n// '+status+code).toString('base64'));
      globalThis.fetch=async()=>new Response('private diagnostic',{status,headers});
      await assert.rejects(fresh.readRuns(),err=>err.code===code&&err.message===code);
    }
    const fresh=await import('data:text/javascript;base64,'+Buffer.from(source+'\n// network').toString('base64'));
    globalThis.fetch=async()=>{throw new TypeError('secret network detail')};
    await assert.rejects(fresh.readRuns(),{code:'GH-NETWORK'});
    globalThis.fetch=async()=>new Response('not json',{status:200});
    await assert.rejects(fresh.readRuns(),{code:'GH-INVALID-JSON'});
  }finally{globalThis.fetch=original}
});
