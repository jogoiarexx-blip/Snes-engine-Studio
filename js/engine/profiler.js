/** Frame profiler shared by editor/runtime with named system spans. */
(function(g){'use strict';
const P={samples:[],current:null,
 begin(){this.current={start:performance.now(),marks:{},spans:{},_spanStart:{}}},
 mark(k){if(!this.current)return;this.current.marks[k]=performance.now()-this.current.start},
 startSpan(k){if(this.current)this.current._spanStart[k]=performance.now()},
 endSpan(k){if(!this.current)return;const s=this.current._spanStart[k];if(s!=null){this.current.spans[k]=(this.current.spans[k]||0)+(performance.now()-s);delete this.current._spanStart[k]}},
 measure(k,fn){this.startSpan(k);try{return fn()}finally{this.endSpan(k)}},
 end(extra){if(!this.current)return;this.current.total=performance.now()-this.current.start;delete this.current._spanStart;Object.assign(this.current,extra||{});this.samples.push(this.current);if(this.samples.length>240)this.samples.shift();this.current=null},
 summary(){const a=this.samples.slice(-60),avgPath=(fn)=>a.length?a.reduce((s,x)=>s+(fn(x)||0),0)/a.length:0;const systems={};for(const x of a)for(const [k,v] of Object.entries(x.spans||{}))systems[k]=(systems[k]||0)+v;for(const k of Object.keys(systems))systems[k]/=Math.max(1,a.length);const frameMs=avgPath(x=>x.total);return{fps:frameMs?1000/frameMs:0,frameMs,updateMs:avgPath(x=>x.marks?.update),renderMs:avgPath(x=>x.marks?.render),systems,samples:a.length}}
};g.SNESProfiler=P;
})(typeof window!=='undefined'?window:globalThis);
