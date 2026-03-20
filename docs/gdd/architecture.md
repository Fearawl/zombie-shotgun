# Target Architecture

## Module Layout
- `src/config/gameConfig.js`
  Central source of truth for balance, progression, spawn rules, wave rules, parameter definitions, weapon definitions and UI limits.
- `src/core/GameSession.js`
  High-level runtime state for wave number, timers, pause state, hero progression and seeded generation state.
- `src/core/EventBus.js`
  Lightweight event emitter for decoupled systems.
- `src/scenes/BootScene.js`
  Asset creation/loading only.
- `src/scenes/StartScene.js`
  Title, version, entry point.
- `src/scenes/GameScene.js`
  Scene composition only. Delegates behavior to systems and factories.
- `src/scenes/ResultScene.js`
  Post-run summary.
- `src/entities/Hero.js`
  Hero stats, current weapons, XP, level and upgrade application.
- `src/entities/EnemyUnit.js`
  Generic enemy runtime entity. No hardcoded zombie-only logic beyond art hooks.
- `src/entities/EnemyActor.js`
  Phaser runtime actor for enemies: movement, HP bar, underground emerge animation, contact attack cooldown and death callback.
- `src/entities/Pickup.js`
  Generic pickup entity with subtype handlers.
- `src/entities/PickupActor.js`
  Phaser runtime actor for pickup presentation, floating motion, blink window and cleanup.
- `src/systems/WaveSystem.js`
  Owns wave number, wave timer, boss summon timing, wave title generation and 10% spawn acceleration per wave.
- `src/systems/SpawnSystem.js`
  Spawns off-screen units, underground summons and boss spawn choreography.
- `src/systems/EnemyFactory.js`
  Builds enemy specs from base stats + `waveNumber` rolled bonus parameters. Also builds boss specs from a separate boss roll + boss multiplier.
- `src/systems/CombatSystem.js`
  Hit resolution, outgoing/incoming damage, armor, cooldowns, projectile ownership and friendly-fire rules.
- `src/systems/HeroBuildSystem.js`
  Rebuilds hero stats and weapon profiles after level-up choices.
- `src/systems/WeaponSystem.js`
  Shared logic for melee, pistol, shotgun and grenade behaviors for both hero and enemies.
- `src/systems/LootSystem.js`
  Medkits, XP stars, boss star burst, pickup lifetime rules.
- `src/systems/PickupSystem.js`
  Runtime pickup spawn, floating/blinking presentation updates and pickup application rules.
- `src/systems/ProgressionSystem.js`
  XP thresholds, level-up pause, upgrade card generation and application.
- `src/systems/PresentationSystem.js`
  HP bars, numeric health text, parameter-driven shape/color/outline/VFX styling, wave banner text.
- `src/systems/UiSystem.js`
  HUD composition, pause menu, level-up overlay cards and related UI interactions.

## Data Flow
1. `WaveSystem` starts a wave and asks `EnemyFactory` for the current wave descriptor.
2. `EnemyFactory` rolls parameter stacks based on wave index.
3. The rolled descriptor feeds:
   - enemy stats
   - enemy visual profile
   - wave adjective title
4. `SpawnSystem` creates units from the descriptor.
5. `CombatSystem` and `WeaponSystem` process attacks and projectiles.
6. On death, `LootSystem` handles drops.
7. On XP gain, `ProgressionSystem` checks level-up and pauses the run for upgrade cards.
8. `ProgressionSystem` generates 3 unique upgrade cards from the shared parameter pool.

## Enemy Parameter Assembly
- Start from base parameters.
- Roll `waveNumber` additional parameters.
- Parameter duplicates stack numerically.
- Parameter duplicates also escalate adjective wording from tier 1 to tier 2 to tier `X`, where `X = stacks - 2`.
- Determine dominant weapon parameter for shape override by total bonus count for that weapon, including the base package.
- Rebuild the enemy package from scratch for each new wave.
- For bosses, make a separate random roll and apply extra x5 multiplier after boss parameter assembly.
- If multiple weapon types exist, they all attack in parallel on their own cooldowns.
- If the same weapon type repeats, its bonuses stack into one weapon profile.

## Wave Naming Pipeline
- Each parameter contributes one adjective fragment.
- Fragments are ordered in a stable sentence order:
  durability -> movement -> defense -> attack cadence -> weapon identity.
- Example output:
  `Wave 3. Живучие, скоростные, бронявые, ловкие, стреляющие зомби`

## Pause Modes
- Gameplay pause
- Dev console pause
- Level-up card pause
- Result scene pause

Only one pause source should own input at a time. This is why pause state should be managed through a dedicated session layer rather than ad-hoc booleans.

## Refactor Guidance
- Keep the current prototype scenes only as shell containers.
- Move new logic into systems first, then gradually replace in-scene logic.
- Avoid hardcoding per-weapon or per-enemy logic directly in `GameScene`.
- Build the next phase as a clean replacement path rather than incremental patching over prototype combat code.

## Current Implementation Slice
- `GameScene` is no longer a dashboard. It now hosts the first playable runtime slice driven by the new systems.
- The following modules are already implemented and actively used by the scene:
  `GameSession`, `EventBus`, `Hero`, `EnemyUnit`, `EnemyActor`, `Pickup`, `PickupActor`, `EnemyFactory`, `WaveSystem`, `SpawnSystem`, `CombatSystem`, `HeroBuildSystem`, `WeaponSystem`, `LootSystem`, `PickupSystem`, `ProgressionSystem`, `PresentationSystem`, `UiSystem`.
- Runtime features already connected:
  wave timer, persistent wave title HUD, regular enemy spawning, boss spawning, held-fire hero combat, parallel hero sidearms, enemy death drops, XP collection, level-up pause cards, pause menu and generated enemy weapon execution.
- The next phase is to split remaining in-scene runtime logic into dedicated systems:
  broader combat/presentation tuning, hero grenade runtime and any remaining pause-state edge cases.
