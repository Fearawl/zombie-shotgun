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
- Confirmed `X = stacks - 2` for third-tier naming.
- Confirmed dominant weapon is defined by total bonus count including the base package.
- Confirmed mixed weapon types run in parallel, while repeated weapon rolls stack into one profile.
- Confirmed no duplicate upgrade cards inside one level-up offer.
- Added the first implementation slice of the new architecture: core session, event bus, hero/enemy/pickup data models, and wave/spawn/weapon/loot/progression/presentation systems.
- Replaced the old in-progress combat scene in `dev` with a preproduction architecture dashboard backed by the new systems.
- Replaced the dashboard with the first playable vertical slice of the new architecture.
- Added runtime wave flow, off-screen enemy spawning, near-hero boss summoning and shotgun combat on top of the new systems.
- Added enemy shape textures from parameter dominance plus medkit and XP star pickup textures in `BootScene`.
- Added pickup lifetime handling, blinking cleanup, boss XP burst scattering and hero XP collection in the new `GameScene`.
- Added level-up pause overlay with 3 unique upgrade cards wired into the shared parameter pool.
- Added `CombatSystem` and moved shotgun hit resolution plus contact damage out of `GameScene`.
- Added dedicated runtime actors: `EnemyActor` and `PickupActor`.
- Extended `SpawnSystem` to own off-screen and near-hero spawn point generation.
- Removed the old `Zombie` actor from the active gameplay path. It now remains only as legacy reference code.
- Added `HeroBuildSystem` for hero stat/weapon recomposition after upgrades.
- Added `PickupSystem` for pickup spawn, lifetime updates, collection effects and boss star burst handling.
- Reduced `GameScene` further to wiring, UI and wave orchestration responsibilities.
