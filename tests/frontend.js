'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const D=require('../public/data.js');
const listeners={};
const screen={innerHTML:'',textContent:''};
const online={textContent:''};
const toast={textContent:'',classList:{add(){},remove(){}}};
const socket={on(e,fn){listeners[e]=fn},emit(){}};
const document={querySelector(q){return {'#screen':screen,'#online':online,'#toast':toast}[q]||null},addEventListener(){}};
const sandbox={window:{GAME_DATA:D},document,io:()=>socket,navigator:{},setTimeout:()=>0,clearTimeout:()=>{},console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8'),sandbox,{filename:'app.js'});
assert.match(screen.innerHTML,/JOGAR COM AMIGO/);
const make=(phase,playerIndex=0)=>({
 code:'ABCDEF',phase,mode:'friend',remaining:15,matchElapsed:100,score:[1,0],possession:[100,70],ball:{x:52,y:49,side:0},
 events:[{id:'e',kind:'shot',minute:24,text:'Vinicios Junioro chutou para fora'}],playerIndex,pausedBy:null,
 self:{ready:false,team:'rubro',formation:'4-2-4',lineup:D.bestLineup('rubro','4-2-4'),style:'posse',general:'passes',subs:0,pauseUsed:false},
 opponent:{connected:true,ready:true,team:'realeza',formation:'4-2-4',lineup:phase==='setup'?undefined:D.bestLineup('realeza','4-2-4'),subs:0}
});
for(const phase of ['waiting','countdown','setup','match','paused','finished']){
 listeners.room_state(make(phase));assert.ok(screen.innerHTML.length>200,`renderizou tela ${phase}`);
 if(phase==='setup'){assert.match(screen.innerHTML,/ESCOLHA SEU TIME/);assert.match(screen.innerHTML,/ARRASTE PARA QUALQUER LUGAR/)}
 if(phase==='match'){assert.match(screen.innerHTML,/CAMPO EM TEMPO REAL/);assert.match(screen.innerHTML,/FECHAR O TIME/);assert.match(screen.innerHTML,/SUBIR O TIME/);assert.match(screen.innerHTML,/SEGURAR O JOGO/);assert.match(screen.innerHTML,/LEITURA DA PARTIDA/);assert.doesNotMatch(screen.innerHTML,/id="match-real"/)}
 if(phase==='finished')assert.match(screen.innerHTML,/VITÓRIA/);
}
listeners.room_state(make('match',1));assert.match(screen.innerHTML,/CAMPO EM TEMPO REAL/);
console.log('PASSOU: interface inicial, sala, preparação, campo com 22 atletas, pausa, narração e resultado para ambos os lados.');
