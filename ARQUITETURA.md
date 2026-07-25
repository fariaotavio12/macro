# Plano de Arquitetura: App de Macros (Electron + React/Vite)

> Entrada: [REQUISITOS.md](REQUISITOS.md). Este documento define o **como**.

## Objetivo
Transformar o app de macros dos requisitos em um desktop Windows, reaproveitando o
template React/Vite/TS existente (`template-react-vite`) como camada de interface,
envelopado em Electron, com um motor nativo de captura e reprodução de input.

## Estado Atual (o que dá pra reaproveitar do template)
- **React 19 + Vite (rolldown-vite) + TypeScript** — base da UI (renderer).
- **Tailwind v4 + Radix UI + padrão shadcn** (`cva`, `clsx`, `tailwind-merge`) — componentes.
- **react-hook-form + zod** — formulários (config de macro, atalho, repetição).
- **@tanstack/react-table** — lista de passos e biblioteca de macros.
- **react-router-dom v7** — navegação entre telas.
- **sonner** (toasts), **lucide-react** (ícones), **framer-motion** (animações).
- **NÃO reaproveitar:** camada `src/app/api` (axios/backend remoto) e `authProvider` —
  o app é local e sem login. Persistência passa a ser em arquivo local via Electron.

## O problema técnico central
JavaScript/Electron **não** captura nem simula input global do sistema sozinho.
Isso exige dois módulos nativos rodando no **processo main** (Node), nunca no renderer:

| Necessidade | Biblioteca | Papel |
|---|---|---|
| Gravar input global (teclado + mouse + movimento) | `uiohook-napi` | RF1, tecla de pânico, atalhos |
| Reproduzir input (mover/clicar/digitar) | `@nut-tree-fork/nut-js` | RF2 |
| Registrar atalhos globais | `globalShortcut` (Electron) OU `uiohook` | RF9, RF10 |

**Decisão de alto impacto:** a tecla de pânico (RN1) e os atalhos de disparo ficam no
listener do `uiohook` (não no `globalShortcut`), porque precisam ter prioridade e
responder mesmo com o motor de reprodução ocupado.

## Alternativas Consideradas (ferramenta de build do Electron)
1. **electron-vite** — integração pronta main/preload/renderer. Contra: pode conflitar
   com o override `rolldown-vite` do template.
2. **vite-plugin-electron** — leve, plugin dentro do Vite atual. Menor risco com rolldown.
3. **Build separado** (renderer via Vite atual + esbuild p/ main/preload + electron-builder).
   Mais controle, mais config manual.

**Recomendado:** começar pela **opção 2 (vite-plugin-electron)** pela menor fricção com o
rolldown-vite já configurado; se der atrito, cair pra opção 3. Empacotamento final com
**electron-builder** (gera instalador NSIS `.exe`).

## Abordagem Proposta
Arquitetura em dois processos, com contrato IPC no meio:

```
┌─────────────────────────── Electron ───────────────────────────┐
│  MAIN (Node)                          RENDERER (React/Vite/TS)  │
│  ┌──────────────────────┐             ┌──────────────────────┐ │
│  │ Motor de Macro       │             │ UI (template)        │ │
│  │  - recorder (uiohook)│  ◄──IPC──►  │  - Biblioteca        │ │
│  │  - player (nut.js)   │  preload/   │  - Editor de passos  │ │
│  │  - hotkeys + pânico  │  contextBridge│ - Config/atalhos    │ │
│  │  - storage (fs JSON) │             │  - Estado (gravando/ │ │
│  └──────────────────────┘             │    rodando/parado)   │ │
│         userData/macros/*.json        └──────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Modelo de dados (extensível — prepara Fase 2)
Passo como união discriminada por `type`, pra encaixar `clickImage` depois sem reescrever:
```ts
type Step =
  | { type: 'moveMouse'; x: number; y: number }
  | { type: 'click'; button: 'left'|'right'|'middle'; x: number; y: number }
  | { type: 'type'; text: string }
  | { type: 'key'; keys: string[] }           // combinação, ex ['ctrl','c']
  | { type: 'wait'; ms: number }
  // Fase 2: | { type: 'clickImage'; imagePath: string; tolerance: number }

