// Read-only public Actions endpoint, no token, no configurable destination.
const ROOT="https://api.github.com/repos/pasqualemilano0-rgb/LTS-Cloud/actions/runs?per_page=20";
let cache;
export async function readRuns(){
  if(cache && Date.now()-cache.at<60000)return cache.data;
    const r=await globalThis.fetch(ROOT,{method:"GET",redirect:"error",signal:AbortSignal.timeout(8000),headers:{"Accept":"application/vnd.github+json","User-Agent":"LTS-Cloud/0.5","X-GitHub-Api-Version":"2022-11-28"}});
    if(!r.ok)throw Error("GitHub unavailable");
    const p=await r.json();
    if(!Array.isArray(p.workflow_runs))throw Error("Invalid response");
    const txt=v=>typeof v==="string"?v.slice(0,160):"";
    const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
    const runs=p.workflow_runs.slice(0,20).filter(x=>x&&Number.isSafeInteger(x.id)&&x.id>0).map(x=>({id:x.id,name:txt(x.name),branch:txt(x.head_branch),status:txt(x.status),conclusion:txt(x.conclusion),started:date(x.run_started_at),updated:date(x.updated_at)}));
    const data={repository:"LTS-Cloud",fetchedAt:new Date().toISOString(),runs};
    cache={at:Date.now(),data};return data;
}
