# Requisitos: Aplicativo de Macros para Windows

## Problema
Tarefas repetitivas no Windows (cliques, digitação, sequências de ações) consomem
tempo e são chatas de repetir manualmente. Não existe hoje uma ferramenta própria,
local e configurável para gravar e reproduzir essas ações do jeito que o usuário
precisa.

## Objetivo
Um app de desktop Windows que **grava** ações de mouse/teclado e também deixa
**montar/editar** macros na mão, com posições exatas de tela, delays reais e
execução controlada — rodando 100% localmente, sem depender de nuvem.

## Escopo (Fase 1)
- Gravar ações ao vivo: cliques, movimentos do mouse (coordenadas X,Y), teclas e o
  **tempo entre elas** (delays reais).
- Editar a macro gravada: adicionar, remover, reordenar e ajustar passos manualmente.
- Montar macro do zero sem gravar (escolhendo passos de uma lista).
- Tipos de passo, no mínimo: mover mouse para (X,Y), clicar (esq/dir/meio), digitar
  texto, apertar tecla/combinação, esperar (delay).
- Salvar e carregar macros localmente (biblioteca com várias macros).
- Executar macro por: **atalho de teclado global** e/ou **botão no app** —
  configurável por macro.
- Repetição configurável por macro: rodar 1 vez, X vezes, ou em loop até parar.
- **Tecla de pânico/parada** configurável para abortar a execução na hora.
- Rodar com o app **minimizado / em bandeja**, acionando por atalho global.
- **Várias macros ativas ao mesmo tempo**, cada uma com seu próprio atalho
  (ex: F6 = macro A, F7 = macro B), funcionando com o app minimizado.
- Modo de reprodução do mouse **configurável por macro**: pular direto ao ponto de
  clique, ou refazer a trajetória gravada.

## Fora de escopo (Fase 1)
- Reconhecimento de imagem na tela.
- Sincronização em nuvem / conta de usuário.
- Lógica avançada de programação (condicionais `if`, variáveis, loops dentro do passo).
- Versões para Mac/Linux.
- Agendamento por horário (rodar automático às 14h, etc.).

## Fase 2 (evolução futura)
Não entra agora, mas a arquitetura deve preparar o terreno.
- **F2.1 — Passo "clicar na imagem":** o usuário fornece um recorte (print de um
  botão/ícone) e a macro procura essa imagem na tela e clica nela (template matching,
  ex: OpenCV).
- **F2.2 — Tolerância de correspondência:** ajuste de sensibilidade para lidar com
  pequenas variações (resolução, tema, anti-aliasing).
- **Diretriz:** o modelo de "tipos de passo" deve ser extensível desde a Fase 1, para
  encaixar passos novos sem reescrever o core.

## Atores
- **Usuário único**: grava, edita, salva e executa as próprias macros na própria máquina.

## Requisitos funcionais
- **RF1 — Gravar:** ao ativar o modo gravação, o app captura cliques, movimentos do
  mouse (coordenadas), teclas pressionadas e o intervalo de tempo entre cada ação, até
  o usuário parar de gravar.
- **RF2 — Reproduzir fielmente:** ao executar uma macro, o app repete as ações nas
  mesmas posições e respeitando os delays gravados.
- **RF3 — Editar passos:** o usuário pode ver a lista de passos da macro e adicionar,
  remover, reordenar e alterar cada passo (incluindo coordenadas e delays).
- **RF4 — Montar do zero:** o usuário pode criar uma macro adicionando passos
  manualmente sem precisar gravar.
- **RF5 — Salvar/Carregar:** o usuário pode salvar uma macro com um nome e reabri-la
  depois; várias macros ficam listadas numa biblioteca local.
- **RF6 — Disparo configurável:** cada macro pode ser executada por um atalho global
  e/ou por um botão no app, conforme configurado.
- **RF7 — Repetição configurável:** cada macro define se roda 1x, N vezes, ou em loop
  até ser interrompida.
- **RF8 — Tecla de pânico:** existe uma tecla configurável que aborta qualquer execução
  em andamento imediatamente.
- **RF9 — Rodar minimizado:** com o app minimizado ou na bandeja, os atalhos globais
  ainda disparam as macros configuradas.
- **RF10 — Múltiplos atalhos ativos:** várias macros podem estar ativas ao mesmo tempo,
  cada uma no seu próprio atalho, sem conflito.
- **RF11 — Modo de mouse configurável:** cada macro define se o mouse pula direto ao
  ponto ou refaz a trajetória gravada.
- **RF12 — Feedback de estado:** o usuário consegue ver quando uma macro está gravando,
  parada ou executando.

## Regras de negócio
- **RN1:** a tecla de pânico tem prioridade sobre qualquer execução — ao ser
  pressionada, a macro para no ato.
- **RN2:** a tecla de pânico não pode ser igual a nenhum atalho de disparo (evita
  conflito).
- **RN3:** dois atalhos de disparo diferentes não podem apontar para a mesma tecla
  ao mesmo tempo.
- **RN4:** durante a gravação, as próprias teclas de controle do app (parar gravação,
  pânico) não entram na macro.
- **RN5:** delays são preservados como foram gravados; o usuário pode editá-los, mas o
  padrão é o tempo real capturado.

## Requisitos não-funcionais
- **RNF1 — Local:** funciona 100% offline; nenhuma macro sai da máquina.
- **RNF2 — Responsividade do controle:** a tecla de pânico deve abortar em tempo
  praticamente imediato, mesmo em loop.
- **RNF3 — Precisão de tempo:** os delays reproduzidos devem ficar próximos dos
  gravados (pequena margem aceitável).
- **RNF4 — Persistência:** macros salvas sobrevivem a fechar/reabrir o app e reinício
  do Windows.

## Critérios de aceite
- Gravo uma sequência (mover mouse -> clicar -> digitar -> esperar), salvo, fecho o
  app, reabro e ela continua lá.
- Executo a macro salva e ela reproduz as ações nas posições e tempos corretos.
- Configuro atalhos globais para duas macros, minimizo o app, aperto F6 e roda a macro
  A; aperto F7 e roda a macro B.
- Configuro repetição em loop, inicio, aperto a tecla de pânico e ela para na hora.
- Edito um passo (mudo uma coordenada e um delay), executo e o comportamento reflete a
  mudança.
- Troco o modo de mouse de "pulo direto" para "trajetória" e vejo a diferença na
  reprodução.

## Questões em aberto
- **Q1 — Stack/tecnologia:** ainda não definida (linguagem, framework de UI). É decisão
  da etapa de arquitetura. Preferência de linguagem do usuário: a confirmar.

## Próximo passo
Arquitetura e plano de implementação (skill `architect`): definir stack, estrutura do
projeto, como capturar eventos globais no Windows, como registrar múltiplos atalhos
globais e o formato de salvamento das macros.
