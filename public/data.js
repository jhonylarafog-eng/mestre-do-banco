/* Elencos parodiados, inspirados em plantéis de 2026. Atributos estimados para fins de jogo, não dados oficiais. */
(function(root,factory){const data=factory(); if(typeof module==='object'&&module.exports)module.exports=data;else root.GAME_DATA=data})(typeof window!=='undefined'?window:globalThis,function(){
const ROLES={GK:'GOL',ZAG:'ZAG',LAT:'LAT',VOL:'VOL',MLG:'MLG',MAT:'MAT',CA:'CA',SA:'SA',PE:'PE',PD:'PD'};
const STATS=['chute','velocidade','marcacao','posicionamento','passe','conducao','defesa'];
const BASE={GK:[12,37,22,65,47,28,84],ZAG:[30,60,82,80,55,42,20],LAT:[52,80,73,76,69,73,17],VOL:[52,67,82,76,76,68,18],MLG:[67,75,65,74,85,80,15],MAT:[78,77,43,81,82,85,12],CA:[86,80,28,87,58,72,10],SA:[82,88,36,80,76,87,10],PE:[79,90,30,78,74,90,9],PD:[79,88,34,77,78,88,9]};
// name, natural position, alternate roles, differences [chute, velocidade, marcacao, posicionamento, passe, conducao, defesa]
const RAW={
realeza:[
 ['Courtuás','GK',[],[0,-5,0,7,5,0,11]],['Lunim','GK',[],[0,2,0,1,0,0,0]],
 ['Rudiguer','ZAG',[],[1,9,7,3,-4,0,0]],['Huisen','ZAG',[],[0,1,3,4,12,5,0]],['Militãum','ZAG',[],[0,7,5,2,2,0,0]],
 ['Trenti','LAT',['MLG'],[7,0,-8,0,20,1,0]],['Carrerasz','LAT',[],[0,4,0,3,0,0,0]],
 ['Valverdi','MLG',['VOL','PD'],[7,10,9,3,5,2,0]],['Camavingo','VOL',['MLG'],[1,5,5,1,0,7,0]],
 ['Bellinghan','MLG',['MAT'],[9,3,0,12,5,5,0]],['Ardo Guler','MLG',['MAT','SA'],[9,0,-9,0,7,10,0]],
 ['Mbaapê','CA',['SA'],[12,16,0,5,0,10,0]],['Endriq','CA',['SA'],[5,7,0,0,0,6,0]],
 ['Vinicios Junioro','SA',['PE'],[0,10,0,0,-4,9,0]],['Rodrigoo','SA',['PD'],[0,2,0,3,2,4,0]],['Diomandê','SA',['PE'],[-3,9,0,0,0,2,0]]
],
rubro:[
 ['Rossy','GK',[],[0,1,0,4,0,0,5]],['Andreu','GK',[],[0,0,0,0,0,0,0]],
 ['Léo Pereyra','ZAG',[],[4,1,4,3,9,0,0]],['Léo Ortiiz','ZAG',[],[0,0,5,4,12,2,0]],['Vitãu','ZAG',[],[0,3,3,1,0,0,0]],
 ['Varelaa','LAT',[],[0,-4,4,0,1,0,0]],['Ayrton Lucaz','LAT',['PE'],[0,5,-3,0,0,5,0]],
 ['Jorginhu','VOL',['MLG'],[0,-8,-1,7,14,0,0]],['Pulgarz','VOL',[],[0,-3,6,2,9,0,0]],
 ['Arrasketa','MLG',['MAT'],[9,-6,-9,6,10,8,0]],['Lucas Paquetáh','MLG',['MAT'],[6,0,0,5,5,7,0]],
 ['Pedroo','CA',[],[9,-10,0,7,0,1,0]],['Bruno Henrike','CA',['SA','PE'],[2,9,0,5,0,3,0]],
 ['Samuel Linno','SA',['PE'],[0,9,0,0,0,5,0]],['Luiz Araúju','SA',['PD'],[3,5,0,0,0,3,0]],['Carrascau','SA',['MAT'],[-4,0,0,0,8,2,0]]
],
timao:[
 ['Hugo Souzza','GK',[],[0,0,0,5,0,0,9]],['Felipe Longoo','GK',[],[0,0,0,0,0,0,0]],
 ['Gustavo Henriqe','ZAG',[],[0,-4,7,3,-4,0,0]],['André Ramalhu','ZAG',[],[0,-2,5,4,8,0,0]],['Gabriel Paulistta','ZAG',[],[0,-2,4,3,-3,0,0]],
 ['Matheus Biduu','LAT',['PE'],[2,3,-3,0,0,2,0]],['Pedro Milanz','LAT',[],[0,2,1,0,0,0,0]],
 ['Ranielle','VOL',[],[0,-2,8,3,-5,0,0]],['Breno Bidom','MLG',['VOL'],[0,2,0,0,5,5,0]],
 ['Rodrigo Garrô','MLG',['MAT'],[7,0,-8,0,12,10,0]],['André Carilloo','MLG',['PD'],[0,1,-4,0,7,8,0]],
 ['Yuri Albertu','CA',[],[4,5,0,5,0,0,0]],['Pedro Raull','CA',[],[2,-9,0,4,0,-3,0]],
 ['Memphis Depai','SA',['CA','MAT'],[7,-2,0,3,6,4,0]],['Vitinhu','SA',['PE','PD'],[0,5,0,0,0,4,0]],['Matheus Françaa','SA',['PD','MAT'],[0,3,0,0,4,6,0]]
],
brasileirado:[
 ['Alissom','GK',[],[0,0,0,7,5,0,11]],['Édersom','GK',[],[0,0,0,3,19,0,7]],
 ['Marquinhosz','ZAG',[],[0,2,6,5,7,0,0]],['Gabriel Magalhãez','ZAG',[],[0,2,7,3,0,0,0]],['Bremmer','ZAG',[],[0,5,7,2,0,0,0]],
 ['Wesleyy','LAT',[],[1,6,0,0,2,4,0]],['Alex Sandroo','LAT',[],[0,-5,4,4,1,0,0]],
 ['Casemirô','VOL',[],[3,-10,10,6,1,0,0]],['Bruno Guimarãez','MLG',['VOL'],[1,-1,3,3,13,3,0]],
 ['Lucas Paquetáh','MLG',['MAT'],[6,0,0,5,5,7,0]],['Neymarz','MAT',['SA','PE'],[7,-3,-15,6,5,10,0]],
 ['Igor Thiagô','CA',[],[6,1,0,4,0,0,0]],['Endriq','CA',['SA'],[5,7,0,0,0,6,0]],
 ['Vinicios Junioro','SA',['PE'],[0,10,0,0,-4,9,0]],['Rafinhaa','SA',['PD'],[2,3,-4,1,2,5,0]],['Matheus Cunhaa','SA',['CA','MAT'],[5,0,0,3,2,2,0]]
]};
const TEAMS=[
{id:'realeza',name:'Realeza Espanhola',short:'REA',color:'#eaefff',text:'#20253f',crest:'R',desc:'Técnica refinada, velocidade e estrelas capazes de decidir.'},
{id:'rubro',name:'Rubro Vermelho',short:'RUB',color:'#ed4958',text:'#fff',crest:'F',desc:'Criação por dentro, infiltrações e jogo ofensivo.'},
{id:'timao',name:'Timão',short:'TIM',color:'#2b3043',text:'#fff',crest:'T',desc:'Combatividade, organização e contra-ataque.'},
{id:'brasileirado',name:'Brasileirado',short:'BRA',color:'#f9ca45',text:'#1f2a3d',crest:'B',desc:'Improviso, habilidade e arrancadas pelos lados.'}];
const FORMATIONS={
'4-2-4':['GK','LAT','ZAG','ZAG','LAT','MLG','MLG','SA','CA','CA','SA'],
'4-4-2':['GK','LAT','ZAG','ZAG','LAT','PE','VOL','MLG','PD','CA','SA'],
'4-3-3':['GK','LAT','ZAG','ZAG','LAT','VOL','MLG','MLG','PE','CA','PD'],
'4-2-3-1':['GK','LAT','ZAG','ZAG','LAT','VOL','VOL','PE','MAT','PD','CA'],
'3-5-2':['GK','ZAG','ZAG','ZAG','LAT','VOL','MLG','MLG','LAT','CA','SA']};
const TACTICS={
styles:{contra:['Contra-ataque','Bloco bem fechado, poucas subidas organizadas e explosões em superioridade após recuperações. Se perder a bola durante a subida, deixa espaços.'],contraRapido:['Contra-ataque rápido','Linha de marcação adiantada para forçar erros na saída. Meias acompanham a pressão; defesa sobe de forma moderada.'],posse:['Posse de bola','Circula e protege a bola, reduz riscos e o número de oportunidades de ambos os lados.'],transicao:['Transição','Busca lançamentos desde a defesa, jogo aberto pelos laterais e bolas em profundidade para pontas e atacantes.'],infiltracao:['Infiltração','Troca passes até encontrar espaços nas costas da defesa. Meias e atacantes atacam a última linha, com risco de impedimento.']},
general:{pressao:['Pressão alta','Em momentos escolhidos, sobe a marcação para recuperar a bola e pode deixar espaço nas costas.'],passes:['Troca de passes','Dá preferência a combinações curtas, com mais circulação antes de finalizar.'],predador:['Predador','Espera a recuperação da bola e dispara um ataque coletivo de alta velocidade.']},
individual:{CA:{pivo:['Pivô fixo','Permanece perto da área, recebe de costas e espera que a equipe crie oportunidades.'],movel:['CA móvel','Sai da referência, arrasta a marcação e participa da circulação de ataque.']},SA:{fumaca:['Fumaça','Ataca imediatamente os espaços livres e busca corridas em profundidade.'],bruxo:['Bruxo','Arrisca dribles e decisões imprevisíveis; pode criar uma chance brilhante ou perder a posse.']},MLG:{passador:['Passador','Prioriza passes, incluindo enfiadas arriscadas, e dribla menos.'],individual:['Individual','Conduz, dribla para se livrar da pressão e procura passes objetivos; pode perder a bola.']},MAT:{espaco:['Atacador de espaço','Chega na área e finaliza de média distância com frequência.']},VOL:{marcador:['Marcador','Protege a defesa, participa menos do ataque e busca antecipações.'],criador:['Criador','Sai mais para distribuir jogadas e ocupar faixas do meio-campo.']},ZAG:{serpente:['Serpente','Adianta-se para dar o bote e pode iniciar passes longos, mas deixa espaço atrás.'],construtor:['Construtor','Mantém cobertura e apoia a saída de bola com passes seguros, sem caçar o adversário.']}}};
const normGroup=r=>['PE','PD'].includes(r)?'SA':r;
function mkPlayer(team,row,i){const [name,role,alt=[],diff=[]]=row;const base=BASE[role].map((v,k)=>Math.max(8,Math.min(99,v+(diff[k]||0))));return {id:team+'-'+i,name,role,alt,stats:Object.fromEntries(STATS.map((x,k)=>[x,base[k]])),rating:Math.round((base[0]+base[1]+base[2]+base[3]+base[4]+base[5]+(role==='GK'?base[6]*3:0))/(role==='GK'?9:6))}}
const PLAYERS=Object.fromEntries(Object.entries(RAW).map(([key,rows])=>[key,rows.map((r,i)=>mkPlayer(key,r,i))]));
function fit(p,role){if(!p)return -100;if(p.role===role)return 100;if(p.alt.includes(role))return 88;const g=normGroup(role);if(g===normGroup(p.role)||p.alt.some(a=>normGroup(a)===g))return 76;if(['MLG','MAT','VOL'].includes(role)&&['MLG','MAT','VOL'].includes(p.role))return 66;if(['CA','SA','PE','PD','MAT'].includes(role)&&['CA','SA','PE','PD','MAT'].includes(p.role))return 54;if(['LAT','ZAG','VOL'].includes(role)&&['LAT','ZAG','VOL'].includes(p.role))return 43;return role==='GK'||p.role==='GK'?5:25}
function bestLineup(team,formation){const roster=PLAYERS[team];const roles=FORMATIONS[formation];let unused=[...roster];let lineup=roles.map((role,slot)=>{const idx=unused.reduce((best,p,i)=>fit(p,role)>fit(unused[best],role)?i:best,0);const p=unused.splice(idx,1)[0];return {slot,role,playerId:p.id,individual:''}});return lineup}
return {ROLES,STATS,TEAMS,PLAYERS,FORMATIONS,TACTICS,fit,bestLineup,normGroup};
});
