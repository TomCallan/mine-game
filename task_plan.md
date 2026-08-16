# Task Plan: Miner's Haven Factory - Master Roadmap, Economy Balancing & Fun Overhaul

## Goal
Design and implement the comprehensive game roadmap, 4-tier economy curve, progression milestones, status-effect synergies, new endgame machines, and gameplay balancing to transform the game into a deeply fun, addictive Miner's Haven-style factory experience.

## Current Phase
Phase 1: Game Economy, Progression & Synergy Design

## Phases

### Phase 1: Game Economy, Progression & Synergy Design <!-- id: 0 -->
- [x] Analyze current machine stats, ore values, crate drop rates, and progression milestones.
- [x] Map out 4 distinct progression tiers (Tier 1: Starter Industrial, Tier 2: Chemical & Thermal, Tier 3: Nuclear & Sub-Atomic, Tier 4: Cosmic Singularity & Rebirth).
- [x] Design status synergy matrix (Flaming, Wet/Quenched, Radioactive, Sparkling, Crystalline, Supernova Fusion).
- [x] Document balance curve in `task_plan.md` and `findings.md`.
- *Status:* complete

### Phase 2: Implement Complete Data & Balanced Definitions <!-- id: 1 -->
- [x] Update `data.json` with balanced price curves, progression tiers, and full tags/attributes.
- [x] Add new progression machines:
  - *Tier 2*: `cryoQuencher` (wet + extinguish upgrader), `plasmaArc` (side-mounted flat add).
  - *Tier 3*: `neutronCollimator` (side-mounted nuclear beam), `superDiamondSynthesizer`.
  - *Tier 4*: `celestialRefinery` (mythic multi-pass upgrader), `hypernovaBlastCore`.
- [x] Configure balanced crate costs ($250, $1K, $5K, 1 Key) and curated reward tables with guaranteed pity counters.
- *Status:* complete

### Phase 3: Core Simulation & Synergy Mechanics Overhaul <!-- id: 2 -->
- [x] Update `game.js` simulation loop to execute all synergy interactions (Prismatic Gem Resonance, Supernova Multi-Status Fusion, Radiation Cleansing boosts).
- [x] Enhance side-mounted beam upgraders to support all side-beam emitter machine variants.
- [x] Add floating visual badges for status transformations (`🔥 FLAMING`, `💎 CRYSTALLINE`, `✨ SPARKLING`, `⚡ CHARGED`).
- *Status:* complete

### Phase 4: UI, Shop Tiers, Milestone HUD & Polish <!-- id: 3 -->
- [x] Update UI hotbar and inventory category tabs with clear tier tags (Tier 1-4, Relic, Exotic, Mythic).
- [x] Add Progression / Milestone tracker in UI showing current Life tier, earnings target, and next unlock.
- [x] Verify save slots, crates roulette, prestige rebirth reset, and building mechanics.
- *Status:* complete

### Phase 5: Verification & Playtesting <!-- id: 4 -->
- [x] Validate all JavaScript syntax (`node -c game.js; node -c ui.js; node -c data.js; node -c server.js`).
- [x] Playtest loop paths, side-mounted beams, multi-tier machines, and prestige triggers.
- [x] Commit and push changes to git.
- *Status:* complete

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None | 0 | Clean design and data synchronization |
