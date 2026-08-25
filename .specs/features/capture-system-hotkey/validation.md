# Validation: PASS — Capture System Hotkey

**Verifier:** standalone validation (no additional agent available)  
**Date:** 2026-08-24  
**Feature:** `capture-system-hotkey`

## Requirement Evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| HOTKEY-01 | `hotkeys.ts:114` synchronizes the active capture configuration through the Windows shortcut registry after `main.ts:107` runs post-ready. | Pass |
| HOTKEY-02 | `hotkeys.ts:114-116` invokes the current capture configuration only through the registered callback, with existing repeat debounce. Unit test covers the callback dispatch. | Pass |
| HOTKEY-03 | `capture-system-hotkey.ts:15-28` releases an old accelerator before changing or disabling it. Unit test covers change and disable. | Pass |
| HOTKEY-04 | `capture-system-hotkey.ts:30-36` returns false for rejected or thrown registrations; `hotkeys.ts:82-84` retains the uIOhook fallback and `hotkeys.ts:117-119` logs it. Unit tests cover both rejection paths. | Pass |
| HOTKEY-05 | `main.ts:111-113` releases the registered accelerator on application shutdown. | Pass |

## Commands Run

```text
.\\node_modules\\.bin\\vitest.cmd run electron\\engine\\capture-system-hotkey.test.ts --pool=forks --reporter=verbose --testTimeout=5000
# 4 passed

.\\node_modules\\.bin\\eslint.cmd electron\\engine\\capture-system-hotkey.ts electron\\engine\\capture-system-hotkey.test.ts electron\\engine\\hotkeys.ts electron\\main.ts
# passed

.\\node_modules\\.bin\\tsc.cmd --noEmit --project tsconfig.electron.json
# passed

py -3.14 C:\\Users\\OtavioFaria\\.codex\\skills\\tlc-spec-driven\\scripts\\validate_spec.py .specs\\features\\capture-system-hotkey\\spec.md
# 0 errors, 0 warnings
```

## Discrimination Check

A clean temporary worktree was mutated so a successful OS registration returned `false` instead of retaining the accelerator. The focused suite then failed in the successful-registration and replacement/release assertions (2 failures), proving the test detects this regression. The temporary worktree was removed afterward.

## Packaging / UAT Limitation

The current working-tree `package.json` is a pre-existing modification that has no `scripts` section and no `electron-builder` build configuration. Therefore `npm run electron:build` cannot package or install this source change without restoring or replacing user-owned configuration. No package or installed application was modified.

## Verdict

**PASS (code):** implementation, static checks, focused unit tests, and specification validation pass. Packaging and live PokeAlliance UAT remain blocked by the pre-existing package configuration change.
