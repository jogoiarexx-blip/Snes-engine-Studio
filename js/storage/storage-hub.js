/** Unified storage gateway: projects, game saves, preferences and assets. */
(function(g){'use strict';
const key=(ns,id)=>'snes:'+ns+':'+id;function ls(){try{return localStorage}catch(_){return null}}
const json={get(ns,id,fallback=null){try{const v=ls()?.getItem(key(ns,id));return v?JSON.parse(v):fallback}catch(_){return fallback}},set(ns,id,v){try{ls()?.setItem(key(ns,id),JSON.stringify(v));return v}catch(_){return null}},remove(ns,id){try{ls()?.removeItem(key(ns,id));return true}catch(_){return false}}};
const legacy={get(id,fallback=null){try{const v=ls()?.getItem(id);return v==null?fallback:v}catch(_){return fallback}},set(id,v){try{ls()?.setItem(id,v);return true}catch(_){return false}},remove(id){try{ls()?.removeItem(id);return true}catch(_){return false}}};
const hub={
 projects:{get:id=>json.get('project',id),set:(id,v)=>json.set('project',id,v),remove:id=>json.remove('project',id)},
 saves:{get:id=>json.get('save',id),set:(id,v)=>json.set('save',id,v),remove:id=>json.remove('save',id)},
 preferences:{get:(id,d)=>json.get('pref',id,d),set:(id,v)=>json.set('pref',id,v),remove:id=>json.remove('pref',id)},
 get assets(){return g.SNESAssetDatabase||g.SNESAssetDB||null},
 raw:json,legacy
};
g.SNESStorage=hub;
})(typeof window!=='undefined'?window:globalThis);
