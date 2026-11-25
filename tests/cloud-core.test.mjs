import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHmac} from 'node:crypto';
const source=(await readFile(new URL('../worker.js',import.meta.url),'utf8')).replace('import HTML from "./index.html";','const HTML="<script></script>";').replace('import {readRuns} from "./github-runs.js";','const readRuns=async()=>({runs:[]});');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const base='https://lts-pipeline.pasqualemilano0.workers.dev';
const env={GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',SESSION_SECRET:'synthetic-test-only-'.repeat(4)};
const payload=Buffer.from(JSON.stringify({kind:'session',sub:'287172713',exp:Math.floor(Date.now()/1000)+60})).toString('base64url');
const cookie='__Host-lts_session='+payload+'.'+createHmac('sha256',env.SESSION_SECRET).update(payload).digest('base64url');
test('D1 routes deny anonymous, cross-site, unsupported query and origin',async()=>{
  const db={prepare(){throw Error('unexpected db access')}};
  const send=(path,headers={},method='GET')=>worker.fetch(new Request(base+'/api/cloud/'+path,{method,headers}),{...env,CLOUD_DB:db});
  assert.equal((await send('status')).status,401);
  assert.equal((await send('status',{Cookie:cookie,'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await send('status?sql=other',{Cookie:cookie})).status,400);
  assert.equal((await send('files',{Cookie:cookie,Origin:'https://other.test'},'POST')).status,403);
  assert.equal((await send('files',{Cookie:cookie,Origin:base,'X-File-Name':'../bad'},'POST')).status,400);
  assert.equal((await send('files',{Cookie:cookie,Origin:base,'X-File-Name':'a.txt','Content-Type':'application/octet-stream','Content-Length':'65537'},'POST')).status,413);
});
test('D1 health and bounded upload with prepared parameters',async()=>{
  let captured;
  const db={prepare(sql){return {first:async()=>({schema_version:1,file_count:0,created_at:'test'}),bind(...args){captured={sql,args};return {first:async()=>({slot:1})}}}}};
  const r=await worker.fetch(new Request(base+'/api/cloud/status',{headers:{Cookie:cookie}}),{...env,CLOUD_DB:db});
  assert.equal(r.status,200);assert.equal((await r.json()).database,'D1');
  const q=await worker.fetch(new Request(base+'/api/cloud/files',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/octet-stream','X-File-Name':'sample.txt'},body:'abc'}),{...env,CLOUD_DB:db});
  assert.equal(q.status,201);assert.equal((await q.json()).sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.match(captured.sql,/INSERT INTO cloud_files/);assert.equal(captured.args[0],'sample.txt');assert.deepEqual(new Uint8Array(captured.args[1]),new TextEncoder().encode('abc'));
});
