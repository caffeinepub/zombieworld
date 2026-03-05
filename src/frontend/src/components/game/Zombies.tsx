import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { type ZombieData, type ZombieType, useGameStore } from "./gameStore";
import { spawnZombiePosition } from "./worldGen";

// ── Base movement constants ──────────────────────────────────────────────────
const WANDER_SPEED = 2;
const CHASE_SPEED = 4;
const CHASE_RADIUS = 20;
const ATTACK_RADIUS = 2;
const MAX_ZOMBIES = 35;
const SPAWN_COUNT_BASE = 5;
const SPAWN_COUNT_INCREMENT = 3;

// ── Per-type stats ───────────────────────────────────────────────────────────
const ZOMBIE_STATS: Record<
  ZombieType,
  { health: number; speedMult: number; damage: number; waveMult: number }
> = {
  walker: { health: 60, speedMult: 1.0, damage: 10, waveMult: 2 },
  runner: { health: 30, speedMult: 2.8, damage: 6, waveMult: 1 },
  tank: { health: 300, speedMult: 0.4, damage: 25, waveMult: 5 },
};

// ── Score per kill ────────────────────────────────────────────────────────────
export const ZOMBIE_SCORE: Record<ZombieType, number> = {
  walker: 10,
  runner: 20,
  tank: 50,
};

let spawnSeedCounter = 1000;

function getSpawnCount(wave: number) {
  return Math.min(
    SPAWN_COUNT_BASE + (wave - 1) * SPAWN_COUNT_INCREMENT,
    MAX_ZOMBIES,
  );
}

/** Return a random zombieType weighted by wave number. */
function pickZombieType(wave: number): ZombieType {
  // Wave 1: all walkers. Runners appear wave 2+, tanks wave 4+.
  const runnerChance = Math.min(0.35, (wave - 1) * 0.08);
  const tankChance = Math.min(0.2, Math.max(0, (wave - 3) * 0.05));
  const r = Math.random();
  if (r < tankChance) return "tank";
  if (r < tankChance + runnerChance) return "runner";
  return "walker";
}

