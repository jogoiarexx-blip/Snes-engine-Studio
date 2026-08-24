/** Complete asset/reference dependency graph. */
(function(g){'use strict';
function scan(project){
  const out=new Map(),assets=new Set((project?.studio?.assets||[]).map(a=>a.id).filter(Boolean)),seen=new WeakSet();
  const add=(id,ref)=>{if(!assets.has(id))return;if(!out.has(id))out.set(id,[]);out.get(id).push(ref)};
  function walk(v,path,meta){
    if(v==null)return;
    if(typeof v==='string'){add(v,Object.assign({kind:meta?.kind||'reference',id:meta?.id||'',path},meta||{}));return}
    if(typeof v!=='object')return;if(seen.has(v))return;seen.add(v);
    if(path==='studio.assets')return; // definitions are not usages
    if(Array.isArray(v)){v.forEach((x,i)=>walk(x,path+'['+i+']',meta));return}
    const nextMeta=Object.assign({},meta||{});
    if(v.id&&path.includes('scenes')){nextMeta.kind=v.type||'entity';nextMeta.id=v.id}
    else if(v.id&&path.includes('prefabs')){nextMeta.kind='prefab';nextMeta.id=v.id}
    else if(v.id&&path.includes('animations')){nextMeta.kind='animation';nextMeta.id=v.id}
    for(const [k,x] of Object.entries(v))walk(x,path?(path+'.'+k):k,nextMeta);
  }
  walk(project,'',{kind:'project',id:project?.id||''});
  return out;
}
function refs(project,id){return scan(project).get(id)||[]}
g.SNESDependencyGraph={scan,refs};
})(typeof window!=='undefined'?window:globalThis);
