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
- `src/entities/Pickup.js`
  Generic pickup entity with subtype handlers.
- `src/systems/WaveSystem.js`
  Owns wave number, wave timer, boss summon timing, wave title generation and 10% spawn acceleration per wave.
- `src/systems/SpawnSystem.js`
  Spawns off-screen units, underground summons and boss spawn choreography.
- `src/systems/EnemyFactory.js`
  Builds enemy specs from base stats + wave multiplier + random parameters + boss multiplier.
- `src/systems/CombatSystem.js`
  Hit resolution, outgoing/incoming damage, armor, cooldowns, projectile ownership and friendly-fire rules.
- `src/systems/WeaponSystem.js`
  Shared logic for melee, pistol, shotgun and grenade behaviors for both hero and enemies.
- `src/systems/LootSystem.js`
  Medkits, XP stars, boss star burst, pickup lifetime rules.
- `src/systems/ProgressionSystem.js`
  XP thresholds, level-up pause, upgrade card generation and application.
- `src/systems/PresentationSystem.js`
  HP bars, numeric health text, parameter-driven shape/color/outline/VFX styling, wave banner text.

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

## Enemy Parameter Assembly
- Start from base parameters.
- Apply wave multiplier.
- Roll `waveNumber` additional parameters.
- Parameter duplicates stack numerically.
- Parameter duplicates also escalate adjective wording from tier 1 to tier 2 to tier `X`.
- Determine dominant weapon parameter for shape override.
- For bosses apply extra x5 multiplier after the wave multiplier and parameter stacking.

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