function createZombie(
  playerX: number,
  playerZ: number,
  wave: number,
  zombieType?: ZombieType,
): ZombieData {
  spawnSeedCounter++;
  const [x, z] = spawnZombiePosition(playerX, playerZ, spawnSeedCounter);
  const clampedX = Math.max(-90, Math.min(90, x));
  const clampedZ = Math.max(-90, Math.min(90, z));

  const type = zombieType ?? pickZombieType(wave);
  const stats = ZOMBIE_STATS[type];
  const baseHealth = stats.health + wave * stats.waveMult;

  return {
    id: `zombie_${Date.now()}_${Math.random()}`,
    zombieType: type,
    position: new THREE.Vector3(clampedX, 1, clampedZ),
    health: baseHealth,
    maxHealth: baseHealth,
    speedMultiplier: stats.speedMult,
    damage: stats.damage,
    state: "idle",
    wanderTarget: new THREE.Vector3(
      clampedX + (Math.random() - 0.5) * 20,
      1,
      clampedZ + (Math.random() - 0.5) * 20,
    ),
    lastHitTime: 0,
    isDying: false,
    deathTime: 0,
    velocity: new THREE.Vector3(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ZombieMesh – renders differently per type
// ─────────────────────────────────────────────────────────────────────────────
function ZombieMesh({ zombie }: { zombie: ZombieData }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const deathScaleRef = useRef(1);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const now = performance.now() / 1000;

    if (zombie.isDying) {
      deathScaleRef.current = Math.max(0, deathScaleRef.current - dt * 2.5);
      groupRef.current.scale.setScalar(deathScaleRef.current);
      groupRef.current.position.y -= dt * 1.5;
      return;
    }

    groupRef.current.position.copy(zombie.position);

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(now * 2 + zombie.position.x) * 0.1;
    }

    const playerPos = useGameStore.getState().playerPosition;
    const dir = new THREE.Vector3()
      .subVectors(playerPos, zombie.position)
      .normalize();
    if (zombie.state === "chase" || zombie.state === "attack") {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }
  });

  const isChasing = zombie.state === "chase" || zombie.state === "attack";
  const healthRatio = zombie.health / zombie.maxHealth;

  // ── Walker ──────────────────────────────────────────────────────────────────
  if (zombie.zombieType === "walker") {
    return (
      <group
        ref={groupRef}
        position={[zombie.position.x, zombie.position.y, zombie.position.z]}
      >
        {/* Torso — torn shirt */}
        <mesh castShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[0.65, 0.7, 0.32]} />
          <meshStandardMaterial
            color="#3a3020"
            roughness={0.95}
            emissive="#100a00"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Torn shirt overlay — upper layer for texture depth */}
        <mesh castShadow position={[0, 0.35, 0.01]}>
          <boxGeometry args={[0.68, 0.38, 0.33]} />
          <meshStandardMaterial
            color="#2a2215"
            roughness={0.98}
            emissive="#0a0805"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Pelvis/hips — dirty pants */}
        <mesh castShadow position={[0, -0.28, 0]}>
          <boxGeometry args={[0.55, 0.22, 0.28]} />
          <meshStandardMaterial color="#2a2218" roughness={0.95} />
        </mesh>
        {/* Neck */}
        <mesh castShadow position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.15, 6]} />
          <meshStandardMaterial color="#4a5535" roughness={0.9} />
        </mesh>
        {/* Head — sickly green-grey */}
        <mesh ref={headRef} castShadow position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color="#5a6b4a" roughness={0.9} />
        </mesh>
        {/* Glowing green eyes */}
        <mesh position={[0.1, 0.9, 0.2]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00ff44"
            emissiveIntensity={isChasing ? 4 : 1.5}
          />
        </mesh>
        <mesh position={[-0.1, 0.9, 0.2]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00ff44"
            emissiveIntensity={isChasing ? 4 : 1.5}
          />
        </mesh>
        {isChasing && (
          <pointLight
            color={0x00ff44}
            intensity={0.8}
            distance={4}
            position={[0, 0.9, 0.3]}
          />
        )}
        {/* Left upper arm */}
        <mesh
          castShadow
          position={[-0.45, 0.1, 0]}
          rotation={[isChasing ? -0.5 : 0, 0, 0.3]}
        >
          <capsuleGeometry args={[0.09, 0.28, 4, 6]} />
          <meshStandardMaterial color="#3a3020" roughness={0.92} />
        </mesh>
        {/* Left lower arm */}
        <mesh
          castShadow
          position={[-0.48, -0.22, isChasing ? 0.12 : 0]}
          rotation={[isChasing ? -0.6 : 0, 0, 0.15]}
        >
          <capsuleGeometry args={[0.07, 0.24, 4, 6]} />
          <meshStandardMaterial color="#4a5535" roughness={0.92} />
        </mesh>
        {/* Right upper arm */}
        <mesh
          castShadow
          position={[0.45, isChasing ? 0.25 : 0.1, isChasing ? 0.1 : 0]}
          rotation={[isChasing ? -1.0 : 0, 0, -0.3]}
        >
          <capsuleGeometry args={[0.09, 0.28, 4, 6]} />
          <meshStandardMaterial color="#3a3020" roughness={0.92} />
        </mesh>
        {/* Right lower arm */}
        <mesh
          castShadow
          position={[0.48, isChasing ? 0.05 : -0.22, isChasing ? 0.25 : 0]}
          rotation={[isChasing ? -1.1 : 0, 0, -0.15]}
        >
          <capsuleGeometry args={[0.07, 0.24, 4, 6]} />
          <meshStandardMaterial color="#4a5535" roughness={0.92} />
        </mesh>
        {/* Right thigh */}
        <mesh castShadow position={[0.15, -0.55, 0]}>
          <capsuleGeometry args={[0.11, 0.28, 4, 6]} />
          <meshStandardMaterial color="#2a2218" roughness={0.92} />
        </mesh>
        {/* Right lower leg */}
        <mesh castShadow position={[0.15, -0.88, 0]}>
          <capsuleGeometry args={[0.09, 0.28, 4, 6]} />
          <meshStandardMaterial color="#2a2218" roughness={0.92} />
        </mesh>
        {/* Left thigh */}
        <mesh castShadow position={[-0.15, -0.55, 0]}>
          <capsuleGeometry args={[0.11, 0.28, 4, 6]} />
          <meshStandardMaterial color="#2a2218" roughness={0.92} />
        </mesh>
        {/* Left lower leg */}
        <mesh castShadow position={[-0.15, -0.88, 0]}>
          <capsuleGeometry args={[0.09, 0.28, 4, 6]} />
          <meshStandardMaterial color="#2a2218" roughness={0.92} />
        </mesh>
        {/* Health bar */}
        {!zombie.isDying && zombie.health < zombie.maxHealth && (
          <group position={[0, 1.55, 0]}>
            <mesh>
              <boxGeometry args={[0.6, 0.06, 0.06]} />
              <meshBasicMaterial color={0x330000} />
            </mesh>
            <mesh position={[-(0.3 - healthRatio * 0.3), 0, 0.01]}>
              <boxGeometry args={[healthRatio * 0.6, 0.06, 0.06]} />
              <meshBasicMaterial color={0xff2200} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  // ── Runner ──────────────────────────────────────────────────────────────────
  if (zombie.zombieType === "runner") {
    return (
      <group
        ref={groupRef}
        position={[zombie.position.x, zombie.position.y, zombie.position.z]}
      >
        {/* Elongated torso — torn grey rags, hunched */}
        <mesh
          castShadow
          position={[0, 0.05, 0]}
          rotation={[isChasing ? 0.3 : 0.15, 0, 0]}
        >
          <boxGeometry args={[0.35, 0.8, 0.22]} />
          <meshStandardMaterial
            color="#252520"
            roughness={0.95}
            emissive="#0d0d0a"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Pelvis */}
        <mesh castShadow position={[0, -0.35, 0]}>
          <boxGeometry args={[0.3, 0.18, 0.2]} />
          <meshStandardMaterial color="#1e1e18" roughness={0.95} />
        </mesh>
        {/* Neck — gaunt */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.055, 0.065, 0.12, 6]} />
          <meshStandardMaterial color="#4a3530" roughness={0.9} />
        </mesh>
        {/* Head — smaller, gaunt */}
        <mesh ref={headRef} castShadow position={[0, 0.83, 0]}>
          <sphereGeometry args={[0.17, 10, 8]} />
          <meshStandardMaterial color="#4a3530" roughness={0.9} />
        </mesh>
        {/* Red eyes */}
        <mesh position={[0.08, 0.88, 0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial
            color="#ff1111"
            emissive="#ff0000"
            emissiveIntensity={isChasing ? 5 : 2}
          />
        </mesh>
        <mesh position={[-0.08, 0.88, 0.15]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial
            color="#ff1111"
            emissive="#ff0000"
            emissiveIntensity={isChasing ? 5 : 2}
          />
        </mesh>
        {isChasing && (
          <pointLight
            color={0xff2200}
            intensity={1.0}
            distance={4}
            position={[0, 0.88, 0.2]}
          />
        )}
        {/* Right thin upper arm — angled forward when chasing */}
        <mesh
          castShadow
          position={[0.24, 0.12, isChasing ? 0.1 : 0]}
          rotation={[isChasing ? -0.9 : 0, 0, -0.25]}
        >
          <capsuleGeometry args={[0.06, 0.3, 4, 6]} />
          <meshStandardMaterial color="#252520" roughness={0.92} />
        </mesh>
        {/* Right thin lower arm */}
        <mesh
          castShadow
          position={[0.27, -0.18, isChasing ? 0.22 : 0]}
          rotation={[isChasing ? -0.7 : 0, 0, -0.15]}
        >
          <capsuleGeometry args={[0.045, 0.28, 4, 6]} />
          <meshStandardMaterial color="#3a2820" roughness={0.92} />
        </mesh>
        {/* Left thin upper arm */}
        <mesh
          castShadow
          position={[-0.24, 0.12, isChasing ? 0.1 : 0]}
          rotation={[isChasing ? -0.9 : 0, 0, 0.25]}
        >
          <capsuleGeometry args={[0.06, 0.3, 4, 6]} />
          <meshStandardMaterial color="#252520" roughness={0.92} />
        </mesh>
        {/* Left thin lower arm */}
        <mesh
          castShadow
          position={[-0.27, -0.18, isChasing ? 0.22 : 0]}
          rotation={[isChasing ? -0.7 : 0, 0, 0.15]}
        >
          <capsuleGeometry args={[0.045, 0.28, 4, 6]} />
          <meshStandardMaterial color="#3a2820" roughness={0.92} />
        </mesh>
        {/* Right thin thigh */}
        <mesh castShadow position={[0.1, -0.52, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 4, 6]} />
          <meshStandardMaterial color="#1e1e18" roughness={0.92} />
        </mesh>
        {/* Right thin lower leg */}
        <mesh castShadow position={[0.1, -0.85, 0]}>
          <capsuleGeometry args={[0.055, 0.3, 4, 6]} />
          <meshStandardMaterial color="#1e1e18" roughness={0.92} />
        </mesh>
        {/* Left thin thigh */}
        <mesh castShadow position={[-0.1, -0.52, 0]}>
          <capsuleGeometry args={[0.07, 0.3, 4, 6]} />
          <meshStandardMaterial color="#1e1e18" roughness={0.92} />
        </mesh>
        {/* Left thin lower leg */}
        <mesh castShadow position={[-0.1, -0.85, 0]}>
          <capsuleGeometry args={[0.055, 0.3, 4, 6]} />
          <meshStandardMaterial color="#1e1e18" roughness={0.92} />
        </mesh>
        {/* Health bar */}
        {!zombie.isDying && zombie.health < zombie.maxHealth && (
          <group position={[0, 1.35, 0]}>
            <mesh>
              <boxGeometry args={[0.5, 0.05, 0.05]} />
              <meshBasicMaterial color={0x330000} />
            </mesh>
            <mesh position={[-(0.25 - healthRatio * 0.25), 0, 0.01]}>
              <boxGeometry args={[healthRatio * 0.5, 0.05, 0.05]} />
              <meshBasicMaterial color={0xff0000} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  // ── Tank ────────────────────────────────────────────────────────────────────
  return (
    <group
      ref={groupRef}
      position={[zombie.position.x, zombie.position.y, zombie.position.z]}
    >
      {/* Massive bloated torso */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.3, 1.7, 0.75]} />
        <meshStandardMaterial
          color="#2e1800"
          roughness={0.95}
          emissive="#140a00"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Belly bulge — protruding gut */}
      <mesh castShadow position={[0, -0.1, 0.42]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial
          color="#261400"
          roughness={0.98}
          emissive="#100800"
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* Armor plate — front chest */}
      <mesh castShadow position={[0, 0.5, 0.4]}>
        <boxGeometry args={[1.1, 0.85, 0.1]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.65}
          metalness={0.55}
        />
      </mesh>
      {/* Armor plate — left side */}
      <mesh castShadow position={[0.7, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.9, 0.55]} />
        <meshStandardMaterial
          color="#161616"
          roughness={0.65}
          metalness={0.5}
        />
      </mesh>
      {/* Armor plate — right side */}
      <mesh castShadow position={[-0.7, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.9, 0.55]} />
        <meshStandardMaterial
          color="#161616"
          roughness={0.65}
          metalness={0.5}
        />
      </mesh>
      {/* Pelvis / hips — massive */}
      <mesh castShadow position={[0, -0.75, 0]}>
        <boxGeometry args={[1.1, 0.28, 0.65]} />
        <meshStandardMaterial color="#241200" roughness={0.95} />
      </mesh>
      {/* Neck — thick */}
      <mesh castShadow position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.25, 8]} />
        <meshStandardMaterial color="#2e1800" roughness={0.9} />
      </mesh>
      {/* Large lumpy head */}
      <mesh ref={headRef} castShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[0.75, 0.65, 0.62]} />
        <meshStandardMaterial color="#2e1800" roughness={0.9} />
      </mesh>
      {/* Forehead bump */}
      <mesh castShadow position={[0, 1.62, 0.25]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color="#281500" roughness={0.95} />
      </mesh>
      {/* Orange eyes */}
      <mesh position={[0.2, 1.48, 0.32]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={isChasing ? 5 : 2}
        />
      </mesh>
      <mesh position={[-0.2, 1.48, 0.32]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={isChasing ? 5 : 2}
        />
      </mesh>
      {isChasing && (
        <pointLight
          color={0xff8800}
          intensity={1.5}
          distance={6}
          position={[0, 1.45, 0.35]}
        />
      )}
      {/* Left thick upper arm */}
      <mesh castShadow position={[-1.0, 0.2, 0]} rotation={[0, 0, 0.45]}>
        <capsuleGeometry args={[0.2, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2e1800" roughness={0.92} />
      </mesh>
      {/* Left thick lower arm */}
      <mesh castShadow position={[-1.1, -0.25, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.16, 0.38, 4, 8]} />
        <meshStandardMaterial color="#3a2200" roughness={0.92} />
      </mesh>
      {/* Right thick upper arm */}
      <mesh
        castShadow
        position={[1.0, isChasing ? 0.45 : 0.2, isChasing ? 0.3 : 0]}
        rotation={[isChasing ? -0.9 : 0, 0, -0.45]}
      >
        <capsuleGeometry args={[0.2, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2e1800" roughness={0.92} />
      </mesh>
      {/* Right thick lower arm */}
      <mesh
        castShadow
        position={[1.1, isChasing ? 0.1 : -0.25, isChasing ? 0.42 : 0]}
        rotation={[isChasing ? -0.8 : 0, 0, -0.2]}
      >
        <capsuleGeometry args={[0.16, 0.38, 4, 8]} />
        <meshStandardMaterial color="#3a2200" roughness={0.92} />
      </mesh>
      {/* Right thick thigh */}
      <mesh castShadow position={[0.28, -0.85, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e1000" roughness={0.92} />
      </mesh>
      {/* Right lower leg */}
      <mesh castShadow position={[0.28, -1.3, 0]}>
        <capsuleGeometry args={[0.14, 0.38, 4, 8]} />
        <meshStandardMaterial color="#1e1000" roughness={0.92} />
      </mesh>
      {/* Left thick thigh */}
      <mesh castShadow position={[-0.28, -0.85, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e1000" roughness={0.92} />
      </mesh>
      {/* Left lower leg */}
      <mesh castShadow position={[-0.28, -1.3, 0]}>
        <capsuleGeometry args={[0.14, 0.38, 4, 8]} />
        <meshStandardMaterial color="#1e1000" roughness={0.92} />
      </mesh>
      {/* Wide health bar */}
      {!zombie.isDying && (
        <group position={[0, 2.3, 0]}>
          <mesh>
            <boxGeometry args={[1.0, 0.08, 0.08]} />
            <meshBasicMaterial color={0x220000} />
          </mesh>
          <mesh position={[-(0.5 - healthRatio * 0.5), 0, 0.01]}>
            <boxGeometry args={[healthRatio * 1.0, 0.08, 0.08]} />
            <meshBasicMaterial color={0xff6600} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ZombieSystem – AI loop + wave management
// ─────────────────────────────────────────────────────────────────────────────
export function ZombieSystem() {
  const {
    gameState,
    zombies,
    setZombies,
    isWaveTransition,
    setIsWaveTransition,
    setWaveCountdown,
    nextWave,
  } = useGameStore();

  const zombiesSpawnedRef = useRef(false);

  useEffect(() => {
    if (gameState !== "playing") return;
    const { zombies: currentZombies } = useGameStore.getState();
    if (currentZombies.length === 0 && !isWaveTransition) {
      zombiesSpawnedRef.current = false;
    }
  }, [gameState, isWaveTransition]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const state = useGameStore.getState();
    if (
      state.zombies.length === 0 &&
      !state.isWaveTransition &&
      !zombiesSpawnedRef.current
    ) {
      zombiesSpawnedRef.current = true;
      const count = getSpawnCount(state.wave);
      const newZombies: ZombieData[] = [];
      for (let i = 0; i < count; i++) {
        newZombies.push(
          createZombie(
            state.playerPosition.x,
            state.playerPosition.z,
            state.wave,
          ),
        );
      }
      setZombies(newZombies);
    }
  }, [gameState, setZombies]);

  useFrame((_, delta) => {
    if (gameState !== "playing") return;
    const dt = Math.min(delta, 0.05);
    const now = performance.now() / 1000;

    const state = useGameStore.getState();
    const { zombies: currentZombies, playerPosition: pPos } = state;

    // Wave transition when all dead
    const aliveZombies = currentZombies.filter((z) => !z.isDying);
    if (
      aliveZombies.length === 0 &&
      currentZombies.length > 0 &&
      !state.isWaveTransition &&
      gameState === "playing"
    ) {
      setIsWaveTransition(true);
      setWaveCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setWaveCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          const nextWaveNum = useGameStore.getState().wave + 1;
          nextWave();
          const spawnCount = getSpawnCount(nextWaveNum);
          const newZombies: ZombieData[] = [];
          for (let i = 0; i < spawnCount; i++) {
            const pp = useGameStore.getState().playerPosition;
            newZombies.push(createZombie(pp.x, pp.z, nextWaveNum));
          }
          setZombies(newZombies);
          setIsWaveTransition(false);
          setWaveCountdown(0);
          zombiesSpawnedRef.current = true;
        }
      }, 1000);
    }

    // AI update
    const updatedZombies = currentZombies.map((zombie) => {
      if (zombie.isDying) {
        if (now - zombie.deathTime > 0.8) return null;
        return zombie;
      }

      const distToPlayer = zombie.position.distanceTo(pPos);
      let newState = zombie.state;
      let newPos = zombie.position.clone();
      let newWanderTarget = zombie.wanderTarget.clone();

      // Runners have extended chase radius
      const chaseRadius =
        zombie.zombieType === "runner" ? CHASE_RADIUS * 1.4 : CHASE_RADIUS;

      if (distToPlayer < ATTACK_RADIUS) {
        newState = "attack";
      } else if (distToPlayer < chaseRadius) {
        newState = "chase";
      } else {
        newState = "idle";
      }

      if (newState === "chase" || newState === "attack") {
        const dir = new THREE.Vector3().subVectors(pPos, newPos).normalize();
        const dayTime = useGameStore.getState().dayTime;
        const isNight = dayTime < 0.2 || dayTime > 0.8;
        const nightMultiplier = isNight ? 1.6 : 1.0;
        const baseSpeed =
          newState === "attack" ? CHASE_SPEED * 0.5 : CHASE_SPEED;
        const speed = baseSpeed * zombie.speedMultiplier * nightMultiplier;
        newPos.addScaledVector(dir, speed * dt);
      } else {
        const dist = newPos.distanceTo(newWanderTarget);
        if (dist < 2) {
          newWanderTarget.set(
            newPos.x + (Math.random() - 0.5) * 30,
            1,
            newPos.z + (Math.random() - 0.5) * 30,
          );
          newWanderTarget.x = Math.max(-90, Math.min(90, newWanderTarget.x));
          newWanderTarget.z = Math.max(-90, Math.min(90, newWanderTarget.z));
        }
        const dir = new THREE.Vector3()
          .subVectors(newWanderTarget, newPos)
          .normalize();
        const wanderSpeed = WANDER_SPEED * zombie.speedMultiplier;
        newPos.addScaledVector(dir, wanderSpeed * dt);
      }

      newPos.y = 1;
      newPos.x = Math.max(-90, Math.min(90, newPos.x));
      newPos.z = Math.max(-90, Math.min(90, newPos.z));

      return {
        ...zombie,
        position: newPos,
        state: newState,
        wanderTarget: newWanderTarget,
      };
    });

    const filtered = updatedZombies.filter((z): z is ZombieData => z !== null);
    if (
      filtered.length !== currentZombies.length ||
      filtered.some((z, i) => z !== currentZombies[i])
    ) {
      setZombies(filtered);
    }
  });

  return (
    <>
      {zombies.map((zombie) => (
        <ZombieMesh key={zombie.id} zombie={zombie} />
      ))}
    </>
  );
}
