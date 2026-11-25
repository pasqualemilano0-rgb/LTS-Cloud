import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptBackup,restoreBackup} from '../backup/lab.mjs';
import {cpuTotals,cpuPercent,percent,sampleLocal,evaluate,EventLog} from '../monitor/lab.mjs';

test('encrypted file backup and verified restore, wrong key and tamper denied',()=>{
  const dir=mkdtempSync(join(tmpdir(),'lts-backup-'));
  const key=randomBytes(32);
  try{
    const plain=Buffer.from('Synthetic LTS backup only');
    const source=join(dir,'source.txt'), encrypted=join(dir,'backup.ltsb'), restored=join(dir,'restored.txt');
    writeFileSync(source,plain,{mode:0o600,flag:'wx'});
    const blob=encryptBackup(readFileSync(source),key);
    assert.notDeepEqual(encryptBackup(plain,key),blob);
    assert.equal(blob.includes(plain),false);
    writeFileSync(encrypted,blob,{mode:0o600,flag:'wx'});
    rmSync(source);
    writeFileSync(restored,restoreBackup(readFileSync(encrypted),key),{mode:0o600,flag:'wx'});
    assert.deepEqual(readFileSync(restored),plain);
    assert.throws(()=>restoreBackup(blob,randomBytes(32)),/authentication failed/);
    for(const index of [5,17,blob.length-1]){
      const tampered=Buffer.from(blob);tampered[index]^=1;
      assert.throws(()=>restoreBackup(tampered,key),/authentication failed/);
    }
    assert.throws(()=>restoreBackup(blob.subarray(0,20),key),/format/);
    assert.throws(()=>restoreBackup(Buffer.concat([Buffer.from('WRONG'),blob.subarray(5)]),key),/format/);
    assert.throws(()=>encryptBackup(Buffer.alloc(1024*1024+1),key),/size/);
    assert.throws(()=>encryptBackup(Buffer.alloc(0),key),/size/);
    assert.throws(()=>encryptBackup(plain,Buffer.alloc(31)),/key/);
  }finally{key.fill(0);rmSync(dir,{recursive:true,force:true})}
  assert.equal(existsSync(dir),false);
});
test('monitor thresholds, CPU delta, unknown metrics and bounded events',()=>{
  assert.equal(cpuPercent({total:100,idle:60},{total:200,idle:80}),80);
  assert.equal(cpuPercent({total:100,idle:60},{total:100,idle:60}),null);
  assert.equal(percent(101,100),null);
  const events=evaluate({cpu:80,ram:90,disk:null},[{name:'hosting-lab',status:'down'},{name:'database-lab',status:'ok'}]);
  assert.deepEqual(events,[{resource:'cpu',status:'warning'},{resource:'ram',status:'critical'},{resource:'disk',status:'unknown'},{resource:'hosting-lab',status:'critical'}]);
  assert.deepEqual(evaluate({cpu:79,ram:10,disk:0}),[]);
  const log=new EventLog();
  for(let i=0;i<110;i++)log.append(events,'synthetic');
  assert.equal(log.list().length,100);
  log.list()[0].resource='altered';
  assert.notEqual(log.list()[0].resource,'altered');
});
test('actual local lab sampling has bounded values and no server connection',async()=>{
  const previous=cpuTotals();
  await new Promise(resolve=>setTimeout(resolve,100));
  const sample=sampleLocal(previous,tmpdir());
  for(const value of [sample.cpu,sample.ram,sample.disk])assert.ok(value===null||(Number.isFinite(value)&&value>=0&&value<=100));
  assert.notEqual(sample.ram,null);
  assert.notEqual(sample.disk,null);
});
