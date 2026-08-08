# Plano: Aba "Capturas"

> Entrada: [REQUISITOS.md](REQUISITOS.md) e [ARQUITETURA.md](ARQUITETURA.md).
> Este documento define o **o quê** e o **como** da nova aba de capturas.

## Problema

O app hoje reproduz sequências fixas de passos. Para capturar pokémon no PXG isso não
serve: os corpos aparecem em posições imprevisíveis da tela, em quantidade variável, e
o usuário precisa acertar cada um individualmente com a pokébola. Fazer isso na mão é
lento e repetitivo; fazer com macro de coordenada fixa é impossível.

## Objetivo

Uma aba nova onde o usuário cadastra **imagens de referência** (recortes dos corpos dos
pokémon) e, ao apertar uma **tecla configurável**, o app:

1. tira um print da tela,
2. encontra **todos** os corpos que batem com os templates cadastrados,
3. leva o mouse até cada um e aperta a tecla da pokébola,
4. devolve o cursor e sai do caminho.

Tudo em uma varredura só, sem re-escanear entre alvos.

## Decisões tomadas

| Decisão | Escolha | Por quê |
|---|---|---|
| Modo de acionamento | **Disparo único** por toque na tecla | O usuário quer controle: capturar, depois catar loot, depois outra coisa. Vigilância contínua gasta CPU e rouba o mouse na hora errada. |
| Modo loop | Opcional, **desligado** por padrão | Fica disponível no perfil, mas não é o fluxo principal. |
| Varredura | **1 grab de tela** por acionamento, N templates sobre o mesmo Mat | O grab é o gargalo. Hoje cada `findImage` faz um grab novo. |
| Múltiplos alvos | `matchTemplate` + threshold + **NMS** | `minMaxLoc` devolve só o melhor match — inútil quando há 5 corpos. |
| Repetição em alvo | **Cooldown por coordenada**, TTL configurável | Evita gastar 3 balls no mesmo corpo ao apertar a tecla duas vezes seguidas. |
| Ação no alvo | Mouse em cima → **tecla**, clique opcional | É como hotkey de item funciona no PXG. Clique fica atrás de um switch. |
| Cursor no fim | **Volta para onde estava** (parking configurável) | Sem isso o cursor larga o usuário em cima de uma criatura e troca o alvo. |
| Segurança | **Trava de foco de janela** | Se o jogo não está em foco, não aperta nada — evita digitar `F1` no navegador. |

---

## Comportamento (fluxo do usuário)

**Configuração (uma vez):**
1. Abre a aba Capturas → Novo perfil.
2. Define o **atalho de disparo** (ex: `F8`) e a **tecla da pokébola** (ex: `F1`).
3. Recorta na tela o corpo de cada pokémon que quer capturar → vira um template.
4. Opcional: marca a **região do jogo** (recorta a área útil da tela).
5. Usa **"Testar detecção"** para calibrar tolerância vendo os retângulos desenhados
   sobre o print, com score e tempo de scan.
6. Ativa o perfil.

**Uso (em jogo):**
1. Aperta `F8`.
2. Em ~0,5s o app varre, joga ball em cada corpo detectado e devolve o cursor.
3. Usuário segue jogando. Aperta `F8` de novo quando quiser.
4. `Esc` (tecla de pânico) aborta no meio e devolve o cursor.

---

## Modelo de dados

Arquivo novo: `shared/capture-types.ts`.

```ts
import type { Region } from "./macro-types";

export type CaptureTemplate = {
	id: string;
	name: string;
	imagePath: string;   // nome do arquivo em userData/macros/images (mesmo storage das macros)
	tolerance: number;   // 0..1 — default 0.82
	enabled: boolean;    // desligado = nem entra na varredura
};

export type CaptureParking = "origem" | "centro" | "fixo";

export type CaptureProfile = {
	id: string;
	name: string;
	hotkey?: string;             // atalho de disparo (combo canônico, ex "F8")
	active: boolean;             // registra/desregistra o atalho global

	templates: CaptureTemplate[];
	scanRegion?: Region;         // undefined = tela inteira
	excludeRegions?: Region[];   // HUD, barra de hotkeys, minimapa (fase 3)

	ballKey: string;             // tecla da pokébola, ex "F1"
	clickAfterKey: boolean;      // default false
	maxTargets: number;          // default 5
	delayBeforeKeyMs: number;    // default 40  — tempo do jogo registrar o hover
	delayBetweenTargetsMs: number; // default 120

	targetCooldownMs: number;    // default 5000 — 0 desliga
	cooldownRadiusPx?: number;   // default: metade da largura do template (mín 12)

	parking: CaptureParking;     // default "origem"
	parkingPoint?: { x: number; y: number };

	requireGameFocus: boolean;   // default true
	gameWindowTitle?: string;    // fragmento do título, ex "PokeXGames"

	mode: "once" | "loop";       // default "once"
	loopIntervalMs: number;      // default 500 — só usado no modo loop
	verifyAfterRound: boolean;   // default false — re-scan pra confirmar sumiço (fase 3)
};

export type CaptureTarget = {
	templateId: string;
	x: number; y: number; width: number; height: number;
	score: number;
};

export type CaptureRunState = {
	profileId: string;
	status: "idle" | "scanning" | "acting";
	lastRun?: {
		scanMs: number;
		totalMs: number;
		found: number;
		fired: number;
		skippedByCooldown: number;
	};
};
```

