# Tasks: Capturas unificadas

## Execution Protocol (MANDATORY -- do not skip)

Implementar com a skill `tlc-spec-driven`, seguindo o fluxo Execute e as Critical Rules. Cada tarefa termina com seu gate e um commit Conventional Commit próprio. A implementação não autoriza `git push` nem publicação remota.

**Design:** `.specs/features/capturas-unificadas/design.md`
**Status:** Approved

---

## Test Coverage Matrix

> Gerada a partir de `AGENTS.md`, `package.json`, `.github/workflows/build.yml`, da especificação e da decisão explícita do usuário. O repositório não possui testes configurados; o usuário escolheu build + UAT manual, sem adicionar testes automatizados nesta mudança.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Tipos e defaults | none | TypeScript compila e defaults são conferidos no roteiro de migração | `shared/**/*.ts` | `npm run build` |
| Migração e storage | none | Cenários CAP-15–CAP-20 são executados no UAT com cópias controladas de dados | `electron/engine/capture-*.ts` | `npm run build` + UAT |
| Runner e hotkeys | none | Disparo manual/global, conflito, loop, stop e pânico são exercitados no UAT | `electron/engine/*.ts` | `npm run build` + UAT |
| IPC e preload | none | Todas as operações singleton são exercitadas pela página e dock | `shared/ipc-channels.ts`, `electron/ipc.ts`, `electron/preload.ts` | `npm run build` + UAT |
| Hooks e API do renderer | none | Autosave latest-wins, erro, retry e flush são exercitados no UAT | `src/features/captures/{api,hooks}/**/*` | `npm run build` + UAT |
| Componentes e página | none | CAP-01–CAP-14 e CAP-21–CAP-30 são verificados no desktop e viewport estreito | `src/features/captures/**/*.tsx` | `npm run build` + UAT |
| Dock | none | Uma configuração, toggle, executar e testar são verificados no dock | `electron/dock-window.ts` | `npm run build` + UAT |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após mudança isolada sem integração completa | `npm run lint` |
| Build | Após cada tarefa e fase | `npm run verify` |
| UAT | Após fases de integração e ao final | Executar o roteiro em **UAT Final** |

---

## Execution Plan

As fases e tarefas são sequenciais. Dependências entre fases apontam para a última tarefa da fase anterior e não são repetidas nos diagramas internos.

### Phase 1: Domínio e persistência

```text
T1 -> T2 -> T3
```

### Phase 2: Runtime e bridge Electron

```text
T4 -> T5 -> T6
```

### Phase 3: Estado e autosave do renderer

```text
T7 -> T8 -> T9 -> T10
```

### Phase 4: Interface unificada

```text
T11 -> T12 -> T13
```

### Phase 5: Remoção do legado

T14 não possui dependência interna na fase.

---

## Task Breakdown

### Phase 1: Domínio e persistência

#### T1: Introduzir o contrato global de Capturas

**What:** Adicionar `CaptureConfig`, `defaultCaptureConfig` e estado de execução singleton, mantendo tipos legados temporariamente para a migração incremental.
**Where:** `shared/capture-types.ts`
**Depends on:** None
**Reuses:** Campos, defaults e limites de `CaptureProfile`.
**Requirement:** CAP-05, CAP-19, CAP-28

**Done when:**

- [x] O novo contrato não contém `id` nem `name` de perfil.
- [x] Todos os defaults atuais permanecem equivalentes.
- [x] `CaptureRunState` pode representar uma única execução sem `profileId`.
- [x] `npm run verify` passa.

**Tests:** none — decisão explícita: build + UAT manual
**Gate:** Build
**Commit:** `refactor(captures): introduce global capture config`
**Status:** ✅ Complete

#### T2: Implementar a transformação de perfis legados

**What:** Criar funções puras que escolhem o perfil-base, unem todos os templates e regeneram IDs repetidos.
**Where:** `electron/engine/capture-config-migration.ts`
**Depends on:** T1
**Reuses:** `defaultCaptureConfig` e o formato legado atual.
**Requirement:** CAP-15, CAP-16, CAP-17, CAP-20

**Done when:**

