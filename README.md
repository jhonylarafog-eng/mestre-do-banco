# Mestre do Banco — jogo online de técnico de futebol

Protótipo multiplayer em português, **sem contas ou cadastros**. Usa Node.js, Express e Socket.IO para manter a partida no servidor e sincronizá-la entre os navegadores.

## Estado de verificação e publicação

- Testes **simulados da lógica do servidor e renderização da interface** passam com `npm test`: elencos, formações, código de sala, busca de rival, 15 segundos, 180 segundos, seleção de equipe, alterações táticas, substituição, bloqueio de substituições extras durante a pausa de 60 segundos, final dos 220 segundos, sincronização e vitória por abandono.
- Os testes simulados **não equivalem** a testes reais do Express/Socket.IO nem de navegadores com jogadores em redes diferentes. É preciso rodar `npm install`, `npm start` e verificar dois navegadores antes de anunciar como jogo totalmente validado.
- Incluído `render.yaml` com configuração inicial de implantação no Render; a publicação exige autorização do proprietário da conta e teste posterior.
- Sem banco de dados: salas e partidas estão somente na memória do servidor; se ele reiniciar, partidas ativas são encerradas. Hospedagem com mais de uma instância exige arquitetura compartilhada para o pareamento.

## Como executar (Windows, macOS ou Linux)

1. Instale o [Node.js LTS](https://nodejs.org/).
2. No Windows, você pode simplesmente dar dois cliques em **`iniciar-windows.bat`**, que instala as dependências e inicia o servidor. Alternativamente, abra o terminal na pasta do projeto:
3. Execute `npm install`.
4. Execute `npm start`.
5. Abra **http://localhost:3000** em dois navegadores/abas para testar uma partida.

> Para jogar com amigos em computadores diferentes, hospede este servidor Node.js em um serviço que suporte WebSocket (Render, Railway, VPS etc.) e compartilhe a URL pública. Apenas abrir o arquivo HTML fora do servidor não oferece multiplayer. Há também uma versão gratuita no Render; atualizações no GitHub são implantadas automaticamente no servidor e no site estático existentes.

## Novidades da versão 2.0

- **3 minutos e 40 segundos** de bola rolando, equivalentes a **90 minutos de jogo**; durante a partida só aparece o tempo simulado, não um cronômetro real. O intervalo é uma marcação automática, sem pausa extra. A pausa de 60 segundos solicitada por técnico continua disponível e congela o tempo simulado.
- **Formação livre por arrastar**: clicar no atleta abre suas funções e instruções; arrastá-lo com mouse ou toque redefine sua função conforme a região do campo. A escalação é atualizada no servidor, com penalidades de adaptação para atletas fora da posição natural. O goleiro permanece na área. As formações predeterminadas continuam disponíveis para restaurar o arranjo.
- **Comandos durante a partida**: Equilibrado, Fechar o time, Subir o time, Segurar o jogo. Cada comando modifica criação, marcação, controle, vulnerabilidade, volume e probabilidade de finalização, com diferenças específicas para os cinco estilos existentes. O adversário vê a postura escolhida.
- **Leitura de partida**: finalizações, finalizações no gol, chances perigosas, gols esperados (xG aproximado), posse e indicador de domínio. Ambas as telas recebem as mesmas estatísticas do servidor. Não há garantia de vitória nem previsões definitivas.
- O cliente estático no Render continua usando a tela personalizada de carregamento. O servidor multiplayer e o site estático publicam automaticamente a partir da branch `main` do GitHub.

## Fluxo implementado

- **Jogar com amigo**: criar sala com código de seis caracteres / buscar e entrar com código.
- **Buscar oponente**: matchmaking automático FIFO (primeiros dois jogadores que estiverem procurando).
- Dois jogadores: contagem de **15 s**; o botão **Pronto** é opcional e não bloqueia o início.
- **180 s** para montar a equipe, escolher entre quatro equipes, definir posição de cada jogador no campo, formação, estilo, tática geral e tática individual. Se o cronômetro chegar a zero, o time atual é utilizado.
- Cada equipe tem **16 cartas de atletas parodiados**, incluindo **11 titulares e 5 reservas**, com atributos de chute, velocidade, marcação, posicionamento, passe, condução e gol.
- Formações **4-2-4, 4-4-2, 4-3-3, 4-2-3-1, 3-5-2**. As posições podem ser alteradas manualmente: CA, SA, PE, PD, MLG, VOL, MAT, ZAG, LAT, GOL. Atletas fora de posição perdem eficiência, com o goleiro preservado em sua área.
- **Cinco estilos de jogo, três táticas gerais e 11 funções individuais**, com descrições curtas na interface e impactos efetivos na simulação de lances. Nenhuma combinação ideal aparece nas descrições da interface.
- Partida de **90 minutos simulados em 220 segundos reais**, exibida em dois tempos, com placar sincronizado, mapa tático com pontos móveis e narração textual compartilhada (passes, infiltrações, roubadas, impedimentos, chutes, defesas, gols e substituições).
- **Cinco substituições** possíveis por partida. Cada técnico pode solicitar **uma pausa de 60 segundos** para reorganizar o time. Durante a pausa, o relógio do jogo fica parado para ambos os jogadores.

## Limitações desta primeira versão

- O campo é uma **visualização tática** dos lances simulados pelo servidor, não uma animação física de futebol com colisões e física de bola.
- A simulação é estocástica, mas ponderada por escalação, atributos, posição, tática, estilo, riscos e contraposições entre adversários. **Não usa um banco de dados real de eventos de futebol**.
- Os números de atributos são aproximações fictícias criadas para balanceamento do jogo; **não são notas oficiais**. Os elencos são uma seleção de atletas inspirados nos plantéis e convocações de 2026, não uma atualização ao vivo.
- Não há persistência ou ranking: salas são mantidas em memória do processo Node.js e encerradas ao reiniciar o servidor.
- As salas são por código (não há proteção extra por senha); não use códigos públicos para partidas privadas.
- Preparação e pausa estão sujeitas à sincronização do relógio do servidor (os números do navegador são apenas uma representação do estado).

## Arquivos

- `server.js`: salas, pareamento, contagem de tempo, estado e simulação autoritativa.
- `public/index.html`: estrutura.
- `public/style.css`: interface responsiva.
- `public/app.js`: telas e interações.
- `public/data.js`: 64 cartas, atributos, formações, estilos e funções.

## Fontes usadas como referência de elencos (2026)

- [Real Madrid — elenco oficial](https://www.realmadrid.com/en-US/football/first-team/players)
- [Flamengo — elenco oficial](https://hmlhub.flamengo.com.br/futebol/elenco)
- [Corinthians — elenco CONMEBOL Libertadores 2026](https://gol.conmebol.com/libertadores/pt-br/news/corinthians-na-conmebol-libertadores-2026-resultados-elenco-e-calendario)
- [CBF — convocados para Copa 2026](https://www.cbf.com.br/selecao-brasileira/noticias/selecao-masculina/a/carlo-ancelotti-convoca-os-26-jogadores-que-vao-tentar-o-hexa-na-copa-do-mundo)

> Referências servem para a identidade esportiva dos elencos. Nomes parodiados, atributos e emblemas próprios não são produtos oficiais dos clubes, seleções ou atletas.
