/** SNES Engine Studio 1.0 — validador completo */
(function(global){'use strict';
function validate(project){
 const issues=[]; if(!project){issues.push({level:'error',msg:'Projeto inválido'});return issues}
 if((project.schemaVersion||0)!==10)issues.push({level:'warning',msg:'Schema do projeto não é 10; será migrado ao salvar'});
 if(project.version!=='1.0')issues.push({level:'info',msg:'Versão do projeto será normalizada para 1.0'});
 const type=project.gameType||(project.settings&&project.settings.type)||'platform';
 const valid=['platform','topdown','top-down','action-rpg','shooter','kart-racing','kart','metroidvania','beat-em-up','beatemup'];
 if(!valid.includes(type))issues.push({level:'error',msg:'Tipo de jogo desconhecido: '+type});
 if(!project.name||!String(project.name).trim())issues.push({level:'warning',msg:'Projeto sem nome'});
 if(!project.scenes||!project.scenes.length){issues.push({level:'error',msg:'Nenhuma cena no projeto'});return issues}
 const sceneIds=new Set(), entityIds=new Set(); let players=0; const studio=project.studio||{}, assetIds=new Set((studio.assets||[]).map(a=>a.id)), animIds=new Set((studio.animations||[]).map(a=>a.id));
 project.scenes.forEach(s=>{if(!s.id)issues.push({level:'error',msg:'Cena sem id'});if(sceneIds.has(s.id))issues.push({level:'error',msg:'ID de cena duplicado: '+s.id});sceneIds.add(s.id);if(!s.layers&&!s.map)issues.push({level:'warning',msg:'Cena '+(s.name||s.id)+' sem mapa'});
  (s.entities||[]).forEach(e=>{if(!e.id)issues.push({level:'warning',msg:(s.name||s.id)+': entidade sem ID'});if(entityIds.has(e.id))issues.push({level:'error',msg:'ID de entidade duplicado: '+e.id});entityIds.add(e.id);if(e.type==='player')players++;if(e.spriteAsset&&!assetIds.has(e.spriteAsset))issues.push({level:'warning',msg:(e.name||e.id)+': sprite aponta para asset inexistente'});if(e.animationId&&!animIds.has(e.animationId))issues.push({level:'warning',msg:(e.name||e.id)+': animação inexistente'});if(e.type==='door'&&e.targetScene&&!project.scenes.find(x=>x.id===e.targetScene))issues.push({level:'error',msg:'Porta aponta para cena inexistente: '+e.targetScene});if(!Number.isFinite(+e.x)||!Number.isFinite(+e.y))issues.push({level:'warning',msg:(e.name||e.id)+': posição inválida'});if(e.components&&e.components.health&&e.hp!=null&&Number(e.components.health.current)!==Number(e.hp))issues.push({level:'warning',msg:(e.name||e.id)+': HP legado e componente Health divergentes'});if(e.components&&e.components.transform&&((+e.components.transform.x)!=(+e.x)||(+e.components.transform.y)!=(+e.y)))issues.push({level:'warning',msg:(e.name||e.id)+': Transform e posição legado divergentes'});});
  if(s.chunks){for(const [k,ch] of Object.entries(s.chunks)){if(!/^\d+,\d+$/.test(k))issues.push({level:'warning',msg:(s.name||s.id)+': chave de chunk inválida '+k});if(!ch.layers?.ground)issues.push({level:'warning',msg:(s.name||s.id)+': chunk '+k+' sem camada ground'});}}
 });
 if(players===0)issues.push({level:'error',msg:'Nenhum Player no projeto'});if(players>project.scenes.length)issues.push({level:'info',msg:'Há múltiplos Players no projeto; um por cena é o recomendado'});
 if(!project.currentScene||!project.scenes.find(s=>s.id===project.currentScene))issues.push({level:'warning',msg:'Cena atual inválida — usando a primeira'});
 const events=studio.events||[], triggers=studio.triggers||[], eventIds=new Set(events.map(e=>e.id));
 triggers.forEach(t=>{if(t.sceneId&&!sceneIds.has(t.sceneId))issues.push({level:'error',msg:'Trigger '+t.id+' aponta para cena inexistente'});if(t.eventId&&!eventIds.has(t.eventId))issues.push({level:'warning',msg:'Trigger '+t.id+' sem evento correspondente'});if((+t.w||0)<=0||(+t.h||0)<=0)issues.push({level:'warning',msg:'Trigger '+t.id+' com área inválida'})});
 events.forEach(e=>{if(e.sceneId&&!sceneIds.has(e.sceneId))issues.push({level:'error',msg:'Evento '+e.id+' aponta para cena inexistente'});if(e.triggerId&&!triggers.find(t=>t.id===e.triggerId))issues.push({level:'warning',msg:'Evento '+e.id+' aponta para trigger inexistente'});});
 (studio.bosses||[]).forEach(b=>{if(b.entityId&&!entityIds.has(b.entityId))issues.push({level:'warning',msg:'Boss '+b.name+' sem entidade vinculada'});if(!b.phases||!b.phases.length)issues.push({level:'warning',msg:'Boss '+b.name+' sem fases'})});
 (studio.animations||[]).forEach(a=>{if(!a.frames||!a.frames.length)issues.push({level:'warning',msg:'Animação '+a.name+' sem frames'})});
 (studio.assets||[]).forEach(a=>{if(!a.dataUrl&&!a.url)issues.push({level:'warning',msg:'Asset '+a.name+' sem dados persistidos'})});

 const g=project.game||{};
 if(g.startScene&&!sceneIds.has(g.startScene))issues.push({level:'error',msg:'Game Flow: cena inicial inexistente '+g.startScene});
 (g.campaign||[]).forEach(id=>{if(!sceneIds.has(id))issues.push({level:'error',msg:'Campanha contém cena inexistente: '+id})});
 const controls=g.controls||{}, used={};Object.keys(controls).forEach(action=>(controls[action]||[]).forEach(k=>{const key=String(k).toLowerCase();if(!used[key])used[key]=[];used[key].push(action)}));Object.keys(used).forEach(k=>{if(used[k].length>1&&k!=='enter')issues.push({level:'info',msg:'Controle '+k.toUpperCase()+' está vinculado a: '+used[k].join(', ')})});

 const w=studio.world||{};if((+w.logicalWidth||512)<512||(+w.logicalHeight||288)<288)issues.push({level:'warning',msg:'Mundo lógico menor que a viewport 512×288'});
 return issues;
}
global.ProjectValidator={validate};
})(typeof window!=='undefined'?window:globalThis);