- [x] A seleção do perfil-base é determinística por estado ativo e ordem alfabética.
- [x] Templates com nomes ou imagens iguais são preservados.
- [x] Somente IDs repetidos posteriores são regenerados.
- [x] Perfis vazios produzem a configuração default.
- [x] `npm run verify` passa.

**Tests:** none — cenários cobertos pelo UAT de migração
**Gate:** Build
**Commit:** `feat(captures): add legacy profile migration`
**Status:** ✅ Complete

#### T3: Persistir uma configuração global atomicamente

**What:** Fazer o storage ler/criar `config.json`, migrar arquivos legados uma única vez e gravar snapshots via arquivo temporário e rename.
**Where:** `electron/engine/capture-storage.ts`
**Depends on:** T2
**Reuses:** Diretório `userData/capturas` e preenchimento de defaults existente.
**Requirement:** CAP-08, CAP-15, CAP-18, CAP-19, CAP-20, CAP-30

**Done when:**

- [x] `getConfig()` sempre retorna uma configuração normalizada.
- [x] Uma configuração existente impede nova migração.
- [x] Arquivos legados inválidos são logados e não interrompem os demais.
- [x] Os JSONs legados permanecem intactos.
- [x] Falha antes do rename preserva o último `config.json` válido.
- [x] `npm run verify` passa.

**Tests:** none — cenários cobertos pelo UAT de persistência e migração
**Gate:** Build
**Commit:** `feat(captures): persist global config atomically`
**Status:** ✅ Complete

### Phase 2: Runtime e bridge Electron

#### T4: Converter runner e hotkeys para estado singleton

**What:** Remover identidade de perfil do fluxo ativo de captura, cooldown, loop e mapa de atalhos, preservando comportamento e mensagens existentes.
**Where:** `electron/engine/capture-runner.ts`, `electron/engine/hotkeys.ts`
**Depends on:** T3
**Reuses:** Algoritmo atual de foco, passadas, cooldown, pânico e conflito.
**Requirement:** CAP-05, CAP-10, CAP-13, CAP-21, CAP-22, CAP-23, CAP-27

**Done when:**

- [x] Existe no máximo uma captura em execução ou loop.
- [x] `run`, `stop` e reset de cooldown não recebem ID.
- [x] Apenas uma entrada global de Capturas pode ser registrada.
- [x] Pânico e conflitos com macros mantêm a precedência e textos atuais.
- [x] O clique manual ignora a trava de foco como hoje.
- [x] `npm run verify` passa.

**Tests:** none — runtime coberto pelo UAT manual
**Gate:** Build
**Commit:** `refactor(captures): use singleton runtime`
**Status:** ✅ Complete — a mensagem de conflito de Capturas perdeu o nome do perfil
(`já está em uso pelas Capturas`); pânico, macros e precedência inalterados.

#### T5: Substituir os contratos IPC por operações globais

**What:** Trocar list/get-by-id/save/delete por get/save/run/stop/scan singleton nos canais, handlers e bridge preload.
**Where:** `shared/ipc-channels.ts`, `electron/ipc.ts`, `electron/preload.ts`, `electron/engine/screenshot.ts`, `electron/engine/jimp-runtime.ts`
**Depends on:** T4
**Reuses:** Broadcast, preview com janelas ocultas e sincronização de hotkeys existentes.
**Requirement:** CAP-08, CAP-10, CAP-13, CAP-14, CAP-21–CAP-26

**Done when:**

- [x] Nenhuma operação pública de Capturas recebe ID de perfil.
- [x] Save valida conflito antes de persistir e sincroniza o hotkey somente após sucesso.
- [x] Save reseta cooldown e emite a configuração confirmada.
- [x] Preview usa a configuração global e mantém o comportamento de ocultar app e dock.
- [x] Tipos exportados pelo preload refletem o novo contrato.
- [x] `npm run verify` passa.

**Tests:** none — bridge coberta pelo UAT manual
**Gate:** Build
**Commit:** `refactor(captures): expose global electron bridge`
**Status:** ✅ Complete — o contrato global usa os nomes limpos (`capture:*`, `capture.get/save/run/stop/scanPreview/onChanged`).
A superfície por perfil sobrevive renomeada (`capture:profile-*`, `capture.*Profile`, `@deprecated`) porque o renderer só
migra em T7–T13 e o gate é o build do repositório inteiro; T14 apaga esse bloco sem renomear nada.
`onState` continua tipado em `CaptureProfileRunState` até T9.