Persistência: `userData/capturas/<id>.json`, mesmo padrão de `engine/storage.ts`.
Imagens reusam `saveImageBuffer()` / `resolveImagePath()` — nada de storage novo pra imagem.

---

## Engine

### `electron/engine/vision.ts` — `findAllImages`

O `findImage` atual fica intacto (as macros dependem dele). Entra ao lado:

```ts
export async function findAllImages(
	templates: { id: string; imagePath: string; tolerance: number }[],
	region?: Region,
	maxPerTemplate = 10,
): Promise<CaptureTarget[]>
```

Algoritmo:

1. **Um único grab.** `screen.grab()` (ou `grabRegion` se houver `scanRegion`) →
   converte para Mat cinza **uma vez** e reusa para todos os templates.
2. **Cache de template.** `Map<imagePath, { mat, width, height }>`, invalidado por
   `mtime` do arquivo. Evita decode Jimp + `cvtColor` a cada acionamento.
3. Para cada template habilitado: `matchTemplate(screenGray, templateGray, TM_CCOEFF_NORMED)`.
4. **Coleta de todos os matches** — percorre `result.data32F` (matriz
   `(W-w+1) × (H-h+1)`) juntando todo ponto com valor ≥ `tolerance`. Para 1920×1080 são
   ~2M floats: alguns ms, aceitável.
5. **NMS (supressão de vizinhos).** Ordena candidatos por score decrescente; aceita um
   candidato só se estiver a mais de `max(w, h) / 2` de todo candidato já aceito.
   Sem isso um único corpo vira 8 alvos sobrepostos.
6. Aplica offset da região, junta os resultados dos templates, ordena por score,
   corta em `maxTargets`.
7. `delete()` em todo Mat temporário (o `screenGray` também) — vazamento de Mat em
   Emscripten não é coletado pelo GC do JS.

Otimização considerada: pular o Jimp e montar o Mat direto do buffer BGRA do nut.js.
Fica para a fase 3, só se o profiling mostrar que vale.

### `electron/engine/capture-runner.ts` (novo)

Estado em memória por perfil:

```ts
type FiredTarget = { x: number; y: number; templateId: string; at: number };
const firedByProfile = new Map<string, FiredTarget[]>();
const running = new Set<string>();
const aborted = new Set<string>();
```

`runCaptureOnce(profile)`:

1. **Guarda de reentrância** — se já está rodando, ignora o acionamento (não empilha).
2. **Trava de foco** — se `requireGameFocus`, checa `getActiveWindow()` do nut.js contra
   `gameWindowTitle`. Não bateu → não dispara, e o motivo vai no estado enviado ao renderer.
   Falha em aberto: se a consulta der erro, o disparo (deliberado do usuário) segue.
3. Guarda a posição atual do mouse (`mouse.getPosition()`), para o parking `origem`.
4. **Scan** — `findAllImages(templates.filter(t => t.enabled), scanRegion)`.
   Emite `status: "scanning"`.
5. **Filtro de cooldown** — descarta alvos a menos de `cooldownRadiusPx` de um
   `FiredTarget` cujo `at` ainda está dentro de `targetCooldownMs`. Limpa entradas
   vencidas antes de comparar.
6. **Ação, alvo a alvo** (`status: "acting"`), respeitando abort a cada passo:
   ```
   mouse.setPosition(centro do alvo)
   sleep(delayBeforeKeyMs)
   keyboard.pressKey(ballKey); keyboard.releaseKey(ballKey)
   if (clickAfterKey) mouse.click(LEFT)
   registra em firedByProfile
   sleep(delayBetweenTargetsMs)
   ```
