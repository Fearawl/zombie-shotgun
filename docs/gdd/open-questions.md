# Open Questions

## Gameplay
- When a wave rolls the same weapon parameter multiple times, should that weapon become strictly dominant over all previous weapon rolls, or only if its total score is highest?
- When the same non-weapon parameter repeats, should adjective tier advance strictly by stack count `1 -> 2 -> X`, while the numeric bonus always sums linearly?

## Targeting
- How should enemy ranged targeting behave?
  Current proposal: direct aim at hero center with no leading.
- How much grenade spread is acceptable for enemies?
  Current proposal: configurable random offset radius.

## Hero Level-Up Cards
- Can duplicate cards appear in the same level-up choice?
  Current proposal: no duplicates within the same offer.

## Wave Presentation
- Do we want the full generated wave title shown only at wave start, or also pinned near the wave counter?
- Should the game show the raw parameter list in dev mode for debugging wave generation?

## Loot
- Should medkits overheal be allowed?
  Current proposal: no, clamp to max HP.
- Should medkits and XP stars share the same 20 second lifetime and 5 second blink rule, or should medkits live longer?

## Art Direction
- Should shape overrides replace the base shape entirely, or combine with subtle silhouette modifiers?
  Current proposal: replace the base silhouette for readability.