type Macro = {
  id: string; name: string;
  steps: Step[];
  trigger?: { hotkey: string };               // ex 'F6'
  repeat: { mode: 'once'|'times'|'loop'; count?: number };
  mouseMode: 'jump'|'trajectory';             // Q3, por macro
  active: boolean;                            // registrada no atalho global
}
type Settings = { panicKey: string }          // ex 'Esc', configurável
```
Persistência: um JSON por macro em `app.getPath('userData')/macros/` + um `settings.json`.

### Contrato IPC (integração entre camadas)
- `macro:list / get / save / delete` — CRUD na storage.
- `record:start / record:stop` → main captura via uiohook, devolve `Step[]`.
- `record:event` (main→renderer) — passos chegando ao vivo durante gravação.
- `play:start(macroId) / play:stop` — main executa/aborta via nut.js.
- `play:state` (main→renderer) — `gravando | rodando | parado` (RF12).
- `hotkeys:sync` — main (re)registra os atalhos das macros ativas + tecla de pânico.
- `settings:get / set` — tecla de pânico e afins.

## Estrutura de Pastas (nova + reaproveitada)
```
electron/                      # NOVO — processo main (Node)
  main.ts                      # janela, tray/minimizar, ciclo de vida
  preload.ts                   # contextBridge: expõe API IPC segura ao renderer
  engine/
    recorder.ts                # uiohook: captura -> Step[]
    player.ts                  # nut.js: Step[] -> input real (jump/trajectory)
    hotkeys.ts                 # registra triggers + listener de pânico
    storage.ts                 # fs: CRUD de macros/settings em userData
  ipc.ts                       # handlers dos canais acima
shared/
  macro-types.ts               # NOVO — tipos Step/Macro/Settings (main + renderer)
src/features/macros/           # NOVO — segue o padrão de feature slice do template
  page-library.tsx             # lista de macros (react-table)
  page-editor.tsx              # editor de passos
  components/StepList.tsx, StepForm.tsx, RecordButton.tsx, HotkeyInput.tsx
  hooks/useMacroBridge.ts      # wrapper do window.api (IPC) p/ o renderer
  index.ts
