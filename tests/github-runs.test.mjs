import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../github-runs.js',import.meta.url),'utf8');
const adapter=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('fixed GET destination, bounded response and cache',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url,opts)=>{
    calls++;assert.equal(url,'https://api.github.com/repos/pasqualemilano0-rgb/LTS-Cloud/actions/runs?per_page=20');
    assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.headers.Authorization,undefined);
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
