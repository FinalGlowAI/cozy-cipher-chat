# Add Two New Memory Games

Add **Chimp Test** and **Path Tracer** to the Daily Challenge Games selector, following the exact same pattern as `ColorSequenceGame`, `MemoryGame`, `FlashNumberGame`, and `SymbolMatchGame`.

## Game 1: Chimp Test

Inspired by the famous chimpanzee memory test.

- Numbers `1..N` appear at random positions on a grid
- After a brief reveal (or on first tap), the numbers turn into blank tiles
- Player must tap them in ascending order (1, 2, 3, …)
- One mistake → round fails
- 5 rounds per level, 7 levels total

**Level progression:**
| Level | Numbers | Reveal time |
|-------|---------|-------------|
| 1 | 4 | 3.0s |
| 2 | 5 | 2.5s |
| 3 | 6 | 2.0s |
| 4 | 7 | 1.5s |
| 5 | 8 | 1.2s |
| 6 | 9 | 1.0s |
| 7 | 10 | 0.8s |

## Game 2: Path Tracer

A glowing path lights up cell-by-cell on a grid; player retraces it by tapping cells in the same order.

- Grid of cells (e.g., 4x4 to 6x6 across levels)
- Path cells light up sequentially with brand-purple glow
- Player taps cells in the same order
- Wrong tap → round fails
- 5 rounds per level, 7 levels total

**Level progression:**
| Level | Grid | Path length | Step speed |
|-------|------|-------------|------------|
| 1 | 4x4 | 4 | 600ms |
| 2 | 4x4 | 5 | 550ms |
| 3 | 5x5 | 6 | 500ms |
| 4 | 5x5 | 7 | 450ms |
| 5 | 5x5 | 8 | 400ms |
| 6 | 6x6 | 9 | 350ms |
| 7 | 6x6 | 10 | 300ms |

## Shared Credit / Progression Logic

Both games reuse the existing pattern from `ColorSequenceGame.tsx`:
- `useCredits()` hook with `earnCredits(level, source)` on level completion
- `LEVEL_CREDITS` rewards (5/10/15/20/25/30/50)
- `getSafeStorage` for level progress + 24h reset timer (per-game key)
- `celebrate()` confetti on round/level wins
- Same Dialog + level-card UI shell, same brand purple styling
- Sources: `"chimp_test"` and `"path_tracer"` for analytics/audit

## Files

**Create:**
- `src/components/ChimpTestGame.tsx`
- `src/components/PathTracerGame.tsx`

**Edit:**
- `src/components/GameSelector.tsx`
  - Extend `SelectedGame` union with `"chimp-test" | "path-tracer"`
  - Import new components + 2 new lucide icons (e.g., `Eye` for Chimp, `Footprints` or `Route` for Path Tracer)
  - Add 2 render branches in the game switcher
  - Add 2 new game cards in the selector list

## Out of Scope

- No new DB tables or RPCs (existing `earn_credits` RPC + `LEVEL_CREDITS` cover both)
- No changes to credit costs, decay, or daily top-up rules
- No changes to existing games