src/app/routing/               # REAPROVEITADO — nova rota registrada aqui, sem middleware de auth
src/components/                # REAPROVEITADO — Typography, Button, Table, Dialog, etc.
electron-builder.yml           # NOVO — empacota instalador NSIS .exe
```

## Áreas Afetadas
- **Novo:** todo o diretório `electron/`, `shared/`, `src/features/macros/`, config
  de build (vite-plugin-electron, electron-builder), dependências nativas.
- **Alterado:** `package.json` (scripts `electron:dev`/`build`, deps), `vite.config`,
  `src/app/routing/index.tsx` (rota inicial → Biblioteca de macros, sem middleware de
  auth — app local não tem login).
- **Ignorado/removido do fluxo:** `src/app/api` remoto, `authProvider`, telas de
  login/landing/dashboard demo do template (ficam no repo mas fora das rotas ativas).

## Riscos e Tradeoffs
- **Módulos nativos:** `uiohook-napi` e `nut.js` precisam de binários por versão de
  Node/Electron; empacotar exige atenção (electron-builder + rebuild). Principal risco.
- **rolldown-vite:** override não-padrão pode atritar com plugins Electron → plano B é
  build separado (opção 3).
- **Peso:** instalador Electron ~80-150MB. Aceito, dado o reaproveitamento da UI.
- **Permissões Windows:** captura/reprodução global pode exigir rodar sem elevação para
  a maioria dos apps; alguns apps com privilégio de admin podem não receber input.
- **Fidelidade de tempo (RNF3):** timers de JS têm jitter; validar precisão de delays.

## Plano de Implementação

- [ ] **E1 — Bootstrap Electron sobre o template** · integrar `vite-plugin-electron`,
  criar `electron/main.ts` + `preload.ts`, subir a UI atual dentro de janela Electron ·
  arquivos: `electron/`, `vite.config`, `package.json` · valida: `npm run electron:dev` abre a janela
- [ ] **E2 — Tipos compartilhados** · `shared/macro-types.ts` (Step/Macro/Settings) ·
  depende de: E1
- [ ] **E3 — Storage local** · `engine/storage.ts` + IPC `macro:*` e `settings:*` (CRUD
  em JSON no userData) · depende de: E2 · valida: salvar/ler macro fake persiste
- [ ] **E4 — Motor de reprodução (player)** · `engine/player.ts` com nut.js, modos
  jump/trajectory, respeitando delays; IPC `play:start/stop` + `play:state` · depende de: E2
- [ ] **E5 — Motor de gravação (recorder)** · `engine/recorder.ts` com uiohook, IPC
  `record:start/stop` + stream `record:event` · depende de: E2
- [ ] **E6 — Hotkeys globais + tecla de pânico** · `engine/hotkeys.ts`: registra atalhos
  das macros ativas (RF9/RF10) e listener de pânico prioritário (RN1); IPC `hotkeys:sync`
  · depende de: E4, E5
- [ ] **E7 — Tray / rodar minimizado** · minimizar p/ bandeja, app segue ativo · depende de: E1
- [ ] **U1 — Layout das telas (contrato de layout)** · Biblioteca, Editor de passos,
  Config · **skill: design-front-end** · aprovar antes de implementar
- [ ] **U2 — Tela Biblioteca de macros** · lista (react-table), criar/duplicar/excluir,
  ativar/desativar, botão executar · depende de: U1, E3 · skill: design-front-end
- [ ] **U3 — Editor de passos** · add/remove/reordenar/editar passos, coordenadas e
  delays; botão Gravar (RecordButton) integrado ao recorder · depende de: U1, E5 · skill: design-front-end
- [ ] **U4 — Config de disparo/repetição/mouse** · HotkeyInput, repetição once/times/loop,
  modo de mouse, tecla de pânico global · depende de: U1, E6 · skill: design-front-end
- [ ] **U5 — Feedback de estado (RF12)** · indicador gravando/rodando/parado + toasts
  (sonner) · depende de: E4, E5 · skill: design-front-end
- [ ] **E8 — Empacotar instalador** · electron-builder → NSIS `.exe`; testar em máquina
  limpa · depende de: tudo acima
- [ ] **(Fase 3) Landing page de download** · build web do mesmo template hospedando o `.exe`

## Critérios de Aceite (Fase 1)
- [ ] `npm run electron:dev` abre o app com a UI do template dentro do Electron.
- [ ] Gravar uma sequência (mover→clicar→digitar→esperar), salvar, fechar, reabrir → persiste.
- [ ] Executar a macro reproduz ações nas posições e delays corretos.
- [ ] Duas macros ativas: F6 roda A, F7 roda B, com app minimizado na bandeja.
- [ ] Loop + tecla de pânico configurada → aborta na hora.
- [ ] Editar coordenada/delay de um passo reflete na execução.
- [ ] Alternar modo de mouse jump↔trajectory muda a reprodução.
- [ ] electron-builder gera um `.exe` instalável que roda em máquina limpa.

---

## Fase 2: Clicar na Imagem, Picker de Coordenadas e Condicionais IF

> Entrada: RF/RN da Fase 1 acima + F2.1/F2.2 do [REQUISITOS.md](REQUISITOS.md). Este
> documento assume a Fase 1 (E1-E8) concluída.

### Objetivo
Destravar a Fase 2 já prevista: (1) um passo que localiza uma imagem de referência na
tela via template matching e clica nela; (2) um seletor visual de coordenadas a partir
de screenshot, reaproveitado em todos os passos com X/Y; (3) um passo condicional `IF`
(com bloco então/senão de múltiplos passos) avaliando condições em tempo de execução —
cor de pixel ou imagem encontrada — no espírito do ElfBot.

### Estado Atual (reaproveitável)
- `Step` já é união discriminada em `shared/macro-types.ts`, pensada para crescer sem
  reescrever o core (o próprio arquivo já tem o comentário `// Fase 2: clickImage`).
- `electron/engine/player.ts` executa passos com `switch` num loop simples; `nut-js` já
  está instalado e sua classe `screen` já expõe `find`, `waitFor`, `grab`, `grabRegion`,
  `colorAt` — só falta um *vision provider* registrado (hoje não há nenhum).
- `sharp` já é dependência (útil para crop/encode de imagem).
- IPC segue um padrão firme: canal em `shared/ipc-channels.ts`, handler em
  `electron/ipc.ts`, bridge tipada em `electron/preload.ts`. O fluxo de gravação já
  minimiza a janela antes de capturar input global (`ipc.ts` → `recordStart`) — mesmo
  padrão serve para screenshot.
- UI de passos é uma lista plana: `add-step-menu.tsx` monta o passo, `step-row.tsx`
  edita por `switch(step.type)`, `macro-editor-sheet.tsx` mutila `draft.steps` por
  índice (update/remove/move).

