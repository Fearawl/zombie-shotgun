# Zombie Shotgun GDD

## Status
Preproduction. The current playable prototype exists only as a temporary sandbox. The target architecture and balance model below are the source of truth for upcoming refactors.

## Project Pillars
- Top-down survival action with escalating procedural enemy waves.
- Clear readability: enemy stats must be visible through shape, color, outline, VFX and naming.
- Wave identity: each wave is defined by a generated adjective chain based on rolled enemy parameters.
- Systemic growth: the same parameter framework powers enemies, bosses and hero upgrades.

## Core Loop
1. A wave starts.
2. Enemies spawn mostly off-screen and move toward the hero.
3. Some enemies rise from the ground. Bosses always rise from the ground near the hero.
4. The hero survives, kills enemies, gains XP and levels up.
5. A level-up pauses the game and offers 3 upgrade cards.
6. After 30 seconds the current wave ends with a boss summon.
7. The next wave starts immediately with faster spawn pacing and more random parameters.

## Wave Rules
- Wave duration: 30 seconds.
- Each new wave increases enemy spawn rate by 10%.
- Each wave ends with a boss.
- Wave number determines how many random bonus parameters are rolled for regular enemies.
- Enemy generation is recreated from scratch each wave. Enemies do not inherit bonuses from previous waves.
- Bosses do not reuse the exact wave roll. Each boss gets its own separate random parameter set.
- Boss parameters use an extra x5 multiplier on top of the boss's rolled values.

## Unit Base Presentation
- Base color: green.
- Base shape: circle.
- Base outline: green.
- Base weapon VFX color: yellow.
- Every unit has an HP bar above it with the current health number inside.

## Base Parameters
- Health: 5 `(хилые)`.
- Move speed: 5 `(медленные)`.
- Attack speed: once every 2 seconds `(неуклюжие)`.
- Weapon "Melee": 1 damage `(безоружные)`, radius 10, VFX is a half-circle swing.

## Additional Parameters
- Vitality: health +5 `(хилые > живучие > бессмертные X)`, base color becomes browner.
- Speed: move speed +5 `(медленные > шустрые > скоростные X)`.
- Armor: incoming damage -1 `(толстокожие > бронявые > непробиваемые X)`, outline shifts toward cyan.
- Reload: cooldown -0.2s `(неуклюжие > ловкие > юркие X)`, weapon VFX color shifts toward white.
- Weapon "Melee": damage +3 `(безоружные > бьющие > накаутирующие X)`. If dominant, unit shape stays circle.
- Weapon "Pistol": single bullet toward target, damage +5, radius +50, projectile speed +10 `(метающие > стреляющие > расстреливающие X)`. If dominant, unit shape becomes oval.
- Weapon "Shotgun": 8 bullets in a cone, each pellet deals separate damage, damage +2, radius +20, projectile speed +10 `(дробьющие > картечьные > пушечные X)`. If dominant, unit shape becomes triangle.
- Weapon "Grenade": gray projectile toward target with spread, damage +10, grenade count in volley +1, radius +20 `(гранатные > миномётные > ядерные X)`. If dominant, unit shape becomes square.

## Drop Rules
- 2% chance to drop a medkit that heals 25% of hero max HP.
- 10% chance to drop a small star that grants 10 XP.
- Bosses always drop a number of stars equal to the current wave.
- Boss stars must spread around the death point with a small area offset.

## Hero Progression
- Hero levels by collecting XP.
- XP thresholds: 30, then x2 per level: 30 > 60 > 120 ...
- On level-up the game pauses.
- Show 3 cards with parameter names and short descriptions.
- The player picks 1 card, which upgrades the hero.
- For now, hero upgrades use the same parameter pool as enemy generation.

## Confirmed Preproduction Decisions
- Wave 1 = base enemy package + 1 rolled bonus parameter.
- Wave 10 = base enemy package + 10 rolled bonus parameters.
- Bosses are generated separately from normal wave enemies.
- Pickup lifetime is limited to 20 seconds.
- Pickups blink during the last 5 seconds before disappearing.
- The current prototype can be treated as a reference only. The next implementation phase is effectively a new project built on the approved architecture.

## Current Target Deliverables
- Stable architecture for waves, parameter generation, combat and upgrades.
- Centralized config file for all tunables.
- Up-to-date documentation in `docs/gdd`.