#### T6: Adaptar o dock para uma única Captura

**What:** Substituir a lista de perfis do dock por uma linha global com atalho, ativar, executar e testar.
**Where:** `electron/dock-window.ts`
**Depends on:** T5
**Reuses:** Layout, tabs, estados de botão e resultado de scan atuais.
**Requirement:** CAP-21, CAP-22, CAP-25, CAP-26

**Done when:**

- [x] A aba Capturas nunca mostra nomes ou múltiplas linhas de perfil.
- [x] Toggle persiste `active` na configuração global.
- [x] Executar e testar chamam APIs sem ID.
- [x] Alterações emitidas pelo main atualizam a linha.
- [x] `npm run verify` passa.

**Tests:** none — dock coberto pelo UAT manual
**Gate:** Build + UAT
**Commit:** `feat(captures): simplify dock capture controls`
**Status:** ✅ Complete no build e na inspeção local (todas as chamadas do dock existem na bridge;
`broadcast` alcança a janela do dock). O UAT interativo do dock depende do app rodando com o jogo
e continua pendente com o usuário.

### Phase 3: Estado e autosave do renderer

#### T7: Expor queries da configuração global

**What:** Substituir hooks de lista/delete por query singleton e mutação de snapshot confirmado.
**Where:** `src/features/captures/api/index.ts`
**Depends on:** T6
**Reuses:** TanStack Query e padrão de invalidation/cache atual.
**Requirement:** CAP-08, CAP-10, CAP-11

**Done when:**

- [ ] A query possui uma única chave de configuração.
- [ ] Save retorna o snapshot confirmado pelo main.
- [ ] Preview não recebe ID.
- [ ] Não existem mutations públicas de delete ou duplicate.
- [ ] `npm run verify` passa.

**Tests:** none — decisão explícita: build + UAT manual
**Gate:** Build
**Commit:** `refactor(captures): query global config`

#### T8: Implementar o coordenador de autosave latest-wins

**What:** Criar o hook de draft, debounce de 500 ms, fila serial, status, retry e flush.
**Where:** `src/features/captures/hooks/use-capture-autosave.ts`
**Depends on:** T7
**Reuses:** Query e mutation globais da tarefa anterior.
**Requirement:** CAP-08–CAP-14, CAP-29, CAP-30

**Done when:**

- [ ] Há no máximo um save em voo.
- [ ] Uma edição mais nova nunca é substituída por resposta antiga.
- [ ] `flush()` aguarda a revisão local mais recente ser confirmada.
- [ ] Erro mantém o draft e expõe retry com a mensagem original.
- [ ] Unmount tenta descarregar o snapshot pendente sem bloquear indefinidamente.
- [ ] `npm run verify` passa.

**Tests:** none — ordering e falhas cobertos pelo UAT manual escolhido
**Gate:** Build
**Commit:** `feat(captures): add serialized autosave`

#### T9: Simplificar o hook de estado de execução

**What:** Trocar o mapa indexado por perfil por um único `CaptureRunState` ao vivo.
**Where:** `src/features/captures/hooks/use-capture-state.ts`
**Depends on:** T8
**Reuses:** Listener `capture.onState` atual.
**Requirement:** CAP-23, CAP-24

**Done when:**

- [ ] O hook retorna um estado singleton com default `idle`.
- [ ] Eventos scanning, acting e idle substituem o estado anterior.
- [ ] Nenhum `profileId` permanece no hook.
- [ ] `npm run verify` passa.

**Tests:** none — estado coberto pelo UAT manual
**Gate:** Build
**Commit:** `refactor(captures): track singleton run state`

#### T10: Atualizar as notificações globais de Capturas

**What:** Remover lookup de nome de perfil e emitir mensagens para uma única Captura.
**Where:** `src/features/captures/hooks/use-capture-notifications.ts`
**Depends on:** T9
**Reuses:** Regras atuais para erro, foco, sem template e nenhum alvo.
**Requirement:** CAP-24, CAP-26

**Done when:**

