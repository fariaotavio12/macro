# Especificação: Capturas unificadas

**Status:** Approved

## Problem Statement

A tela de Capturas apresenta uma tabela de perfis, mas todas as ações úteis ficam em um painel lateral com quatro abas. Para o uso atual, os perfis criam etapas desnecessárias: o usuário quer cadastrar Pokémon, configurar as teclas e ajustar a detecção diretamente na mesma página.

## Goals

- [ ] Permitir configurar e operar Capturas sem criar, escolher, nomear, duplicar ou excluir perfis.
- [ ] Exibir Pokémon, disparo e área diretamente na página de Capturas.
- [ ] Persistir alterações automaticamente e comunicar claramente o estado do salvamento.
- [ ] Migrar os perfis existentes para uma única configuração sem perder Pokémon cadastrados.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Teclas ou regras diferentes por Pokémon | A decisão de produto é usar uma configuração global para todos os Pokémon. |
| Múltiplos conjuntos de Capturas | A mudança elimina o conceito de perfil da experiência e do domínio. |
| Alterações no algoritmo de visão | O objetivo é simplificar configuração e persistência, preservando a detecção atual. |
| Sincronização em nuvem ou entre computadores | O aplicativo continua com armazenamento local. |
| Excluir imediatamente os arquivos legados de perfis | Eles serão mantidos como recuperação após a migração. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Quantidade de configurações | Uma configuração global | Remove a etapa de administrar perfis e corresponde ao fluxo solicitado. | Sim |
| Escopo das teclas e opções | Um atalho, uma tecla de pokébola, uma área e um conjunto de opções para todos os Pokémon | Mantém o motor atual e reduz a configuração recorrente. | Sim |
| Persistência | Autosave com debounce de 500 ms após a última alteração | Evita botão Salvar sem disparar gravações a cada tecla digitada. | Sim |
| Layout principal | Pokémon, Disparo e Área visíveis na página; Avançado recolhível | Mantém o essencial acessível e evita uma página excessivamente longa. | Não, padrão proposto |
| Configuração-base na migração | Primeiro perfil ativo em ordem alfabética; se nenhum estiver ativo, primeiro perfil em ordem alfabética | Produz uma escolha determinística e prioriza a configuração em uso. | Sim |
| União de Pokémon na migração | Preservar todos os templates de todos os perfis; regenerar apenas IDs repetidos | Evita perda de dados e mantém itens que tenham mesmo nome ou imagem. | Sim |
| Arquivos antigos após migração | Manter os JSONs de perfil como backup e não relê-los após criar a configuração global | Torna a migração idempotente e recuperável sem manter dois domínios ativos. | Não, padrão proposto |
| Teste de detecção com alteração pendente | Forçar o salvamento mais recente antes de iniciar o teste | Garante que o teste represente os valores exibidos na tela. | Não, padrão proposto |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Configurar Capturas em uma única página ⭐ MVP

**User Story**: Como usuário do aplicativo, quero cadastrar Pokémon e configurar o disparo na própria página de Capturas para concluir a preparação sem administrar perfis ou abrir um editor separado.

**Why P1**: Este é o objetivo central da simplificação solicitada.

**Acceptance Criteria**:

1. The Capturas page SHALL NOT display actions to create, name, select, duplicate, or delete capture profiles. `[CAP-01]`
2. WHEN the user opens Capturas THEN the system SHALL display the Pokémon, Disparo, and Área sections on the page without opening a sheet or dialog. `[CAP-02]`
3. WHEN the user adds a Pokémon THEN the system SHALL add one editable item with active state, name, reference image, and confidence fields. `[CAP-03]`
4. WHEN the user removes a Pokémon THEN the system SHALL remove only the selected item from the global configuration. `[CAP-04]`
5. The system SHALL apply the global hotkey, ball key, scan area, excluded areas, and execution options to every enabled Pokémon. `[CAP-05]`
6. WHILE advanced settings are collapsed, the system SHALL keep Pokémon, Disparo, and Área available without requiring another navigation level. `[CAP-06]`
7. WHEN the viewport cannot fit the desktop layout THEN the system SHALL stack the same configuration sections vertically without hiding any essential field. `[CAP-07]`

