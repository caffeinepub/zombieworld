import type { EnvObject } from "./gameStore";

// Simple seeded random
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateWorld(): EnvObject[] {
  const rng = seededRandom(42);
  const objects: EnvObject[] = [];
  const WORLD_HALF = 90;

  const occupied: Array<[number, number, number, number]> = []; // x, z, hw, hd

  function tryPlace(x: number, z: number, hw: number, hd: number): boolean {
    // Keep clear zone around origin (player spawn)
    if (Math.abs(x) < 8 && Math.abs(z) < 8) return false;
    // Check bounds
    if (x - hw < -WORLD_HALF || x + hw > WORLD_HALF) return false;
    if (z - hd < -WORLD_HALF || z + hd > WORLD_HALF) return false;
    // Check overlap
    for (const [ox, oz, ohw, ohd] of occupied) {
      if (Math.abs(x - ox) < hw + ohw + 1 && Math.abs(z - oz) < hd + ohd + 1) {
        return false;
      }
    }
    occupied.push([x, z, hw, hd]);
    return true;
  }

  // Buildings (~20)
  for (let i = 0; i < 30; i++) {
    const x = (rng() - 0.5) * WORLD_HALF * 2;
    const z = (rng() - 0.5) * WORLD_HALF * 2;
    const w = 4 + rng() * 6;
    const h = 5 + rng() * 12;
    const d = 4 + rng() * 6;
    if (tryPlace(x, z, w / 2, d / 2)) {
      objects.push({
        id: `building_${i}`,
        type: "building",
        position: [x, h / 2, z],
        size: [w, h, d],
        rotation: rng() * Math.PI * 2,
      });
    }
  }

  // Dead trees (~30)
  for (let i = 0; i < 40; i++) {
    const x = (rng() - 0.5) * WORLD_HALF * 2;
    const z = (rng() - 0.5) * WORLD_HALF * 2;
    const h = 4 + rng() * 6;
    const r = 0.2 + rng() * 0.3;
    if (tryPlace(x, z, r + 0.5, r + 0.5)) {
      objects.push({
        id: `tree_${i}`,
        type: "tree",
        position: [x, h / 2, z],
        size: [r * 2, h, r * 2],
      });
    }
  }

  // Rocks (~15)
  for (let i = 0; i < 20; i++) {
    const x = (rng() - 0.5) * WORLD_HALF * 2;
    const z = (rng() - 0.5) * WORLD_HALF * 2;
    const s = 1 + rng() * 2.5;
    if (tryPlace(x, z, s, s)) {
      objects.push({
        id: `rock_${i}`,
        type: "rock",
        position: [x, s / 2, z],
        size: [s, s, s],
      });
    }
  }

  // Barricades
  for (let i = 0; i < 12; i++) {
    const x = (rng() - 0.5) * WORLD_HALF * 2;
    const z = (rng() - 0.5) * WORLD_HALF * 2;
    if (tryPlace(x, z, 1.5, 0.5)) {
      objects.push({
        id: `barricade_${i}`,
        type: "barricade",
        position: [x, 0.5, z],
        size: [3, 1, 0.4],
        rotation: rng() * Math.PI,
      });
    }
  }

  return objects;
}

export function spawnZombiePosition(
  playerX: number,
  playerZ: number,
  seed: number,
): [number, number] {
  const rng = seededRandom(seed);
  const angle = rng() * Math.PI * 2;
  const dist = 30 + rng() * 30;
  return [playerX + Math.cos(angle) * dist, playerZ + Math.sin(angle) * dist];
}
