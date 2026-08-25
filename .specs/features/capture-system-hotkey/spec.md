# Capture System Hotkey Specification

## Problem Statement

The capture scan works when started manually, but the configured `R` shortcut is not received while PokeAlliance has focus. The application must register the configured capture key with Windows so the scan can start while the game owns normal keyboard input.

## Goals

- [x] Start the active capture configuration from its configured hotkey while PokeAlliance is focused.
- [x] Preserve the existing uIOhook path when Windows cannot register the shortcut.
- [x] Release the Windows registration when the configuration changes or the app closes.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Injecting or modifying PokeAlliance | The fix remains an external desktop macro. |
| Changing capture detection or ball input | Manual execution already proves those behaviors work. |
| Adding capture-profile UI | The current global capture configuration remains unchanged. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Registration API | Electron `globalShortcut` | It registers a shortcut with the operating system from the main process. | Yes |
| Registration conflict | Keep the existing uIOhook listener as fallback and log the failed OS registration | Existing configurations remain usable outside clients that consume input. | Yes |
| Existing `R` setting | Register it without requiring a configuration migration | The user already configured `R`; the fix must work with that saved value. | Yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Trigger captures over the focused game ⭐ MVP

**User Story**: As a PokeAlliance player, I want my configured capture hotkey to start the scan while the game is focused so that I do not need to switch windows.

**Why P1**: Manual execution already detects the target. The missing global trigger blocks normal use in-game.

**Acceptance Criteria**:

1. WHEN an active capture configuration has a hotkey THEN the system SHALL register the same accelerator with Windows after Electron is ready. `[HOTKEY-01]`
2. WHEN Windows delivers the registered capture accelerator while PokeAlliance is focused THEN the system SHALL trigger exactly one capture run. `[HOTKEY-02]`
3. WHEN the active capture hotkey changes or Capturas is disabled THEN the system SHALL unregister the prior Windows accelerator. `[HOTKEY-03]`
4. IF Windows cannot register the configured accelerator THEN the system SHALL keep the existing uIOhook capture path active and log the registration failure. `[HOTKEY-04]`
5. WHEN the application exits THEN the system SHALL release its registered capture accelerator. `[HOTKEY-05]`

**Independent Test**: Configure `R`, focus PokeAlliance, leave one matched body visible, press `R`, and observe exactly one capture run.

---

## Edge Cases

- IF no active capture hotkey is configured THEN the system SHALL not register a Windows accelerator.
- IF the same accelerator is synchronized repeatedly THEN the system SHALL not retain duplicate Windows registrations.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| HOTKEY-01 | P1: Trigger captures | Execute | Implemented |
| HOTKEY-02 | P1: Trigger captures | Execute | Implemented |
| HOTKEY-03 | P1: Trigger captures | Execute | Implemented |
| HOTKEY-04 | P1: Trigger captures | Execute | Implemented |
| HOTKEY-05 | P1: Trigger captures | Execute | Implemented |

**Coverage:** 5 total, 5 mapped to implementation.

## Success Criteria

- [x] Pressing `R` starts Capturas while the focused PokeAlliance window owns normal keyboard input.
- [x] Switching or disabling the shortcut does not leave an old global registration behind.