### Decisão de alto impacto: biblioteca de template matching
`nut-js` sozinho não faz template matching — precisa de um motor de visão. Avaliado:
1. **`@udarrr/template-matcher`** — fork mantido para `@nut-tree-fork/nut-js`, usa
   `opencv4nodejs-prebuilt-install` (binário nativo pré-compilado). **Tentado primeiro,
   rejeitado na validação (F2-E1):** os binários pré-compilados desse pacote param em
   Node ABI antigo — não existe prebuild para o Node 24 deste ambiente (nem para o Node
   embutido no Electron), e o install script (`prebuild-install || exit 0`) falha
   silenciosamente sem quebrar o `npm install`, mascarando o problema até tentar usar
   `screen.find()` de fato. Recompilar da fonte exigiria toolchain completo de OpenCV —
   inviável para um instalador consumer.
2. `opencv4nodejs` puro, integração manual — mesmo problema de binário nativo do item 1.
3. **`@techstark/opencv-js`** — build WASM do OpenCV.js, zero binário nativo, zero
   dependência de ABI de Node/Electron. **Adotado.** Custo: ~15MB de asset WASM (aceito,
   mesma categoria do peso já assumido para o instalador) e API menos ergonômica (é
   preciso implementar o `matchTemplate`/`cvtColor`/`minMaxLoc` manualmente em
   `electron/engine/vision.ts` em vez de usar `screen.find()` do nut-js diretamente —
   `colorAt`/`grab`/`grabRegion` do nut-js continuam sendo reaproveitados normalmente).

**Risco validado (F2-E1):** confirmado que binário nativo era inviável neste ambiente;
resolvido trocando para WASM. `@techstark/opencv-js` entra em `asarUnpack` no
`package.json` por precaução (mesmo grupo do `uiohook-napi`/`nut-tree-fork`), embora
rode em Node puro (processo main) e provavelmente funcione mesmo dentro do asar.

### Abordagem Proposta

**Modelo de dados** (`shared/macro-types.ts`), estendendo a união sem quebrar nada
existente:
```ts
export type Region = { x: number; y: number; width: number; height: number };

export type Condition =
  | { kind: "pixelColor"; x: number; y: number; color: string; tolerance: number }
  | { kind: "imageFound"; imagePath: string; tolerance: number; region?: Region };
// tolerance: 0-100 (cor) / 0-1 confidence (imagem). `negate?: boolean` em ambos.

export type Step =
  | ...os 5 tipos da Fase 1...
  | { id: string; type: "clickImage"; imagePath: string; tolerance: number; timeoutMs: number; button: MouseButton }
  | { id: string; type: "if"; condition: Condition; then: Step[]; else: Step[] };
```
`Step` recursivo (TS aceita tipos recursivos normalmente) — 100% serializável em JSON,
sem precisar de grafo/programa separado.

**Imagens de referência:** salvas como PNG em `userData/macros/images/<uuid>.png`;
`imagePath` no JSON guarda só o **nome do arquivo**, nunca o caminho absoluto (macro
continua portátil entre máquinas). Resolução pra caminho absoluto só acontece dentro
do processo main.

**Motor de visão** (novo `electron/engine/vision.ts`): inicializa o `@techstark/opencv-js`
(WASM) uma vez, lazy, no primeiro uso. Captura tela/região via `screen.grab()` /
`screen.grabRegion()` do nut-js, converte para `Jimp` (via `imageToJimp`, já usado
internamente pelo nut-js) e daí para `cv.Mat` em escala de cinza para rodar
`cv.matchTemplate` + `cv.minMaxLoc` manualmente (não existe `screen.find()` pronto sem
um vision provider nativo — ver decisão acima). Expõe:
- `findImage(imagePath, tolerance, region?)` → `Region | null` (nunca lança — retorna
  `null` se não encontrar ou se a imagem de referência não existir mais em disco).
- `waitForImage(imagePath, tolerance, timeoutMs, region?, isAborted?)` → como acima,
  tentando repetidamente até o timeout ou até `isAborted()`.
- `colorAt(x, y)` → reaproveita `screen.colorAt` do nut-js.
- `matchesCondition(condition)` → avalia `pixelColor` (distância euclidiana de cor,
  tolerância 0-100%) ou `imageFound` (com `negate`) e retorna `boolean`.

