import * as THREE from "three";
import { create } from "zustand";

export type GameState =
  | "start"
  | "playing"
  | "paused"
  | "gameover"
  | "leaderboard";

export interface ZombieData {
  id: string;
  position: THREE.Vector3;
  health: number;
  state: "idle" | "chase" | "attack";
  wanderTarget: THREE.Vector3;
  lastHitTime: number;
  isDying: boolean;
  deathTime: number;
  velocity: THREE.Vector3;
}

export interface EnvObject {
  id: string;
  type: "building" | "tree" | "rock" | "barricade";
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
}

interface GameStore {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // Player
  playerHealth: number;
  setPlayerHealth: (hp: number) => void;
  playerPosition: THREE.Vector3;
  setPlayerPosition: (pos: THREE.Vector3) => void;
  playerName: string;
  setPlayerName: (name: string) => void;

  // Game progress
  score: number;
  kills: number;
  wave: number;
  addScore: (points: number) => void;
  addKill: () => void;
  nextWave: () => void;

  // Zombies
  zombies: ZombieData[];
  setZombies: (zombies: ZombieData[]) => void;
  updateZombie: (id: string, updates: Partial<ZombieData>) => void;
  removeZombie: (id: string) => void;

  // Wave countdown
  waveCountdown: number;
  setWaveCountdown: (n: number) => void;
  isWaveTransition: boolean;
  setIsWaveTransition: (b: boolean) => void;

  // Attack state
  isAttacking: boolean;
  setIsAttacking: (b: boolean) => void;
  lastAttackTime: number;
  setLastAttackTime: (t: number) => void;

  // Input
  keys: Set<string>;
  setKey: (key: string, pressed: boolean) => void;
  joystickDelta: { x: number; y: number };
  setJoystickDelta: (delta: { x: number; y: number }) => void;

  // Environment
  envObjects: EnvObject[];
  setEnvObjects: (objs: EnvObject[]) => void;

  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: "start",
  setGameState: (state) => set({ gameState: state }),

  playerHealth: 100,
  setPlayerHealth: (hp) =>
    set({ playerHealth: Math.max(0, Math.min(100, hp)) }),
  playerPosition: new THREE.Vector3(0, 1, 0),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  playerName: "",
  setPlayerName: (name) => set({ playerName: name }),

  score: 0,
  kills: 0,
  wave: 1,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  addKill: () => set((state) => ({ kills: state.kills + 1 })),
  nextWave: () => set((state) => ({ wave: state.wave + 1 })),

  zombies: [],
  setZombies: (zombies) => set({ zombies }),
  updateZombie: (id, updates) =>
    set((state) => ({
      zombies: state.zombies.map((z) =>
        z.id === id ? { ...z, ...updates } : z,
      ),
    })),
  removeZombie: (id) =>
    set((state) => ({ zombies: state.zombies.filter((z) => z.id !== id) })),

  waveCountdown: 0,
  setWaveCountdown: (n) => set({ waveCountdown: n }),
  isWaveTransition: false,
  setIsWaveTransition: (b) => set({ isWaveTransition: b }),

  isAttacking: false,
  setIsAttacking: (b) => set({ isAttacking: b }),
  lastAttackTime: 0,
  setLastAttackTime: (t) => set({ lastAttackTime: t }),

  keys: new Set(),
  setKey: (key, pressed) => {
    const keys = new Set(get().keys);
    if (pressed) keys.add(key.toLowerCase());
    else keys.delete(key.toLowerCase());
    set({ keys });
  },
  joystickDelta: { x: 0, y: 0 },
  setJoystickDelta: (delta) => set({ joystickDelta: delta }),

  envObjects: [],
  setEnvObjects: (objs) => set({ envObjects: objs }),

  resetGame: () =>
    set({
      playerHealth: 100,
      score: 0,
      kills: 0,
      wave: 1,
      zombies: [],
      isAttacking: false,
      lastAttackTime: 0,
      waveCountdown: 0,
      isWaveTransition: false,
      playerPosition: new THREE.Vector3(0, 1, 0),
      keys: new Set(),
      joystickDelta: { x: 0, y: 0 },
    }),
}));
