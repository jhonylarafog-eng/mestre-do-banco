// Teste dos fluxos de servidor sem precisar da rede ou de dependências externas.
'use strict';
const assert = require('node:assert/strict');
const Module = require('node:module');
const origLoad=Module._load, origInterval=global.setInterval, origNow=Date.now;
let now=1_800_000_000_000;let intervals=[];let ioInstance;
class FakeIO{
  constructor(){this.engine={clientsCount:0};this.sockets={sockets:new Map()};this.handlers={};ioInstance=this}
  on(event,cb){this.handlers[event]=cb}
  to(id){return {emit:(event,obj)=>this.sockets.sockets.get(id)?._serverEmit(event,obj)}}
  connect(id){const s=new FakeSocket(id,this);this.sockets.sockets.set(id,s);this.engine.clientsCount++;this.handlers.connection(s);return s}
}
class FakeSocket{
 constructor(id,io){this.id=id;this.io=io;this.data={};this.events={};this.sent=[];this.connected=true}
 on(e,fn){this.events[e]=fn}
 emit(e,v){this._serverEmit(e,v)}
 _serverEmit(e,v){this.sent.push({event:e,value:v})}
 client(e,v){if(!this.events[e])throw Error('Unknown client event '+e);this.events[e](v)}
 last(e){return this.sent.filter(x=>x.event===e).at(-1)?.value}
 join(){}leave(){}
 disconnect(){this.connected=false;this.events.disconnect();this.io.sockets.sockets.delete(this.id);this.io.engine.clientsCount--}
}
function fakeExpress(){const app=()=>{};app.disable=()=>{};app.use=()=>{};app.get=()=>{};return app}
fakeExpress.static=()=>()=>{};
Module._load=function(id,...rest){if(id==='express')return fakeExpress;if(id==='socket.io')return {Server:FakeIO};return origLoad.call(this,id,...rest)};
global.setInterval=(f,ms)=>{intervals.push({f,ms});return intervals.length};Date.now=()=>now;
const originalLog=console.log;console.log=()=>{};
let server;
try{server=require('../server.js')}finally{Module._load=origLoad;console.log=originalLog}
function advance(seconds){for(let s=0;s<seconds;s++){now+=1000;for(const x of intervals)if(x.ms===1000)x.f();if(s%60===59)for(const x of intervals)if(x.ms===60000)x.f()}}
function phase(s){return s.last('room_state')?.phase}
try {
 const D=require('../public/data.js');
 assert.equal(Object.keys(D.PLAYERS).length,4);
 for(const [id,roster] of Object.entries(D.PLAYERS)){
  assert.equal(roster.length,16,id+' deve ter 16 atletas');
  for(const [form]of Object.entries(D.FORMATIONS)){
   const line=D.bestLineup(id,form);assert.equal(line.length,11);assert.equal(new Set(line.map(x=>x.playerId)).size,11);
  }
 }
 const a=ioInstance.connect('alice'), b=ioInstance.connect('bob');
 a.client('make_room');const code=a.last('room_state')?.code;
 assert.equal(typeof code,'string');assert.equal(code.length,6);assert.equal(phase(a),'waiting');
 b.client('join_room',{code});assert.equal(phase(a),'countdown');assert.equal(phase(b),'countdown');
 a.client('ready',true);assert.equal(a.last('room_state').self.ready,true);
 advance(15);assert.equal(phase(a),'setup');assert.equal(phase(b),'setup');
 a.client('team','rubro');assert.equal(a.last('room_state').self.team,'rubro');
 a.client('team','__proto__');assert.equal(a.last('room_state').self.team,'rubro');
 a.client('formation','4-3-3');assert.equal(a.last('room_state').self.formation,'4-3-3');
 a.client('formation','constructor');assert.equal(a.last('room_state').self.formation,'4-3-3');
 a.client('tactics',{style:'infiltracao',general:'predador'});
 assert.equal(a.last('room_state').self.style,'infiltracao');
 a.client('slot',{slot:9,role:'constructor'});assert.notEqual(a.last('room_state').self.lineup[9].role,'constructor');
 advance(180);assert.equal(phase(a),'match');assert.equal(phase(b),'match');
 const old=a.last('room_state').self.lineup[9].playerId;
 const bench=D.PLAYERS.rubro.find(x=>!a.last('room_state').self.lineup.some(s=>s.playerId===x.id));
 a.client('substitute',{slot:9,playerId:bench.id});assert.notEqual(a.last('room_state').self.lineup[9].playerId,old);
 assert.equal(a.last('room_state').self.subs,1);
 advance(12);const elapsed=a.last('room_state').matchElapsed;
 a.client('pause');assert.equal(phase(a),'paused');assert.equal(phase(b),'paused');
 advance(40);assert.equal(phase(a),'paused');assert.equal(a.last('room_state').matchElapsed,elapsed);
 const prePauseRoster=new Set(a.last('room_state').self.lineup.map(s=>s.playerId));
 a.client('formation','4-4-2');
 assert.deepEqual(new Set(a.last('room_state').self.lineup.map(s=>s.playerId)),prePauseRoster,'troca de formação não substitui atletas durante a pausa');
 const pauseBench=D.PLAYERS.rubro.find(x=>!prePauseRoster.has(x.id));
 a.client('slot',{slot:9,playerId:pauseBench.id});
 assert.equal(a.last('room_state').self.subs,2,'troca de reserva durante a pausa conta como substituição');
 advance(20);assert.equal(phase(a),'match');
 advance(230);assert.equal(phase(a),'finished');assert.equal(phase(b),'finished');
 assert.ok(a.last('room_state').events.length>1);
 a.client('restart');assert.equal(a.data.room,null);
 const c=ioInstance.connect('charlie'),d=ioInstance.connect('dora');
 c.client('find_match');assert.equal(c.last('searching').message.includes('Buscando'),true);
 d.client('find_match');assert.equal(phase(c),'countdown');assert.equal(phase(d),'countdown');
 advance(15);advance(180);assert.equal(phase(c),'match');
 c.disconnect();assert.equal(phase(d),'finished');
 assert.ok(d.last('room_state').events.some(x=>x.text.includes('abandono')));
 console.log('PASSOU: 4 elencos, 20 escalações, sala privada, pareamento, 15s, 180s, táticas, entradas inválidas, substituição, pausa, 220s de jogo, eventos sincronizados e abandono.');
}finally {Date.now=origNow;global.setInterval=origInterval;server.httpServer.close()}
