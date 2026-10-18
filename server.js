'use strict';
const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const DATA=require('./public/data.js');
const app=express();
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(_req,res)=>res.json({ok:true,rooms:rooms.size,searching:queue.length}));
const httpServer=http.createServer(app);
const io=new Server(httpServer,{cors:{origin:false},maxHttpBufferSize:20000});
const PORT=process.env.PORT||3000;
const MATCH_SECONDS=220; // 3min40s reais = 90 minutos simulados
const rooms=new Map();const queue=[];
function newStats(){return {shots:0,onTarget:0,chances:0,xg:0,attacks:0,builds:0}}
const rnd=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const rand=()=>Math.random();const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const styles=Object.keys(DATA.TACTICS.styles),generals=Object.keys(DATA.TACTICS.general);
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(){let c='';do{c=Array.from({length:6},()=>alphabet[rnd(0,alphabet.length-1)]).join('')}while(rooms.has(c));return c}
function cleanupQueue(id){let i=queue.indexOf(id);while(i!==-1){queue.splice(i,1);i=queue.indexOf(id)}}
function emitError(socket,message){socket.emit('notice',{kind:'error',message})}
function makeRoom(mode){const room={code:code(),mode,phase:'waiting',players:[],endsAt:0,elapsed:0,lastTick:Date.now(),nextEvent:0,score:[0,0],possession:[0,0],ball:{x:50,y:50,side:0},events:[],stats:[newStats(),newStats()],pausedBy:null,halfSent:false,createdAt:Date.now()};rooms.set(room.code,room);return room}
function getMember(socket){const room=rooms.get(socket.data.room);if(!room)return {};return{room,member:room.players.find(p=>p.id===socket.id)}}
function joinRoom(socket,room){if(socket.data.room){emitError(socket,'Você já está em uma sala. Saia antes de entrar em outra.');return false}if(room.players.length>=2||room.phase!=='waiting'){emitError(socket,'Esta sala não está disponível.');return false}
const player={id:socket.id,ready:false,team:null,formation:'4-2-4',lineup:[],style:'transicao',general:'passes',subs:0,pauseUsed:false,stance:'normal'};room.players.push(player);socket.data.room=room.code;socket.join(room.code);cleanupQueue(socket.id);if(room.players.length===2)startCountdown(room);publish(room);return true}
function addEvent(room,kind,text,side=null){room.events.unshift({id:`${room.code}-${Date.now()}-${rnd(10,999)}`,kind,text,side,minute:Math.min(90,Math.floor(room.elapsed/MATCH_SECONDS*90))});room.events=room.events.slice(0,75)}
function startCountdown(room){room.phase='countdown';room.endsAt=Date.now()+15000;room.lastTick=Date.now();addEvent(room,'system','Dois técnicos encontrados! A partida começará mesmo sem confirmar pronto.');}
function startSetup(room){room.phase='setup';room.endsAt=Date.now()+180000;room.players.forEach(p=>{p.team=p.team||'realeza';p.formation='4-2-4';p.lineup=withCoords(DATA.bestLineup(p.team,p.formation));p.style='transicao';p.general='passes';p.stance='normal';p.ready=false});addEvent(room,'system','Hora de montar o time! Você tem 180 segundos para escalar e definir as táticas.');publish(room)}
function startMatch(room){room.phase='match';room.elapsed=0;room.score=[0,0];room.possession=[0,0];room.stats=[newStats(),newStats()];room.lastTick=Date.now();room.nextEvent=3;room.halfSent=false;room.players.forEach(p=>{if(!p.team)p.team='realeza';if(!p.lineup.length)p.lineup=withCoords(DATA.bestLineup(p.team,'4-2-4'))});addEvent(room,'system','APITA O ÁRBITRO! Bola rolando. Os 90 minutos da partida começam agora!');publish(room)}
function endMatch(room,forfeit=null){room.finalSides=room.players.map(p=>({id:p.id,team:p.team,formation:p.formation,lineup:p.lineup,subs:p.subs}));room.phase='finished';room.endsAt=0;room.elapsed=MATCH_SECONDS;if(forfeit!==null){room.score[forfeit]=0;room.score[1-forfeit]=Math.max(room.score[1-forfeit],3);addEvent(room,'system',`O técnico ${forfeit+1} desconectou. Vitória por abandono para o adversário.`)}else addEvent(room,'system',`FIM DE JOGO! Placar final: ${room.score[0]} x ${room.score[1]}.`);publish(room)}
function view(room,member){const other=room.players.find(p=>p!==member);return {code:room.code,mode:room.mode,phase:room.phase,remaining:room.endsAt?Math.max(0,Math.ceil((room.endsAt-Date.now())/1000)):0,matchElapsed:room.elapsed,score:room.score,possession:room.possession,stats:room.stats,ball:room.ball,events:room.events.slice(0,22),playerIndex:room.phase==='finished'?room.finalSides?.findIndex(p=>p.id===member?.id):room.players.indexOf(member),self:member?{ready:member.ready,team:member.team,formation:member.formation,shape:formationShape(member.lineup),lineup:member.lineup,stance:member.stance,style:member.style,general:member.general,subs:member.subs,pauseUsed:member.pauseUsed}:null,opponent:other?{connected:true,ready:other.ready,team:other.team,formation:other.formation,stance:other.stance,subs:other.subs,lineup:room.phase==='match'||room.phase==='finished'?other.lineup:undefined}:(room.phase==='finished'&&member?{connected:false,...room.finalSides?.find(t=>t.id!==member.id)}:null),pausedBy:room.pausedBy,online:io.engine.clientsCount}}
function publish(room){room.players.forEach(p=>io.to(p.id).emit('room_state',view(room,p)))}
function setDefaultIndividual(role){if(role==='CA')return'pivo';if(['SA','PE','PD'].includes(role))return'fumaca';if(role==='MLG')return'passador';if(role==='VOL')return'marcador';if(role==='ZAG')return'construtor';return''}
function groupIndividual(role){return DATA.normGroup(role)}
function getPlayer(team,id){return DATA.PLAYERS[team]?.find(p=>p.id===id)}
function getOnField(member){return member.lineup.map(s=>({slot:s,player:getPlayer(member.team,s.playerId)})).filter(x=>x.player)}
// Campo vertical: o ataque aponta para cima. O goleiro permanece no gol.
function withCoords(lineup){
 const n={ZAG:0,LAT:0,VOL:0,MLG:0,MAT:0,CA:0,SA:0,PE:0,PD:0};
 const counts=Object.fromEntries(Object.keys(n).map(r=>[r,lineup.filter(s=>s.role===r).length]));
 return lineup.map(s=>{const r=s.role;const i=n[r]||0;n[r]=i+1;const count=counts[r]||1;
  const spread=(width=46)=>count===1?50:50-width/2+width*i/(count-1);
  let x=50,y=50;
  if(r==='GK'){x=50;y=91}
  else if(r==='LAT'){x=count===1?14:(i===0?13:87);y=68}
  else if(r==='ZAG'){x=spread(count===3?55:29);y=75}
  else if(r==='VOL'){x=spread(26);y=58}
  else if(r==='MLG'){x=spread(count===3?55:32);y=48}
  else if(r==='MAT'){x=spread(24);y=36}
  else if(r==='PE'){x=11;y=25}
  else if(r==='PD'){x=89;y=25}
  else if(r==='CA'){x=spread(26);y=16}
  else if(r==='SA'){x=count===1?65:spread(53);y=25}
  return {...s,x,y};
 });
}
function roleAt(x,y,was){
 if(was==='GK')return 'GK';
 if(y>=64)return x<25||x>75?'LAT':'ZAG';
 if(y>=53)return x<20||x>80?'LAT':'VOL';
 if(y>=40)return x<17?'PE':x>83?'PD':'MLG';
 if(y>=29)return x<23?'PE':x>77?'PD':x>=37&&x<=63?'MAT':'SA';
 return x<20?'PE':x>80?'PD':x>=36&&x<=64?'CA':'SA';
}
function formationShape(lineup){
 let lines=[0,0,0,0];for(const s of lineup){if(s.role==='GK')continue;
 const y=Number.isFinite(s.y)?s.y:50;
 if(y>=64)lines[0]++;else if(y>=53)lines[1]++;else if(y>=29)lines[2]++;else lines[3]++;
 }
 let shape=lines.filter(n=>n>0).join('-');return shape||'Personalizada';
}
function analyze(member,other){const on=getOnField(member),n=Math.max(1,on.length);let vals={attack:0,creative:0,defense:0,control:0,press:0,passing:0,speed:0,keeper:72,counter:0,open:0,offsides:0,duels:0};
let mids=0,attackers=0,volantes=0,marks=0,creators=0,center=0,wings=0,serpents=0;
for(const {slot:s,player:p} of on){const st=p.stats,fit=DATA.fit(p,s.role)/100,role=s.role,iv=s.individual||setDefaultIndividual(role);const offense=['CA','SA','PE','PD','MAT'].includes(role),mid=['MLG','VOL','MAT'].includes(role),back=['ZAG','LAT','VOL','GK'].includes(role);const scale=.22+.78*fit;
if(offense){vals.attack+=(st.chute*.5+st.posicionamento*.35+st.velocidade*.15)*scale;attackers++;}
if(mid){vals.creative+=(st.passe*.64+st.conducao*.36)*scale;mids++}
if(back){vals.defense+=(st.marcacao*.58+st.posicionamento*.42)*(role==='GK'?0:scale);if(role==='GK')vals.keeper=st.defesa*scale}
vals.control+=((st.passe*.7+st.conducao*.3)*scale)/n;vals.passing+=(st.passe*scale)/n;vals.press+=(st.velocidade*.35+st.marcacao*.65)*scale/n;vals.speed+=(st.velocidade*scale)/n;
if(role==='CA'){center++;if(iv==='pivo'){vals.attack+=['posse','transicao','infiltracao'].includes(member.style)||member.general==='pressao'?7:3;vals.speed-=.7}else if(iv==='movel'){vals.attack+=['contra','contraRapido'].includes(member.style)?6:2;vals.creative+=member.general==='passes'?2.5:1;vals.counter+=2}}
if(['SA','PE','PD'].includes(role)){wings++;if(iv==='fumaca'){vals.speed+=2.5;vals.counter+=['contra','contraRapido'].includes(member.style)?4:1.7}else if(iv==='bruxo'){vals.creative+=(st.conducao-55)*.17;vals.open+=st.conducao<75?3:.65}}
if(role==='MLG'){if(iv==='passador'){vals.creative+=['transicao','infiltracao'].includes(member.style)?6:2;vals.passing+=(st.passe-50)*.08}else if(iv==='individual'){vals.creative+=(st.conducao-50)*.09;vals.open+=st.conducao<68?3:1}}
if(role==='MAT'&&iv==='espaco'){vals.attack+=['posse','transicao','infiltracao'].includes(member.style)?6:3;vals.open+=.5}
if(role==='VOL'){volantes++;if(iv==='marcador'){marks++;vals.defense+=4}else if(iv==='criador'){creators++;vals.creative+=5;vals.open+=1}}
if(role==='ZAG'){if(iv==='serpente'){serpents++;vals.press+=member.style==='contra'?7:4;vals.counter+=member.style==='contra'?3:1;vals.open+=1.5}else if(iv==='construtor'){vals.passing+=['posse','contraRapido'].includes(member.style)?5:2;vals.defense+=1}}
}
vals.attack=attackers?vals.attack/attackers:28;vals.creative=mids?vals.creative/mids:(vals.control*.72);vals.defense=Math.min(100,vals.defense/Math.max(1,on.filter(x=>['ZAG','LAT','VOL'].includes(x.slot.role)).length));vals.creative=clamp(vals.creative,10,99);
vals.attack+=center*1.8;vals.creative-=Math.max(0,center-1)*4;vals.control-=Math.max(0,center-1)*3;
if(volantes>=2&&marks&&creators){vals.defense+=5;vals.creative+=5}
// Posição física também participa da avaliação, além da função que ela determina.
const back=on.filter(x=>['LAT','ZAG','VOL'].includes(x.slot.role));
const spreadX=on.filter(x=>x.slot.role!=='GK').map(x=>Number(x.slot.x)).filter(Number.isFinite);
if(back.length<4){vals.defense-=Math.min(12,(4-back.length)*6);vals.open+=(4-back.length)*4}
if(spreadX.length>=2){const width=Math.max(...spreadX)-Math.min(...spreadX);vals.creative+=clamp((width-45)*.08,-4,4)}
const style=member.style,general=member.general,enemyStyle=other?.style;
switch(style){case'contra':vals.defense+=15;vals.control-=15;vals.creative-=7;vals.counter+=18;vals.open+=2;break;
case'contraRapido':vals.press+=14;vals.attack+=7;vals.defense-=4;vals.counter+=14;vals.open+=7;break;
case'posse':vals.control+=21;vals.defense+=7;vals.attack-=8;vals.open-=4;break;
case'transicao':vals.passing+=9;vals.attack+=4;vals.creative+=5;break;
case'infiltracao':vals.creative+=10;vals.attack+=2;vals.offsides+=8;break}
switch(general){case'pressao':vals.press+=12;vals.open+=5;if(style==='contraRapido'){vals.attack+=10;vals.press+=7}if(enemyStyle==='posse'){vals.counter+=8;vals.press+=6}break;
case'passes':if(style==='posse')break;if(style==='contra'||style==='contraRapido'){vals.creative-=8;vals.counter-=7}else{vals.creative+=8;vals.passing+=5}break;
case'predador':vals.counter+=12;if(style==='contra'||style==='contraRapido')vals.counter+=8;else vals.control-=5;break}
if(serpents&&['transicao','infiltracao'].includes(enemyStyle))vals.open+=serpents*4;
// Ordens de banco válidas durante o jogo: cada estilo reage de maneira diferente.
switch(member.stance){
 case 'fechar':
  vals.defense+=6;vals.press-=12;vals.attack-=12;vals.creative-=5;vals.control-=5;vals.counter+=6;
  if(style==='contraRapido'){vals.counter+=20;vals.attack+=6;vals.open+=4}
  if(style==='posse'){vals.control+=18;vals.defense+=9;vals.open-=4}
  if(style==='contra'){vals.counter-=12;vals.attack-=11;vals.creative-=6;vals.open+=4}
  if(style==='infiltracao'){vals.counter+=10;vals.creative+=5}
  if(style==='transicao'){vals.counter+=8}
  break;
 case 'subir':
  vals.attack+=15;vals.press+=15;vals.creative+=6;vals.open+=13;vals.defense-=7;
  if(style==='contra'){vals.attack+=11;vals.defense+=8;vals.open-=7;vals.creative+=6}
  if(style==='contraRapido'){vals.open+=19;vals.defense-=15}
  if(style==='posse'){vals.creative+=7;vals.open+=6}
  if(style==='transicao'){vals.attack+=6;vals.passing-=9;vals.creative-=5}
  if(style==='infiltracao'){vals.creative+=10;vals.attack+=6}
  break;
 case 'segurar':
  vals.control+=19;vals.attack-=13;vals.press-=5;vals.creative-=5;vals.defense+=2;vals.counter-=7;
  if(style==='posse'){vals.control+=14;vals.defense+=9;vals.open-=4}
  if(style==='contra'||style==='contraRapido'){vals.open+=10;vals.control-=11;vals.defense-=5}
  if(style==='transicao'||style==='infiltracao'){vals.control+=7;vals.defense+=3}
  break;
}
if(other?.stance==='subir'&&member.stance==='segurar'){vals.control-=21;vals.defense-=7;vals.open+=11}
if(other?.style==='contraRapido'&&member.stance==='segurar'){vals.control-=10;vals.open+=9;vals.defense-=5}
return Object.fromEntries(Object.entries(vals).map(([k,v])=>[k,clamp(v,0,115)]))}
function choose(arr){return arr[rnd(0,arr.length-1)]}
function chooseActive(member,roles){const candidates=getOnField(member).filter(x=>roles.includes(x.slot.role));return (candidates.length?choose(candidates):choose(getOnField(member)))?.player?.name||'O jogador'}
function runEvent(room){const [a,b]=room.players;if(!a||!b)return;let A=analyze(a,b),B=analyze(b,a);let atkSide=rand()<clamp((A.control+A.creative*.3+A.press*.14)/(A.control+B.control+(A.creative+B.creative)*.3+(A.press+B.press)*.14),.23,.77)?0:1;
const atk=room.players[atkSide],def=room.players[1-atkSide],att=atkSide===0?A:B,opp=atkSide===0?B:A;
const minutes=Math.min(90,Math.floor(room.elapsed/MATCH_SECONDS*90));const last=room.ball.side;
const rebound=last!==atkSide;
let active=chooseActive(atk,['SA','PE','PD','CA','MAT']);const creative=chooseActive(atk,['MLG','VOL','MAT']);const defender=chooseActive(def,['ZAG','LAT','VOL']);const goalkeeper=chooseActive(def,['GK']);
let quality=att.creative*.45+att.attack*.25+att.passing*.15+att.speed*.15-opp.defense*.48-opp.press*.18;
if(rebound){quality+=att.counter*.24;quality-=opp.open*.04}
if(atk.style==='infiltracao')quality+=7;
quality+=opp.open*.35;if(def.style==='contra')quality-=12;
if(def.style==='posse')quality-=4;
if(atk.style==='transicao'&&opp.defense>80)quality-=8;
if(atk.style==='contraRapido'&&def.style==='posse')quality+=10;
if(atk.general==='pressao'&&def.style==='posse')quality+=7;
if(def.general==='pressao'&&atk.style==='posse')quality-=10;
// Recuar concede mais volume de ataques; segurar com adversário sem pressão reduz chances.
if(def.stance==='fechar'){
 quality+=def.style==='posse'?-5:def.style==='contra'?12:7;
 if(atk.stance==='subir')quality+=3;
}
if(def.stance==='segurar'){
 quality+=atk.stance==='subir'?16:atk.style==='contraRapido'?10:-9;
}
if(atk.stance==='fechar')quality+=atk.style==='contraRapido'&&rebound?13:atk.style==='contra'?-13:-5;
if(atk.stance==='subir'&&atk.style==='contraRapido')quality-=9;
if(atk.stance==='segurar')quality-=14;
const chance=clamp(.31+quality/155,.12,.76);
room.possession[atkSide]+=rnd(3,6)+(atk.stance==='segurar'?5:0)+(atk.style==='posse'?2:0);
room.stats[atkSide].attacks++;
room.ball={x:atkSide===0?rnd(61,91):rnd(9,39),y:rnd(12,87),side:atkSide};
const teamName=DATA.TEAMS.find(t=>t.id===atk.team)?.short||'EQP';
if(rand()<(.06+att.offsides/180)){addEvent(room,'offside',`${active} tentou atacar nas costas da defesa, mas caiu em impedimento.`,atkSide);return}
if(rand()>chance){const badpass=att.passing<62||rand()<.38;const tx=badpass?`${creative} tentou o passe entre linhas, mas ${defender} interceptou.`:`${defender} antecipou ${active} e cortou o ataque do ${teamName}.`;
addEvent(room,'defense',tx,1-atkSide);room.ball={x:atkSide===0?rnd(34,55):rnd(45,66),y:rnd(20,80),side:1-atkSide};return}
const intermediate=[`${creative} encontrou ${active} em profundidade e a jogada ganhou velocidade.`,`${active} recebeu pela ${rand()<.5?'direita':'esquerda'} e avançou para a entrada da área.`,`${creative} trocou passes pelo centro e abriu o corredor para ${active}.`,`${active} driblou o marcador e apareceu com espaço para finalizar.`];
if(rand()<(atk.stance==='segurar'?.57:.31)){let msg=choose(intermediate);if(atk.style==='contra')msg=`Após roubar a bola, o ${teamName} dispara no contra-ataque: ${creative} acha ${active}.`;else if(atk.style==='contraRapido')msg=`Pressão alta! ${creative} recupera perto da área e procura ${active}.`;else if(atk.style==='posse')msg=`O ${teamName} segura a posse, troca passes e ${creative} procura uma abertura.`;else if(atk.style==='transicao')msg=`Lançamento longo e rápido! ${creative} coloca ${active} nas costas dos laterais.`;else if(atk.style==='infiltracao')msg=`${active} infiltra entre os zagueiros e recebe um passe de ${creative}.`;if(atk.stance==='segurar'&&rand()<.55)msg=choose([`O ${teamName} segura o jogo, gira a bola e demora a repor a jogada.`,`Após ganhar uma falta, o ${teamName} leva alguns segundos a mais para fazer a cobrança.`,`Depois de conseguir um escanteio, o ${teamName} demora para colocar a bola novamente em jogo.`,`O ${teamName} cadencia os passes e evita acelerar a jogada.`]);
room.stats[atkSide].builds++;
addEvent(room,'build',msg,atkSide);return}
let shot=Math.random()<.19?'outside':'inside';
let gProb=clamp(.105+(att.attack-opp.defense)*.0025+(att.creative-70)*.001+(att.open-opp.open)*.0005-(opp.keeper-76)*.0017,.045,.28);
if(atk.stance==='subir')gProb+=atk.style==='contraRapido'?.004:.023;
if(atk.stance==='fechar'&&atk.style==='contraRapido'&&rebound)gProb+=.04;
if(atk.stance==='segurar')gProb-=.025;
if(def.stance==='fechar')gProb+=def.style==='posse'?.005:.021;
if(def.stance==='segurar'&&atk.stance==='subir')gProb+=.04;
if(def.stance==='subir')gProb+=.025;
if(def.stance==='subir'&&def.style==='contraRapido')gProb+=.035;
gProb=clamp(gProb,.035,.48);
if(shot==='outside')gProb*=.61;if(att.style==='posse')gProb*=.91;
room.stats[atkSide].shots++;
room.stats[atkSide].xg+=gProb;
if(shot==='inside'&&gProb>=.16)room.stats[atkSide].chances++;
if(rand()<gProb){room.stats[atkSide].onTarget++;room.score[atkSide]++;addEvent(room,'goal',`GOOOOL! ${active} ${shot==='outside'?'acertou um chute de longe':'infiltrou na área e finalizou'} para marcar! ${room.score[0]} x ${room.score[1]}.`,atkSide);room.ball={x:atkSide===0?98:2,y:50,side:atkSide};}
else if(rand()<.58){room.stats[atkSide].onTarget++;addEvent(room,'shot',`${active} ${shot==='outside'?'arriscou de fora da área':'apareceu na cara do gol'}, mas ${goalkeeper} fez uma defesa importante!`,atkSide)}
else{addEvent(room,'shot',`${active} recebeu de ${creative}, finalizou e mandou ${rand()<.5?'por cima do travessão':'na rede pelo lado de fora'}.`,atkSide)}
}
function leave(socket){cleanupQueue(socket.id);const {room}=getMember(socket);if(!room)return;const pos=room.players.findIndex(p=>p.id===socket.id);socket.leave(room.code);socket.data.room=null;if(pos===-1)return;if(room.players.length===2&&['match','paused'].includes(room.phase)){endMatch(room,pos);room.players=room.players.filter(p=>p.id!==socket.id);publish(room)}else{room.players=room.players.filter(p=>p.id!==socket.id);if(room.players.length){if(room.phase!=='finished'){room.phase='waiting';room.endsAt=0;addEvent(room,'system','O outro técnico saiu. Você pode aguardar um novo convite.')}publish(room)}else rooms.delete(room.code)}}
io.on('connection',socket=>{
socket.emit('connected',{online:io.engine.clientsCount});
socket.on('make_room',()=>{if(socket.data.room)return emitError(socket,'Você já está em uma sala.');joinRoom(socket,makeRoom('friend'))});
socket.on('join_room',arg=>{const codeString=String(arg?.code||'').toUpperCase().trim();const room=rooms.get(codeString);if(!room)return emitError(socket,'Código não encontrado. Verifique e tente novamente.');joinRoom(socket,room)});
socket.on('find_match',()=>{if(socket.data.room)return emitError(socket,'Saia da sala atual para buscar partida.');if(queue.includes(socket.id))return;while(queue.length){const otherId=queue.shift(),other=io.sockets.sockets.get(otherId);if(other&&other.connected&&!other.data.room&&other.id!==socket.id){const room=makeRoom('random');joinRoom(other,room);joinRoom(socket,room);return}}queue.push(socket.id);socket.emit('searching',{message:'Buscando um técnico online...'});});
socket.on('cancel_search',()=>{cleanupQueue(socket.id);socket.emit('search_cancelled')});
socket.on('leave_room',()=>leave(socket));
socket.on('ready',val=>{const {room,member}=getMember(socket);if(!room||!member||room.phase!=='countdown')return;member.ready=!!val;publish(room)});
socket.on('team',id=>{const {room,member}=getMember(socket);if(room?.phase!=='setup'||!member||typeof id!=='string'||!Object.hasOwn(DATA.PLAYERS,id))return;member.team=id;member.formation='4-2-4';member.lineup=withCoords(DATA.bestLineup(id,member.formation));publish(room)});
socket.on('formation',key=>{const {room,member}=getMember(socket);if(!['setup','paused'].includes(room?.phase)||!member||typeof key!=='string'||!Object.hasOwn(DATA.FORMATIONS,key))return;member.formation=key;if(room.phase==='paused'){const pool=member.lineup.map(s=>getPlayer(member.team,s.playerId)).filter(Boolean);member.lineup=withCoords(DATA.FORMATIONS[key].map((role,slot)=>{const best=pool.reduce((idx,p,i)=>DATA.fit(p,role)>DATA.fit(pool[idx],role)?i:idx,0);const selected=pool.splice(best,1)[0];return {slot,role,playerId:selected.id,individual:''}}))}else member.lineup=withCoords(DATA.bestLineup(member.team,key));publish(room)});
socket.on('move_player',x=>{const {room,member}=getMember(socket);if(!['setup','paused'].includes(room?.phase)||!member||!x)return;
 const index=Number(x.slot),px=Number(x.x),py=Number(x.y);
 if(!Number.isInteger(index)||index<0||index>10||!Number.isFinite(px)||!Number.isFinite(py)||px<2||px>98||py<3||py>97)return;
 const slot=member.lineup[index];if(!slot)return;
 const xPos=clamp(px,6,94),yPos=slot.role==='GK'?clamp(py,86,94):clamp(py,9,80);
 const before=slot.role;slot.x=xPos;slot.y=yPos;slot.role=roleAt(xPos,yPos,before);
 if(before!==slot.role)slot.individual='';member.formation='livre';publish(room);
});
socket.on('tactics',x=>{const {room,member}=getMember(socket);if(!['setup','paused'].includes(room?.phase)||!member)return;if(x?.style&&styles.includes(x.style))member.style=x.style;if(x?.general&&generals.includes(x.general))member.general=x.general;publish(room)});
socket.on('slot',x=>{const {room,member}=getMember(socket);if(!['setup','paused'].includes(room?.phase)||!member||!x)return;const idx=Number(x.slot);if(!Number.isInteger(idx)||idx<0||idx>10)return;const slot=member.lineup[idx];if(!slot)return;
if(typeof x.role==='string'&&Object.hasOwn(DATA.ROLES,x.role)){if(slot.role==='GK'||x.role==='GK'){if(slot.role!==x.role)return;}slot.role=x.role;slot.individual='';const auto=withCoords(member.lineup);slot.x=auto[idx].x;slot.y=auto[idx].y;member.formation='livre'}
if(typeof x.playerId==='string'&&getPlayer(member.team,x.playerId)&&x.playerId!==slot.playerId){const other=member.lineup.find(s=>s.playerId===x.playerId);if(other&&other!==slot){other.playerId=slot.playerId;other.individual=''}else if(!other&&room.phase==='paused'){if(member.subs>=5)return emitError(socket,'Você já fez as 5 substituições permitidas.');const outgoing=getPlayer(member.team,slot.playerId),incoming=getPlayer(member.team,x.playerId);member.subs++;addEvent(room,'sub',`${DATA.TEAMS.find(t=>t.id===member.team)?.short}: sai ${outgoing.name}, entra ${incoming.name} na posição ${slot.role}.`,room.players.indexOf(member))}slot.playerId=x.playerId;slot.individual=''}
if(typeof x.individual==='string'){const possible=DATA.TACTICS.individual[groupIndividual(slot.role)]||{};if(x.individual===''||Object.hasOwn(possible,x.individual))slot.individual=x.individual}publish(room)});
socket.on('substitute',x=>{const {room,member}=getMember(socket);if(!['match','paused'].includes(room?.phase)||!member||!x)return;if(member.subs>=5)return emitError(socket,'Você já fez as 5 substituições permitidas.');const idx=Number(x.slot),slot=member.lineup[idx];if(!Number.isInteger(idx)||!slot||typeof x.playerId!=='string')return;const bench=DATA.PLAYERS[member.team].find(p=>p.id===x.playerId);if(!bench||member.lineup.some(s=>s.playerId===bench.id))return emitError(socket,'Escolha um reserva que ainda esteja no banco.');const outgoing=getPlayer(member.team,slot.playerId);slot.playerId=bench.id;const variants=DATA.TACTICS.individual[groupIndividual(slot.role)]||{};slot.individual=(typeof x.individual==='string'&&Object.hasOwn(variants,x.individual))?x.individual:'';member.subs++;addEvent(room,'sub',`${DATA.TEAMS.find(t=>t.id===member.team)?.short}: sai ${outgoing.name}, entra ${bench.name} na posição ${slot.role}.`,room.players.indexOf(member));publish(room)});
socket.on('stance',x=>{const {room,member}=getMember(socket);if(room?.phase!=='match'||!member)return;
 if(!['normal','fechar','subir','segurar'].includes(x))return;
 if(member.stance===x)return;member.stance=x;
 const name=DATA.TEAMS.find(t=>t.id===member.team)?.short||'Equipe';
 const labels={normal:'voltou a jogar sem instrução extra',fechar:'recuou e fechou as linhas',subir:'subiu a marcação e lançou a equipe ao ataque',segurar:'começou a gastar tempo e a controlar o ritmo'};
 addEvent(room,'system',`${name} ${labels[x]}.`,room.players.indexOf(member));publish(room);
});
socket.on('pause',()=>{const {room,member}=getMember(socket);if(room?.phase!=='match'||!member||member.pauseUsed)return;member.pauseUsed=true;room.phase='paused';room.endsAt=Date.now()+60000;room.pausedBy=room.players.indexOf(member);addEvent(room,'system',`Tempo técnico solicitado. O relógio parou por 60 segundos para ajustes.`);publish(room)});
socket.on('restart',()=>{const {room}=getMember(socket);if(room?.phase!=='finished')return;leave(socket)});
socket.on('disconnect',()=>leave(socket));
});
setInterval(()=>{const now=Date.now();for(const room of rooms.values()){
if(room.phase==='waiting')continue;
if(room.phase==='countdown'&&now>=room.endsAt){startSetup(room);continue}
if(room.phase==='setup'&&now>=room.endsAt){startMatch(room);continue}
if(room.phase==='paused'&&now>=room.endsAt){room.phase='match';room.lastTick=now;room.pausedBy=null;room.endsAt=0;addEvent(room,'system','Tempo técnico encerrado. O jogo recomeça!')}
if(room.phase==='match'){
const dt=Math.min(3,(now-room.lastTick)/1000);room.elapsed+=dt;room.lastTick=now;
if(room.elapsed>=MATCH_SECONDS/2&&!room.halfSent){room.halfSent=true;addEvent(room,'system','INTERVALO! Começa o segundo tempo; as equipes invertem os lados.');}
if(room.elapsed>=room.nextEvent){runEvent(room);room.nextEvent=room.elapsed+rnd(3,6)+(room.players.some(p=>p.stance==='segurar')?rnd(0,2):0)}
if(room.elapsed>=MATCH_SECONDS){endMatch(room);continue}
}publish(room)}},1000);
setInterval(()=>{const now=Date.now();for(const [k,r]of rooms){if((r.phase==='finished'&&now-r.createdAt>35*60*1000)||(!r.players.length&&now-r.createdAt>30*1000))rooms.delete(k)}},60000);
httpServer.listen(PORT,'0.0.0.0',()=>console.log(`Mestre do Banco pronto em http://localhost:${PORT}`));
module.exports={httpServer,rooms,analyze,withCoords,roleAt,formationShape,MATCH_SECONDS};
