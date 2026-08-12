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
- **Status:** T1–T14 complete
- **Next:** Rodar o Verifier independente, registrar `validation.md` e publicar somente depois do gate final.
- **Workspace note:** Os diffs locais preexistentes em `.claude/**` continuam intocados e fora dos commits da feature.
