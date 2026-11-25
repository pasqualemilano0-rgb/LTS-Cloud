// Read-only public Actions endpoint, no token, no configurable destination.
const ROOT="https://api.github.com/repos/pasqualemilano0-rgb/LTS-Cloud/actions/runs?per_page=20";
let cache;
const failure=code=>Object.assign(new Error(code),{code});
export async function readRuns(){
  if(cache && Date.now()-cache.at<60000)return cache.data;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    let r,p;
    try {
      try {r=await globalThis.fetch(ROOT,{method:"GET",redirect:"manual",signal:controller.signal,headers:{"Accept":"application/vnd.github+json","User-Agent":"LTS-Cloud/0.5.1","X-GitHub-Api-Version":"2022-11-28"}});}
      catch {throw failure(controller.signal.aborted?"GH-TIMEOUT":"GH-NETWORK");}
      if(r.status>=300&&r.status<400)throw failure("GH-REDIRECT");
      if(r.status===429||(r.status===403&&r.headers.get("X-RateLimit-Remaining")==="0"))throw failure("GH-RATE-LIMIT");
      if(r.status===403)throw failure("GH-FORBIDDEN");
      if(r.status===404)throw failure("GH-NOT-FOUND");
      if(!r.ok)throw failure("GH-HTTP");
      try{p=await r.json()}catch{throw failure(controller.signal.aborted?"GH-TIMEOUT":"GH-INVALID-JSON")}
    }finally{clearTimeout(timer)}
    if(!Array.isArray(p?.workflow_runs))throw failure("GH-INVALID-JSON");
    const txt=v=>typeof v==="string"?v.slice(0,160):"";
    const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
    const runs=p.workflow_runs.slice(0,20).filter(x=>x&&Number.isSafeInteger(x.id)&&x.id>0).map(x=>({id:x.id,name:txt(x.name),branch:txt(x.head_branch),status:txt(x.status),conclusion:txt(x.conclusion),started:date(x.run_started_at),updated:date(x.updated_at)}));
    const data={repository:"LTS-Cloud",fetchedAt:new Date().toISOString(),runs};
    cache={at:Date.now(),data};return data;
}