7. **Parking** — devolve o cursor conforme `parking`:
   `origem` (posição salva no passo 3) · `centro` (centro de `scanRegion` ou da tela) ·
   `fixo` (`parkingPoint`). **Roda também quando abortado** — se a tecla de pânico
   larga o cursor em cima de uma criatura, o remédio virou veneno.
8. Emite `CaptureRunState` com as métricas da rodada.

`runCaptureLoop(profile)`: mesma rodada em `while`, com `sleep(loopIntervalMs)` entre
elas, até `stopCapture(id)` ou pânico. Segundo toque no atalho para.

`stopCapture(profileId)` / `stopAllCaptures()` — usados pelo botão da UI e pela tecla
de pânico.

### `electron/engine/hotkeys.ts`

- Passa a manter **dois mapas**: `combo → Macro` (atual) e `combo → CaptureProfile`.
- `onKeydown`: pânico primeiro (já é assim) → macro → perfil de captura.
- **Debounce de ~300ms** por combo, para key-repeat não disparar em cascata.
- Ao acionar: modo `once` → `runCaptureOnce`; modo `loop` → alterna start/stop.
- `stopAll()` passa a chamar `stopAllCaptures()` também.
- **Validação de conflito unificada**: hoje `assertNoHotkeyConflict` e
  `assertPanicKeyNoConflict` só olham macros. Vira um resolver único
  `findComboOwner(combo, ignoreId)` que varre macros + perfis + tecla de pânico e
  devolve quem já usa o atalho, com mensagem amigável.

### `electron/engine/capture-storage.ts` (novo)

Espelho de `storage.ts` para `userData/capturas/`: `listProfiles`, `getProfile`,
`saveProfile`, `deleteProfile`. Sem inventar padrão novo.

---

## IPC

`shared/ipc-channels.ts`:

```ts
captureList: "capture:list",
captureGet: "capture:get",
captureSave: "capture:save",
captureDelete: "capture:delete",
captureChanged: "capture:changed",
captureRun: "capture:run",
captureStop: "capture:stop",
captureState: "capture:state",
captureScanPreview: "capture:scan-preview",
```

`electron/ipc.ts` — handlers no mesmo formato dos de macro: salvar valida conflito de
atalho, persiste, `syncHotkeysFromStorage()`, `broadcast(captureChanged, ...)`.

`captureScanPreview(profileId)` devolve `{ dataUrl, width, height, targets, scanMs }`:
o print da tela **sem minimizar a janela** (o jogo precisa estar visível) mais os alvos
detectados. É o que alimenta a tela de calibração.

> Atenção: `captureScreen()` atual minimiza a janela antes do grab. O preview de
> detecção precisa de um caminho que **não** minimize — entra uma função separada em
> `screenshot.ts`, sem mexer no comportamento existente do seletor de imagem.

`electron/preload.ts` — bridge `capture` seguindo o padrão dos outros:

```ts
const captureBridge = {
	list, get, save, delete,
	onChanged,
	run: (profileId: string) => ...,
	stop: (profileId: string) => ...,
	onState: (listener: (state: CaptureRunState) => void) => ...,
	scanPreview: (profileId: string) => ...,
};
```

---

## UI (renderer)

### Navegação

- `src/app/routing/variables.ts`: `Rotas.macros.captures = "/capturas"`.
- `src/app/routing/index.tsx`: nova rota dentro de `LayoutMacroApp`.
- `src/features/macros/layout.tsx`: o header ganha nav **Macros | Capturas**
  (`NavLink` + `CustomLink` existentes). O botão de configurações continua onde está.

### `src/features/captures/`

```
api/index.ts                          hooks TanStack (mesmo shape de features/macros/api)
page-captures.tsx                     tabela de perfis
components/capture-editor-sheet.tsx   AppSheet de edição
components/template-list.tsx          lista de templates com switch + recorte
components/scan-preview-dialog.tsx    calibração visual
hooks/use-capture-state.ts            assina capture:state
```

**`page-captures.tsx`** — `ResponsiveTableCustom` igual à `page-library`:
colunas Nome · Atalho (`Kbd`) · Pokémons (nº de templates ativos) · Ativo (`Switch`),
ações Executar agora / Editar / Duplicar / Excluir. `EmptyState` e `ErrorState` iguais.

