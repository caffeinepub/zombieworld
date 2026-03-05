# ZombieWorld

## Current State
- 3D open world zombie survival game using React Three Fiber
- Daytime sky, green grass terrain, blocky buildings/trees/rocks
- Auto-rotating third-person camera with touch drag override
- Simple block/capsule player and zombie meshes
- Wave system, leaderboard, HUD, mobile controls
- Flat ground plane with solid color materials

## Requested Changes (Diff)

### Add
- Forced landscape orientation via CSS/meta for mobile screens
- A CSS/HTML rotate-screen prompt for portrait users on mobile
- Mouse drag (left-click drag) for desktop camera rotation
- Significantly more realistic visuals:
  - Terrain with subtle height variation (bumpy ground using displacement or vertex noise)
  - Richer materials: roughness maps via vertex color variation, more color variation on ground
  - Multiple ground color patches (dirt paths, grass variation)
  - Improved tree trunks (thicker, more tapered) and dense foliage clusters
  - Improved buildings with window details and rooftop accents
  - Volumetric-style fog that feels atmospheric
  - Better sun angle and shadow softness
  - Dust particle effect near player movement
  - Screen-space effects: subtle color grading, vignette, improved scanline removal in favor of a subtle film grain
  - More detailed player model: visible boots, belt accent
  - Blood splatter effect when zombie is hit (red particle burst)

### Modify
- Camera: add mouse drag support (mousemove + mousedown) alongside existing touch; increase camera distance for wider FOV feel
- World: richer terrain mesh with vertex color variation; improved lighting intensity and placement
- Game.tsx: wrap canvas in landscape-enforcing container; add portrait warning overlay

### Remove
- Old scanlines overlay (replace with more subtle film grain or remove entirely for cleaner look)

## Implementation Plan
1. Add portrait-mode warning overlay in Game.tsx using CSS media query / matchMedia
2. Add mouse drag camera rotation in Camera.tsx (mousedown/mousemove/mouseup listeners)
3. Upgrade World.tsx terrain: replace flat plane with a grid mesh using vertex displacement for subtle hills; add vertex color variation for realism
4. Improve building meshes: add window cutout details, roof edge accent, color variation
5. Improve tree meshes: multi-layer foliage cones, thicker trunks
6. Enhance lighting: stronger sun, better ambient, add a secondary fill light
7. Remove scanlines div, add optional subtle vignette via CSS
8. Add mouse-look to Camera.tsx for desktop