**Player** (`electron/engine/player.ts`) — `executeStep` vira recursivo:
- `clickImage`: `findImage(...)`; se achou, move+clica no centro da região; se não
  achou dentro do `timeoutMs`, **pula o passo e segue** (loga, não aborta a macro —
  decisão para não travar loop infinito esperando algo que nunca aparece).
- `if`: avalia a condição; executa recursivamente a lista `then` ou `else`,
  verificando `isAborted()` a cada passo igual já é feito hoje.

**Screenshot + picker de coordenadas** (escopo geral — cobre todos os passos com X/Y,
não só o `clickImage`): novos canais IPC `screenshot:capture` (main minimiza a janela
— reaproveitando `minimizeMainWindow()` de `electron/window-ref.ts` — grava a tela com
`screen.grab()`, devolve PNG como data URL via `Jimp`) e `screenshot:crop-save`
(renderer manda uma `Region`; main grava exatamente essa região com
`screen.grabRegion()` e persiste em `images/` via `Jimp`, devolve
`{ imagePath, width, height }`). `sharp` segue instalado mas não foi usado aqui — o
`Jimp` já vem embutido como dependência do `nut-js` e cobre o pipeline
grab→encode/crop→PNG sem precisar de uma segunda lib de imagem.
Novo componente `ScreenshotPicker` em `src/features/macros/components/`: overlay
full-screen com a screenshot capturada, calcula fator de escala tela-real ↔
imagem-exibida, e suporta:
- **modo ponto** — clique único → `{x,y}` reais (usado em `moveMouse`/`click`, um
  ícone de mira ao lado dos inputs X/Y existentes).
- **modo região** — arrasta um retângulo → `Region` (usado para capturar a imagem de
  referência do `clickImage` e o `region` opcional de `imageFound`).
Exibição de thumbnails salvos: registrar um protocolo customizado (`macro-image://`)
no `electron/main.ts` apontando para `userData/macros/images/`, evitando reencodar
base64 toda hora que a UI precisa mostrar uma miniatura já salva.

**UI de blocos IF:** extrair o `.map` de renderização de passos que hoje vive dentro
de `macro-editor-sheet.tsx` para um componente reutilizável `StepList` (`steps`,
`onChange`). Um novo `IfStepRow` renderiza o editor da condição + duas seções
recolhíveis "Então"/"Senão", cada uma é **outra instância do mesmo `StepList`** (com
seu próprio `AddStepMenu`, inclusive podendo adicionar outro `if` lá dentro —
recursão de componente React resolve nesting arbitrário de graça, sem precisar
inventar endereçamento por path).

### Áreas Afetadas
- `shared/macro-types.ts` — `Condition`, `Region`, `Step.clickImage`, `Step.if`.
- `shared/ipc-channels.ts`, `electron/ipc.ts`, `electron/preload.ts` — canais
  `screenshot:capture`, `screenshot:crop-save`.
- `electron/engine/vision.ts` (novo), `electron/engine/player.ts` (recursivo),
  `electron/engine/storage.ts` (helpers de imagem), `electron/main.ts` (registro do
  protocolo `macro-image://`).
- `src/features/macros/components/`: novo `screenshot-picker.tsx`, novo
  `if-step-row.tsx`, extração de `step-list.tsx`, ajustes em `step-row.tsx` e
  `add-step-menu.tsx`.
- `package.json` — novas dependências `@techstark/opencv-js` e `jimp` (esta última
  antes só transitiva via nut-js, agora usada diretamente), entrada em `asarUnpack`.

### Riscos e Tradeoffs
- ~~Binário nativo do OpenCV precisa sobreviver ao `electron-builder`~~ — descartado:
  trocado para `@techstark/opencv-js` (WASM), sem binário nativo, sem passo de rebuild
  específico de plataforma/ABI.
- Tolerância de matching é sensível a resolução/tema/anti-aliasing (já previsto no RF
  F2.2) — exposta como slider por passo, sem solução mágica.
- `clickImage` que nunca encontra a imagem: comportamento padrão é pular após
  `timeoutMs`, para não travar a macro em loop eterno — "esperar para sempre" fica
  para depois.
- Imagens de referência órfãs (macro apagada não apaga a imagem associada) — aceito
  como débito técnico menor por ora, não crítico para a Fase 2.
- Protocolo customizado do Electron para servir imagem local ao `<img>` tem uma
  pegadinha conhecida (precisa `registerSchemesAsPrivileged` antes do app ficar
  `ready`) — sinalizado para não ser esquecido na implementação.

### Plano de Implementação