- [ ] Cada summary novo é notificado no máximo uma vez.
- [ ] Mensagens não citam nome de perfil.
- [ ] Sucesso com disparos continua sem toast.
- [ ] `npm run verify` passa.

**Tests:** none — notificações cobertas pelo UAT manual
**Gate:** Build
**Commit:** `refactor(captures): notify global run results`

### Phase 4: Interface unificada

#### T11: Criar o formulário inline da configuração

**What:** Extrair os campos existentes para um formulário de seções Pokémon, Disparo, Área e Avançado recolhível, controlado por `CaptureConfig`.
**Where:** `src/features/captures/components/capture-config-form.tsx`
**Depends on:** T10
**Reuses:** `TemplateList`, `HotkeyCapture`, `SettingsRow`, pickers, cards e limites do editor atual.
**Requirement:** CAP-02–CAP-07, CAP-21, CAP-27, CAP-28

**Done when:**

- [ ] Pokémon, Disparo e Área são renderizados sem tabs.
- [ ] Avançado começa recolhido e contém todos os campos avançados atuais.
- [ ] Todo campo emite um novo snapshot sem salvar por conta própria.
- [ ] Layout funciona em uma e duas colunas conforme largura disponível.
- [ ] Nenhum campo existente de configuração é perdido.
- [ ] `npm run verify` passa.

**Tests:** none — interface coberta pelo UAT manual
**Gate:** Build + UAT
**Commit:** `feat(captures): add inline config form`

#### T12: Adaptar o preview para a configuração global

**What:** Remover prop de perfil/ID, usar a configuração global e permitir que o chamador controle o flush anterior ao scan.
**Where:** `src/features/captures/components/scan-preview-dialog.tsx`
**Depends on:** T11
**Reuses:** Renderização atual da imagem, alvos, tempos e nomes de templates.
**Requirement:** CAP-14, CAP-25, CAP-26

**Done when:**

- [ ] O dialog consulta preview sem ID.
- [ ] Labels de templates vêm da configuração exibida.
- [ ] Mensagens não citam perfil.
- [ ] Reabrir continua forçando uma varredura nova.
- [ ] `npm run verify` passa.

**Tests:** none — preview coberto pelo UAT manual
**Gate:** Build + UAT
**Commit:** `refactor(captures): preview global config`

#### T13: Substituir a tabela pela página unificada

**What:** Compor header, status de autosave, formulário, executar/parar, última rodada, retry e teste de detecção diretamente em Capturas.
**Where:** `src/features/captures/page-captures.tsx`
**Depends on:** T12
**Reuses:** Estados de erro/loading, botões, badges, autosave, run state e preview.
**Requirement:** CAP-01–CAP-14, CAP-21–CAP-30

**Done when:**

- [ ] Não existe tabela, perfil, sheet, duplicate ou delete na página.
- [ ] `Salvando`, `Salvo` e `Erro ao salvar` aparecem nos estados corretos.
- [ ] Retry repete o snapshot atual sem descartar alterações.
- [ ] Testar chama `flush()` e só abre preview após save bem-sucedido.
- [ ] Executar/Parar e o resumo refletem o estado singleton.
- [ ] A tela atende desktop e viewport estreito no roteiro UAT.
- [ ] `npm run verify` passa.

**Tests:** none — página coberta pelo UAT manual
**Gate:** Build + UAT
**Commit:** `feat(captures): unify capture configuration page`

### Phase 5: Remoção do legado

#### T14: Remover superfícies e compatibilidade de perfis

**What:** Excluir o editor de perfil e remover tipos, exports, canais, handlers e helpers legados que ficaram temporariamente durante a migração incremental.
**Where:** `src/features/captures/components/capture-editor-sheet.tsx`, `shared/capture-types.ts`, `shared/ipc-channels.ts`, `electron/engine/capture-storage.ts`, `electron/engine/capture-runner.ts`, `electron/engine/hotkeys.ts`, `electron/ipc.ts`, `electron/preload.ts`
**Depends on:** T13
**Reuses:** N/A; limpeza final depois que todos os consumidores usam `CaptureConfig`.
**Requirement:** CAP-01, CAP-05, CAP-18

**Done when:**

