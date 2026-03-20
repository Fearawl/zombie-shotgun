# Open Questions

## Gameplay
- Should the hero also use the same parameter pool as enemies for upgrades, or should hero upgrades be a curated subset?
- Does the wave multiplier apply additively or multiplicatively to every base parameter? Current proposal: multiplicatively.
- When a wave rolls the same weapon parameter multiple times, should that weapon become strictly dominant over all previous weapon rolls, or only if its total score is highest?
- Should bosses inherit the exact same random parameter set as the wave, then multiply it by x5, or should they receive extra boss-only rolls on top?

## Targeting
- How should enemy ranged targeting behave?
  Current proposal: direct aim at hero center with no leading.
- How much grenade spread is acceptable for enemies?
  Current proposal: configurable random offset radius.

## Hero Level-Up Cards
- Should the 3 upgrade cards be fully random from the global parameter pool, or should at least one always improve offense and one always improve survival?
- Can duplicate cards appear in the same level-up choice?
  Current proposal: no duplicates within the same offer.

## Wave Presentation
- Do we want the full generated wave title shown only at wave start, or also pinned near the wave counter?
- Should the game show the raw parameter list in dev mode for debugging wave generation?

## Loot
- Should medkits overheal be allowed?
  Current proposal: no, clamp to max HP.
- Should XP stars expire, or remain indefinitely until collected?
  Current proposal: linger for a limited time to protect performance.

## Art Direction
- Should shape overrides replace the base shape entirely, or combine with subtle silhouette modifiers?
  Current proposal: replace the base silhouette for readability.