> Implementado direto de ponta a ponta a pedido do usuário — os gates F2-U1/F2-U4 de
> aprovação de layout via `design-front-end` foram pulados (sem pausa pra revisão
> visual intermediária); vale um passe de revisão visual depois.

- [x] **F2-E1 — Vision provider (prova de conceito)** · tentativa com
  `@udarrr/template-matcher` falhou na validação (sem prebuild nativo pro Node deste
  ambiente) — trocado para `@techstark/opencv-js` (WASM), ver decisão de alto impacto
  acima · arquivos: `package.json`, `electron/engine/vision.ts`
- [x] **F2-E2 — Tipos compartilhados** · `Condition`, `Region`, `Step.clickImage`,
  `Step.if` em `shared/macro-types.ts`
- [x] **F2-E3 — Storage de imagens** · `getImagesDir()`, `saveImageBuffer()`,
  `resolveImagePath()`, `deleteImage()` em `electron/engine/storage.ts`
- [x] **F2-E4 — IPC de screenshot** · canais `screenshot:capture`/
  `screenshot:crop-save`, handlers em `ipc.ts`, bridge em `preload.ts`,
  `electron/engine/screenshot.ts` novo (grab + Jimp)
- [x] **F2-E5 — Protocolo `macro-image://`** · registrado em `main.ts`
  (`registerSchemesAsPrivileged` antes do `ready`, handler via `protocol.handle` +
  `net.fetch`) servindo `userData/macros/images/`
- [x] **F2-E6 — Player recursivo** · `executeSteps`/`executeStep` em `player.ts` para
  `clickImage` (usa `vision.ts`, skip em timeout) e `if` (avalia condição, recursão em
  `then`/`else`)
- [x] **F2-U2 — Implementar `ScreenshotPicker`** · overlay full-screen (Radix Dialog
  primitivo direto, sem o `Dialog` compartilhado — tamanhos padrão não cobrem
  full-screen), modo ponto e modo região com drag-select
- [x] **F2-U3 — Integrar picker de ponto** em `step-row.tsx` (`PointPickerButton`,
  ícone de mira nos X/Y de `moveMouse`/`click`)
- [x] **F2-U5 — Extrair `StepList` reutilizável** de `macro-editor-sheet.tsx`,
  roteando `step.type === "if"` para `IfStepRow` e o resto para `StepRow`
- [x] **F2-U6 — Implementar `ClickImageStepRow`** · dentro do próprio `step-row.tsx`
  (não virou componente separado) usando `ImagePickerField` (novo, reutilizado também
  pelo `IfStepRow`) + protocolo `macro-image://` pra thumbnail
- [x] **F2-U7 — Implementar `IfStepRow`** · editor de condição (`pixelColor`/
  `imageFound`, com `negate`) + dois `StepList` aninhados em seções recolhíveis
  (Então/Senão), cada uma com seu próprio `AddStepMenu`
- [x] **F2-U8 — Registrar novas entradas** em `add-step-menu.tsx` ("Clicar na
  imagem", "Condição (SE)")

`npm run lint` e `npm run build` (tsc -b + vite build, renderer + main + preload)
passam limpos. **Não verificado em runtime** (captura de tela real, template matching
contra uma imagem real, atalho global, tecla de pânico dentro de um ramo do IF) — isso
exige rodar o app Electron de verdade num Windows, fora do alcance do ambiente onde a
implementação foi feita. Testar manualmente antes de dar como pronto para uso.

### Critérios de Aceite (Fase 2)
- [ ] Build empacotado (`electron-builder`) roda `findImage`/`matchTemplate` numa
  máquina limpa, sem erro de asset WASM faltando.
- [ ] Crio um passo `clickImage` recortando um ícone da tela via picker; a macro
  localiza e clica nele mesmo se ele estiver em posição diferente da gravada.
- [ ] Clico no ícone de mira de um passo `moveMouse`/`click` existente, seleciono um
  ponto na screenshot e os X/Y são preenchidos corretamente.
- [ ] Crio um `IF` com condição de cor de pixel, coloco 2+ passos no "então" e 1 no
  "senão"; a execução segue o ramo certo conforme a cor real da tela.
- [ ] Aninho um `IF` dentro do "então" de outro `IF` e a macro executa corretamente
  até 2 níveis de profundidade.
- [ ] Tecla de pânico aborta a macro mesmo estando dentro de um ramo do `IF` ou
  aguardando um `clickImage`.
