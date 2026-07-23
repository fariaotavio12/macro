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
- [ ] **(Fase 2) Passo clickImage** · template matching (OpenCV) como novo `type` de Step
- [ ] **(Fase 3) Landing page de download** · build web do mesmo template hospedando o `.exe`

## Critérios de Aceite
- [ ] `npm run electron:dev` abre o app com a UI do template dentro do Electron.
- [ ] Gravar uma sequência (mover→clicar→digitar→esperar), salvar, fechar, reabrir → persiste.
- [ ] Executar a macro reproduz ações nas posições e delays corretos.
- [ ] Duas macros ativas: F6 roda A, F7 roda B, com app minimizado na bandeja.
- [ ] Loop + tecla de pânico configurada → aborta na hora.
- [ ] Editar coordenada/delay de um passo reflete na execução.
- [ ] Alternar modo de mouse jump↔trajectory muda a reprodução.
- [ ] electron-builder gera um `.exe` instalável que roda em máquina limpa.