- [ ] `rg -n "CaptureProfile|profileId|listProfiles|getProfile|saveProfile|deleteProfile" shared electron src/features/captures` não encontra contratos ativos; tipos locais de migração podem usar apenas o nome `LegacyCaptureProfile`.
- [ ] Não existem canais públicos list/get-by-id/delete de Capturas.
- [ ] O arquivo do editor antigo foi removido.
- [ ] A migração ainda lê arquivos legados sem reativar suas APIs.
- [ ] `npm run verify` e todo o UAT final passam.

**Tests:** none — regressão coberta pelo UAT final escolhido
**Gate:** Build + UAT
**Commit:** `refactor(captures): remove profile legacy surface`

---

## Phase Execution Map

```text
Phase 1: T1 -> T2 -> T3
Phase 2: T4 -> T5 -> T6
Phase 3: T7 -> T8 -> T9 -> T10
Phase 4: T11 -> T12 -> T13
Phase 5: T14
```

As fases executam em ordem. Cada tarefa depende também da conclusão da fase anterior quando aplicável.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Um contrato compartilhado | ✅ Granular |
| T2 | Uma transformação pura | ✅ Granular |
| T3 | Um módulo de storage | ✅ Granular |
| T4 | Um runtime singleton em dois módulos acoplados | ⚠️ Coeso; separar quebraria o gate entre runner e registry |
| T5 | Um contrato IPC ponta a ponta | ⚠️ Coeso; canais, handler e preload devem compilar juntos |
| T6 | Uma UI de dock | ✅ Granular |
| T7 | Uma camada API | ✅ Granular |
| T8 | Um coordenador de autosave | ✅ Granular |
| T9 | Um hook de estado | ✅ Granular |
| T10 | Um hook de notificação | ✅ Granular |
| T11 | Um formulário controlado | ✅ Granular |
| T12 | Um dialog | ✅ Granular |
| T13 | Uma página | ✅ Granular |
| T14 | Uma remoção de compatibilidade transversal | ⚠️ Atômica; os contratos legados precisam sair juntos para preservar build verde |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Início | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 (fase anterior) | Início da fase 2 | ✅ Cross-phase |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 (fase anterior) | Início da fase 3 | ✅ Cross-phase |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 (fase anterior) | Início da fase 4 | ✅ Cross-phase |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 (fase anterior) | Fase 5 | ✅ Cross-phase |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1–T14 | Todos os layers em escopo | none + Build/UAT | none + gate correspondente | ✅ Conforme decisão do usuário |

---

## UAT Final

1. **Instalação limpa:** abrir Capturas sem dados e confirmar configuração inativa, Pokémon vazio e seções inline.
2. **Autosave:** editar rapidamente nome de Pokémon, confiança e teclas; observar `Salvando` → `Salvo`; reiniciar e conferir valores.
3. **Erro e retry:** provocar conflito com tecla de pânico ou macro; conferir draft preservado, mensagem existente e retry após corrigir.
4. **Latest-wins:** alterar o mesmo campo durante um save e confirmar após reinício apenas o valor mais novo.
5. **Migração:** iniciar com dois perfis legados, Pokémon distintos e IDs repetidos; confirmar união, opções do primeiro ativo alfabético e arquivos legados intactos.
6. **Migração parcial:** incluir um JSON inválido; confirmar que os válidos migram e o nome inválido aparece no log.
7. **Operação:** ativar, disparar pelo hotkey, executar manualmente, parar loop e usar pânico.
8. **Detecção:** editar template/área e clicar Testar imediatamente; confirmar que o preview usa a edição mais recente.
9. **Dock:** ativar, executar e testar a única Captura pelo dock; confirmar atualização após edição na página.
10. **Responsividade:** validar todas as seções em largura desktop e estreita, sem campos essenciais escondidos.
11. **Regressão:** executar uma macro, gravar/reproduzir passos e abrir Configurações para confirmar que fluxos não relacionados continuam funcionando.

---

## Tools for Execute

- **MCPs:** nenhum necessário; filesystem/shell locais são suficientes.
- **Skills:** `tlc-spec-driven` em todas as tarefas; `traycer-changeset-walkthrough` após mudanças substantivas, se solicitado.
- **Sub-agents:** 14 tarefas formam mais de um lote. Antes de Execute, oferecer delegação conforme a skill; nunca criar agentes sem aceite explícito.
