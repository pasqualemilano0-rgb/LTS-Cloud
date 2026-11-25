// Local-only sampling; no remote network calls or external credentials.
import os from 'node:os';
import {statfsSync} from 'node:fs';
export function cpuTotals(cpus=os.cpus()){
  return cpus.reduce((sum,cpu)=>({idle:sum.idle+cpu.times.idle,total:sum.total+Object.values(cpu.times).reduce((a,b)=>a+b,0)}),{idle:0,total:0});
}
export function percent(used,total){
  if(!Number.isFinite(used)||!Number.isFinite(total)||total<=0||used<0||used>total)return null;
  return Math.round(used/total*1000)/10;
}
export function cpuPercent(previous,current){
  const total=current.total-previous.total, idle=current.idle-previous.idle;
  return percent(total-idle,total);
}
export function sampleLocal(previous, path){
  const current=cpuTotals();
  const total=os.totalmem(),free=os.freemem();
  let disk=null;
  try{const s=statfsSync(path);disk=percent(s.blocks-s.bavail,s.blocks)}catch{}
  return {current,cpu:cpuPercent(previous,current),ram:percent(total-free,total),disk};
}
export function evaluate(metrics,services=[]){
  const events=[];
  for(const name of ['cpu','ram','disk']){
    const value=metrics[name];
    if(value===null||!Number.isFinite(value)||value<0||value>100)events.push({resource:name,status:'unknown'});
    else if(value>=90)events.push({resource:name,status:'critical'});
    else if(value>=80)events.push({resource:name,status:'warning'});
  }
  for(const service of services.slice(0,20)){
    if(!['hosting-lab','database-lab','storage-lab'].includes(service.name))continue;
    if(service.status!=='ok')events.push({resource:service.name,status:service.status==='down'?'critical':'unknown'});
  }
  return events;
}
export class EventLog {
  #events=[];
  append(events,at=new Date().toISOString()){
    for(const event of events.slice(0,23)){
      if(!['cpu','ram','disk','hosting-lab','database-lab','storage-lab'].includes(event.resource)||!['critical','warning','unknown'].includes(event.status))continue;
      this.#events.push({resource:event.resource,status:event.status,at});
      if(this.#events.length>100)this.#events.shift();
    }
  }
  list(){return this.#events.map(e=>({...e}))}
}