**Independent Test**: Abrir Capturas, adicionar um Pokémon, definir imagem e teclas e ajustar a área sem navegar para outra tela ou abrir um editor de perfil.

---

### P1: Salvar automaticamente com integridade ⭐ MVP

**User Story**: Como usuário, quero que cada alteração seja salva automaticamente para não precisar lembrar de confirmar a configuração.

**Why P1**: O autosave é parte da redução de etapas aprovada pelo usuário.

**Acceptance Criteria**:

1. WHEN 500 ms pass after the latest configuration change THEN the system SHALL persist one complete snapshot of the latest global configuration. `[CAP-08]`
2. WHILE a snapshot is being persisted, the system SHALL display the status "Salvando" on the Capturas page. `[CAP-09]`
3. WHEN a snapshot is persisted successfully THEN the system SHALL display the status "Salvo" and synchronize the global hotkey registration. `[CAP-10]`
4. IF persisting a snapshot fails THEN the system SHALL retain the edited values on screen, display the status "Erro ao salvar", and offer a retry action. `[CAP-11]`
5. IF multiple edits occur before an earlier save completes THEN the system SHALL persist the newest complete snapshot after the earlier operation settles. `[CAP-12]`
6. IF the global hotkey conflicts with the panic key or an active macro THEN the system SHALL reject that snapshot and display the existing conflict message without discarding the edited values. `[CAP-13]`
7. WHEN the user requests a detection test with unsaved changes THEN the system SHALL persist the newest snapshot successfully before starting the test. `[CAP-14]`

**Independent Test**: Alterar rapidamente nome, tecla e tolerância; observar um único estado final salvo, recarregar a tela e conferir os mesmos valores.

---

### P1: Migrar perfis sem perder Pokémon ⭐ MVP

**User Story**: Como usuário atual, quero receber a nova tela com meus Pokémon existentes para não refazer recortes e configurações após atualizar o aplicativo.

**Why P1**: A mudança substitui o formato persistido existente e não pode apagar trabalho do usuário.

**Acceptance Criteria**:

1. WHEN no global capture configuration exists and legacy profiles exist THEN the system SHALL create the global configuration from the first active profile in alphabetical order, or the first profile in alphabetical order when none is active. `[CAP-15]`
2. WHEN legacy profiles are migrated THEN the system SHALL include every template from every legacy profile in the global Pokémon list. `[CAP-16]`
3. IF migrated templates share an ID THEN the system SHALL assign new IDs only to the later duplicates and SHALL preserve their names, images, tolerances, and active states. `[CAP-17]`
4. WHEN migration completes THEN the system SHALL preserve the legacy profile files and SHALL use only the global configuration on later launches. `[CAP-18]`
5. WHEN neither a global configuration nor legacy profiles exist THEN the system SHALL create one inactive default configuration with an empty Pokémon list. `[CAP-19]`
6. IF a legacy profile file is unreadable THEN the system SHALL skip that file, continue migrating readable profiles, and record the skipped filename in the application log. `[CAP-20]`

**Independent Test**: Iniciar com dois perfis contendo Pokémon diferentes, incluindo IDs repetidos, e conferir uma única configuração com todos os itens após reiniciar novamente.

---

### P2: Operar e diagnosticar pela mesma página

**User Story**: Como usuário, quero ativar, executar, parar e testar a captura na própria página para validar a configuração no mesmo contexto em que a editei.

**Why P2**: Preserva as operações atuais e melhora a continuidade do fluxo, mas depende da configuração global estar pronta.

**Acceptance Criteria**:

1. WHEN the user changes "Capturas ativas" THEN the system SHALL autosave the new state and register or unregister the global hotkey after a successful save. `[CAP-21]`
2. WHEN the user selects "Executar agora" THEN the system SHALL run the global configuration regardless of the hotkey-active toggle. `[CAP-22]`
3. WHILE capture execution is scanning or acting, the system SHALL replace "Executar agora" with a stop action and SHALL display the current execution state. `[CAP-23]`
4. WHEN a run finishes THEN the system SHALL display the existing last-run summary for the global configuration. `[CAP-24]`
5. WHEN the user selects "Testar detecção" THEN the system SHALL display detections using the latest successfully persisted global configuration. `[CAP-25]`
6. IF no enabled Pokémon has a reference image THEN the system SHALL disable "Testar detecção" and SHALL keep "Executar agora" reporting the existing no-templates result. `[CAP-26]`

