'use strict';
const assert=require('node:assert/strict');
const Module=require('node:module');
const origLoad=Module._load,origInterval=global.setInterval,origNow=Date.now;
let time=1_800_000_000_000,intervals=[],fakeIO;
class MockIO{
 constructor(){this.engine={clientsCount:0};this.sockets={sockets:new Map()};this.handlers={};fakeIO=this}
 on(event,handler){this.handlers[event]=handler}
 to(id){return{emit:(event,v)=>this.sockets.sockets.get(id)?._out(event,v)}}
 connect(id){const s=new MockSocket(id);this.sockets.sockets.set(id,s);this.handlers.connection(s);return s}
}
class MockSocket{
 constructor(id){this.id=id;this.data={};this.events={};this.sent=[]}
 on(ev,fn){this.events[ev]=fn}
 emit(ev,value){this._out(ev,value)}
 _out(ev,value){this.sent.push({ev,value})}
 client(ev,value){assert.ok(this.events[ev],ev+' handler');this.events[ev](value)}
 last(ev='room_state'){return this.sent.filter(e=>e.ev===ev).at(-1)?.value}
 join(){}leave(){}
}
function express(){return {disable(){},use(){},get(){}}};express.static=()=>()=>{};
Module._load=function(id,...rest){if(id==='express')return express;if(id==='socket.io')return {Server:MockIO};return origLoad.call(this,id,...rest)};
global.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length};Date.now=()=>time;
const oldLog=console.log;console.log=()=>{};let server;
try{server=require('../server.js')}finally{Module._load=origLoad;console.log=oldLog}
const D=require('../public/data.js');
function advance(sec){for(let i=0;i<sec;i++){time+=1000;for(const it of intervals)if(it.ms===1000)it.fn()}}
try{
 assert.equal(server.MATCH_SECONDS,220);
 let a=fakeIO.connect('first'),b=fakeIO.connect('second');a.client('set_nick','Pedro');b.client('set_nick','Luisa');a.client('make_room');b.client('join_room',{code:a.last().code});
 advance(15);
 assert.equal(a.last().phase,'setup');
 assert.ok(a.last().self.lineup.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
 let slot=a.last().self.lineup.findIndex(s=>s.role==='CA');
 a.client('move_player',{slot,x:50,y:48});
 assert.equal(a.last().self.lineup[slot].role,'MLG','arrastar CA até o meio transforma função');
 assert.equal(a.last().self.formation,'livre');
 assert.match(a.last().self.shape,/\d/);
 const snapshot=JSON.stringify(a.last().self.lineup);
 a.client('move_player',{slot,x:-500,y:Infinity});
 assert.equal(JSON.stringify(a.last().self.lineup),snapshot,'entrada inválida deve ser ignorada');
 let gk=a.last().self.lineup.findIndex(s=>s.role==='GK');a.client('move_player',{slot:gk,x:52,y:10});
 assert.equal(a.last().self.lineup[gk].role,'GK');assert.ok(a.last().self.lineup[gk].y>=86);
 a.client('stance','subir');assert.equal(a.last().self.stance,'normal','ordem antes do jogo ignorada');
 a.client('formation','4-3-3');assert.equal(a.last().self.formation,'4-3-3','preset reconfigura');
 advance(180);assert.equal(a.last().phase,'match');
 a.client('stance','subir');assert.equal(a.last().self.stance,'subir');assert.equal(b.last().opponent.stance,'subir');
 const v1=server.analyze(server.rooms.get(a.last().code).players[0],server.rooms.get(a.last().code).players[1]);
 a.client('stance','fechar');const v2=server.analyze(server.rooms.get(a.last().code).players[0],server.rooms.get(a.last().code).players[1]);
 assert.ok(v2.attack<v1.attack,'fechar deve atacar menos do que subir');
 a.client('stance','segurar');assert.equal(a.last().self.stance,'segurar');
 a.client('stance','banana');assert.equal(a.last().self.stance,'segurar','ordem inválida ignorada');
 advance(110);assert.equal(a.last().phase,'match');assert.ok(a.last().events.some(e=>e.text.includes('INTERVALO')));
 const sa=a.last().stats,sb=b.last().stats;assert.deepEqual(sa,sb,'estatísticas espelhadas');
 assert.ok(sa[0].attacks+sa[1].attacks>0);
 assert.ok(sa[0].shots+sa[1].shots>=0);
 assert.ok(Number.isFinite(sa[0].xg));
 advance(110);assert.equal(a.last().phase,'finished');assert.equal(b.last().matchElapsed,220);
 assert.ok(a.last().events.some(e=>e.text.includes('FIM DE JOGO')));
 console.log('PASSOU: 220s, posicionamento livre, papéis automáticos, comandos com efeitos, estatísticas compartilhadas e tempo de 90 min.');
}finally{Date.now=origNow;global.setInterval=origInterval;server.httpServer.close()}
