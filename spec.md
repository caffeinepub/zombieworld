# ZombieWorld

## Current State
- Full 3D open world zombie survival game with React Three Fiber
- Backend tracks `totalPlayersJoined` (lifetime count) and displays it on the start screen
- HUD shows health, weapon, wave, kills, score, day/night
- No live "currently playing" counter exists

## Requested Changes (Diff)

### Add
- Backend: `recordActivePlayer()` function increments active player count
- Backend: `recordPlayerLeave()` function decrements active player count
- Backend: `getActivePlayers()` query returns current active player count
- Frontend HUD: Live "PLAYING NOW" counter displayed during gameplay, polling every 15 seconds
- Frontend: Call `recordActivePlayer` when game starts, `recordPlayerLeave` when game ends (game over / page unload)

### Modify
- `useQueries.ts`: Add `useActivePlayers` hook (polls every 15s) and `useRecordActivePlayer` / `useRecordPlayerLeave` mutations
- `HUD.tsx`: Add a small live player counter badge in the corner
- `Game.tsx` or `StartScreen.tsx`: Wire up active player tracking on game start/end

### Remove
- Nothing

## Implementation Plan
1. Update `main.mo` to add `activePlayers` var, `recordActivePlayer`, `recordPlayerLeave`, `getActivePlayers` functions
2. Add `useActivePlayers`, `useRecordActivePlayer`, `useRecordPlayerLeave` hooks to `useQueries.ts`
3. Add "PLAYING NOW" badge to `HUD.tsx` using `useActivePlayers`
4. Wire `recordActivePlayer` on game start and `recordPlayerLeave` on game over / window unload in `Game.tsx` or relevant component
