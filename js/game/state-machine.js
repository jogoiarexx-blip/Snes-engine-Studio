/** Deterministic game state machine used by Game Flow and runtime shells. */
(function(g){'use strict';
class Machine{
 constructor(ctx){this.ctx=ctx||{};this.states=new Map();this.current=null;this.name='';this.transition=Promise.resolve()}
 register(name,state){this.states.set(name,state||{});return this}
 change(name,payload){const next=this.states.get(name);if(!next)return Promise.reject(new Error('Game state ausente: '+name));if(this.name===name)return this.transition;const prev=this.current,prevName=this.name;this.name=name;this.current=next;g.SNESEvents?.emit('gamestate:change',{name,previous:prevName,payload});this.transition=this.transition.then(async()=>{if(prev?.exit)await prev.exit(this.ctx,payload);if(next.enter)await next.enter(this.ctx,payload)}).catch(e=>{g.SNESLogger?.error?.('state','Falha de transição '+prevName+' → '+name,e);throw e});return this.transition}
 update(dt){this.current?.update?.(this.ctx,dt)}
 render(ctx){this.current?.render?.(this.ctx,ctx)}
}
g.SNESGameStateMachine={create:c=>new Machine(c),Machine};
})(typeof window!=='undefined'?window:globalThis);