**Independent Test**: Ativar a captura, executar manualmente, parar uma execução em andamento e abrir o teste de detecção sem sair da página.

---

## Edge Cases

- IF all Pokémon are disabled THEN the system SHALL preserve them and SHALL skip them during detection. `[CAP-27]`
- IF a numeric field receives a value outside its current supported bounds THEN the system SHALL clamp it to the same bounds used by the existing editor. `[CAP-28]`
- IF the user leaves the page during a pending save THEN the system SHALL attempt to flush the newest snapshot before the Capturas page unmounts. `[CAP-29]`
- IF the application closes before an autosave succeeds THEN the system SHALL load the last successfully persisted snapshot on the next launch. `[CAP-30]`

---

## Implicit-Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | CAP-28 preserves the existing numeric limits; hotkey conflicts are covered by CAP-13. |
| Failure / partial-failure states | CAP-11 retains the draft and exposes retry; snapshots are persisted as complete units. |
| Idempotency / retry / duplicate handling | CAP-12 defines latest-write ordering; CAP-17 and CAP-18 make migration repeat-safe. |
| Auth boundaries & rate limits | N/A because this is a local desktop feature with no authenticated or rate-limited boundary. |
| Concurrency / ordering | CAP-12 prevents an older save from overwriting a newer edit. |
| Data lifecycle / expiry | CAP-18 retains legacy files as recovery data; no expiry applies to local configuration. |
| Observability | CAP-20 requires migration failures to identify the skipped file in application logs. |
| External-dependency failure | N/A because this flow does not call an external service. |
| State-transition integrity | CAP-09 through CAP-14 define dirty, saving, saved, error, retry, and test-before-save behavior. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAP-01 | P1: Página única | Tasks | In Tasks |
| CAP-02 | P1: Página única | Tasks | In Tasks |
| CAP-03 | P1: Página única | Tasks | In Tasks |
| CAP-04 | P1: Página única | Tasks | In Tasks |
| CAP-05 | P1: Página única | Tasks | In Tasks |
| CAP-06 | P1: Página única | Tasks | In Tasks |
| CAP-07 | P1: Página única | Tasks | In Tasks |
| CAP-08 | P1: Autosave | Tasks | In Tasks |
| CAP-09 | P1: Autosave | Tasks | In Tasks |
| CAP-10 | P1: Autosave | Tasks | In Tasks |
| CAP-11 | P1: Autosave | Tasks | In Tasks |
| CAP-12 | P1: Autosave | Tasks | In Tasks |
| CAP-13 | P1: Autosave | Tasks | In Tasks |
| CAP-14 | P1: Autosave | Tasks | In Tasks |
| CAP-15 | P1: Migração | Tasks | In Tasks |
| CAP-16 | P1: Migração | Tasks | In Tasks |
| CAP-17 | P1: Migração | Tasks | In Tasks |
| CAP-18 | P1: Migração | Tasks | In Tasks |
| CAP-19 | P1: Migração | Tasks | In Tasks |
| CAP-20 | P1: Migração | Tasks | In Tasks |
| CAP-21 | P2: Operação | Tasks | In Tasks |
| CAP-22 | P2: Operação | Tasks | In Tasks |
| CAP-23 | P2: Operação | Tasks | In Tasks |
| CAP-24 | P2: Operação | Tasks | In Tasks |
| CAP-25 | P2: Operação | Tasks | In Tasks |
| CAP-26 | P2: Operação | Tasks | In Tasks |
| CAP-27 | Edge cases | Tasks | In Tasks |
| CAP-28 | Edge cases | Tasks | In Tasks |
| CAP-29 | Edge cases | Tasks | In Tasks |
| CAP-30 | Edge cases | Tasks | In Tasks |

**Coverage:** 30 total, 30 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] O usuário adiciona um Pokémon e define as duas teclas sem abrir um perfil, sheet ou dialog de edição.
- [ ] A página restaura o último snapshot salvo após recarregar o renderer ou reiniciar o aplicativo.
- [ ] A migração reúne 100% dos templates legíveis e não remove os arquivos legados.
- [ ] O instalador atualizado permite executar e testar a configuração global com o mesmo motor de captura atual.
