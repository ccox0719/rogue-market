# Phased Overhaul Roadmap

This file documents the multi-phase plan for the roguelike stock market sim. Each phase builds on the last and finishes with the game still running as expected.

## Phase Status

- [x] Phase 1 – Meta Profile & High Scores
- [x] Phase 2 – Artifacts & Meta XP Progression
- [x] Phase 3 – Era Deck, Endless Rotation & Prediction System
- [x] Phase 4 – Whale Profiles & Market Influence
- [x] Phase 5 – Bonds System
- [x] Phase 6 – Stock Lifecycle (Splits, Bankruptcies, IPOs)
- [ ] Phase 7 – Campaigns, Challenges & Run Carry

## Phase Details

### Phase 1 – Meta Profile & High Scores
- Persisted the MetaProfile (XP, best runs, prediction/ artifact unlock levels).
- Hooked persistence into load/save and added a UI summary panel.
- Recorded run stats to update high scores after each run.

### Phase 2 – Artifacts & Meta XP Progression
- Added artifacts content, run-state tracking, and applyArtifacts system.
- Implemented XP/level perks (starting cash, extra triggers, prediction bonus).
- Added artifact reward flow, UI, and dev toggles for testing.

### Phase 3 – Era Deck & Prediction System
- Introduced a shuffled era deck generator with prediction tracking.
- Allowed eras to mutate mid-run, tracked prediction accuracy, and showed next-era guesses.
- Endless mode now regenerates decks with rising volatility.

### Phase 4 – Whale Profiles & Market Influence
- Added whale profiles, influence logs, and daily updates that bias sectors/companies.
- Whale visibility unlocks with progression, and a UI panel lists known personalities.
- Developer controls let us force whale pulses, mutations, and reveals.

### Phase 5 – Bonds System
- Implemented bond templates, marketplace, and holdings/ coupons per day.
- Added era modifiers to yields/defaults and payout logging.
- Bond UI renders listings, holdings, and action log entries.

### Phase 6 – Stock Lifecycle (Splits, Bankruptcies, IPOs)
- New `lifecycleSystem` tracks split thresholds, bankruptcy timers, and IPO spawns.
- Configured era effects that tune splits/defaults/IPO frequency.
- UI now has a lifecycle log panel and dev drawer levers for splits, bankrupts, and IPOs.
- TODO: Build the Phase 7 campaign/challenge layer that uses these systems for long-term progression.

### Phase 7 - Campaigns, Challenges & Run Carry
- Added campaign/challenge definitions, meta tracking, and a carry-choice overlay that locks XP/perks into future runs.
- TODO: wire the restart flow so players can jump into the next chapter/challenge directly and see high-score leaderboards per mode.

## General Notes

* Keep architectures modular, prefer small functions, and centralize shared types.
* After each phase, document changed files and how to exercise the new features.
