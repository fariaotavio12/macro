# Project State

## Decisions

### AD-001: Capturas usam uma configuração global

- **Status:** active
- **Date:** 2026-08-12
- **Decision:** O domínio de Capturas terá uma única `CaptureConfig`, sem lista ou identidade de perfis.
- **Rationale:** O produto não precisa alternar estratégias de captura. Remover o conceito também dos contratos evita estados, atalhos e arquivos órfãos escondidos pela interface.
- **Supersedes:** N/A
- **Applies to:** `shared/capture-types.ts`, armazenamento, IPC/preload, hotkeys, runner, dock e `src/features/captures`.

## Handoff

- **Feature:** `capturas-unificadas`
- **Phase:** Execute
- **Status:** In progress
- **Next:** Executar os lotes T1–T6 e T7–T14, depois rodar o Verifier independente.
- **Workspace note:** Existem alterações locais do usuário em arquivos afetados, incluindo `shared/capture-types.ts`, `electron/ipc.ts` e `electron/preload.ts`; a implementação deve reconciliá-las sem sobrescrever trabalho existente.
