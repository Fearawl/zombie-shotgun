# GDD Changelog

## 2026-03-21
- Created initial GDD folder and baseline preproduction documentation.
- Documented the target wave system, parameter generation rules, drop model and level-up flow.
- Documented the intended architecture split between scene shell, systems, entities and config.
- Added an open-questions file to keep unresolved design decisions explicit.
- Duplicated the current prototype state from `codex/dev` into `main`.
- Confirmed that waves rebuild enemies from scratch and roll `waveNumber` bonus parameters.
- Confirmed that bosses roll their own separate parameter set.
- Confirmed that hero upgrades currently share the same parameter pool as enemies.
- Confirmed 20 second pickup lifetime with 5 second blink window.