**`capture-editor-sheet.tsx`** — `AppSheet`, todo campo em `FieldWrapper`:
- Nome, atalho de disparo (`HotkeyCapture`), tecla da pokébola (`HotkeyCapture`)
- Lista de templates (`template-list`)
- Região do jogo (`ScreenshotPicker` modo `region`)
- Avançado: tolerância padrão, `maxTargets`, delays, cooldown, parking, trava de foco
- Botão **"Testar detecção"**

**`template-list.tsx`** — por linha: miniatura (`macro-image://`), nome, tolerância,
`Switch` de `enabled`, remover. Botão "Adicionar pokémon" abre o recorte de tela.

**`scan-preview-dialog.tsx`** — a peça mais importante da UI. Mostra o print com
retângulos desenhados sobre cada alvo, score de cada um, tempo do scan e quantos foram
cortados pelo cooldown. Sem isso, calibrar tolerância é tentativa e erro no escuro.

### Refactor de apoio

`screenshot-picker.tsx` e `image-picker-field.tsx` saem de `features/macros/components/`
para `src/components/` — não têm nada de domínio de macro e as duas features vão usar.
Ajustar os imports em `if-step-row.tsx`, `step-row.tsx` e `macro-editor-sheet.tsx`.

---

## Fases

### Fase 1 — Engine e IPC ✅
- [x] `shared/capture-types.ts`
- [x] `findAllImages` + NMS + cache de template em `vision.ts`
- [x] `capture-storage.ts`
- [x] `capture-runner.ts` (once + cooldown + parking + trava de foco + abort)
- [x] `hotkeys.ts`: mapa de perfis, debounce, conflito unificado, pânico aborta captura
- [x] canais IPC + bridge no preload + `captureScreenRaw` sem minimizar
- [ ] validação manual: acionar por atalho com o jogo aberto, medir tempo do scan

### Fase 2 — UI ✅
- [x] Nav com abas + rota `/capturas`
- [x] `page-captures` + `api`
- [x] `capture-editor-sheet` + `template-list`
- [x] `scan-preview-dialog`
- [x] mover `screenshot-picker` / `image-picker-field` para `src/components/`
      (junto com `hotkey-capture` + `dom-key-map` e `settings-row`, que as duas features usam)

### Fase 3 — Polimento
- [x] Modo loop exposto na UI
- [x] Zonas de exclusão (HUD, minimapa, barra de hotkeys)
- [ ] `verifyAfterRound` (re-scan confirmando que o corpo sumiu)
- [x] Métricas por rodada na tabela
- [ ] Botão de captura no dock lateral
- [ ] Mat direto do buffer BGRA (pular Jimp), se o profiling justificar

---

## Riscos e limitações

**Template matching não é invariante a escala nem a cor.** `TM_CCOEFF_NORMED` em escala
de cinza acha o sprite quase idêntico. Se o corpo muda de tamanho (zoom do cliente) ou
o sprite varia, um template não pega tudo. Mitigação: recortar apertado, cadastrar mais
de um template por pokémon, tolerância inicial **0.80–0.85**.

**Cooldown é por coordenada de tela.** Se o personagem andar entre um acionamento e
outro, os corpos mudam de posição e o cooldown erra — pode rejogar num corpo já tentado
ou liberar cedo demais. Funciona bem parado, que é o cenário real. TTL curto (5s) limita
o estrago. Amarrar à posição do mundo exigiria ler o minimapa: fora de escopo.

**Sprites repetidos na UI.** A barra de hotkeys e o inventário mostram os mesmos sprites
dos corpos. Sem região de scan bem recortada, o app detecta alvo dentro da própria
interface e joga o mouse lá. Por isso a região do jogo é quase obrigatória na prática, e
as zonas de exclusão entram na fase 3.

**Escala de DPI do Windows.** Coordenada do print × coordenada do mouse podem divergir
com escala ≠ 100%. Validar no monitor real logo na fase 1 — é barato de checar e caro de
descobrir tarde.

**Custo do scan.** Tela cheia em 1080p deve ficar em ~150–400ms por acionamento; com
região recortada, bem abaixo. Rodada completa com 3 alvos ≈ 0,5s de mouse emprestado.

**Responsabilidade.** O app só move o mouse e aperta tecla — mesma superfície das macros
que já existem. Não injeta nada no cliente, não lê memória, não esconde processo. Uso e
risco perante as regras do jogo são do usuário.

---

## Fora de escopo

- Leitura de memória do cliente ou qualquer interação além de mouse/teclado
- OCR de nome de pokémon
- Rastreio de alvo pela posição no mundo (minimapa)
- Decidir qual ball usar por espécie/raridade
- Recolher/soltar pokémon de batalha como parte do fluxo de captura
