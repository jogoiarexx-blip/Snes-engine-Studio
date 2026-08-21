/** SNES Engine Studio 1.0 — persistent asset database */
(function(global){
'use strict';
const DB='snes_engine_assets_v1', VER=1, STORE='assets';
function open(){return new Promise(res=>{if(!global.indexedDB)return res(null);const r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)});}
function toDataURL(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file)});}
async function put(file,id){id=id||('asset_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7));const dataUrl=await toDataURL(file);const rec={id,name:file.name,type:file.type||'application/octet-stream',size:file.size||0,kind:(file.type||'').startsWith('image')?'image':(file.type||'').startsWith('audio')?'audio':'json',dataUrl,updatedAt:Date.now()};const db=await open();if(db)await new Promise(res=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(rec);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)});return rec;}
async function saveRecord(rec){const db=await open();if(!db)return false;return new Promise(res=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(rec);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)});}
async function get(id){const db=await open();if(!db)return null;return new Promise(res=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null)});}
async function remove(id){const db=await open();if(!db)return false;return new Promise(res=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)});}
async function hydrateProject(project){const assets=project?.studio?.assets||[];for(const a of assets){if(a.dataUrl)continue;const r=await get(a.id);if(r?.dataUrl)a.dataUrl=r.dataUrl;}return project;}
function runtimeUrl(a){return a?.dataUrl||a?.url||'';}
global.SNESAssetDB={open,put,saveRecord,get,remove,hydrateProject,toDataURL,runtimeUrl};
})(typeof window!=='undefined'?window:globalThis);
