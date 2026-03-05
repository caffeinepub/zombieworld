import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { type ZombieData, useGameStore } from "./gameStore";
import { spawnZombiePosition } from "./worldGen";

const WANDER_SPEED = 2;
const CHASE_SPEED = 4;
const CHASE_RADIUS = 20;
const ATTACK_RADIUS = 2;
const MAX_ZOMBIES = 30;
const SPAWN_COUNT_BASE = 5;
const SPAWN_COUNT_INCREMENT = 3;

let spawnSeedCounter = 1000;

function getSpawnCount(wave: number) {
  return Math.min(
    SPAWN_COUNT_BASE + (wave - 1) * SPAWN_COUNT_INCREMENT,
    MAX_ZOMBIES,
  );
}

function createZombie(
  playerX: number,
  playerZ: number,
  wave: number,
): ZombieData {
  spawnSeedCounter++;
  const [x, z] = spawnZombiePosition(playerX, playerZ, spawnSeedCounter);
  const clampedX = Math.max(-90, Math.min(90, x));
  const clampedZ = Math.max(-90, Math.min(90, z));

  return {
    id: `zombie_${Date.now()}_${Math.random()}`,
    position: new THREE.Vector3(clampedX, 1, clampedZ),
    health: 30 + wave * 2,
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

// Single zombie mesh component
function ZombieMesh({ zombie }: { zombie: ZombieData }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const deathScaleRef = useRef(1);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const now = performance.now() / 1000;

    // Death animation
    if (zombie.isDying) {
      deathScaleRef.current = Math.max(0, deathScaleRef.current - dt * 2.5);
      groupRef.current.scale.setScalar(deathScaleRef.current);
      // Sink into ground
      groupRef.current.position.y -= dt * 1.5;
      return;
    }

    // Update position from store
    groupRef.current.position.copy(zombie.position);

    // Bob head slightly
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(now * 2 + zombie.position.x) * 0.1;
    }

    // Face player direction
    const playerPos = useGameStore.getState().playerPosition;
    const dir = new THREE.Vector3()
      .subVectors(playerPos, zombie.position)
      .normalize();
    if (zombie.state === "chase" || zombie.state === "attack") {
      groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
    }
  });

  const isChasing = zombie.state === "chase" || zombie.state === "attack";
  const healthRatio = zombie.health / 30;
  const greenTint = Math.floor(healthRatio * 0x20 + 0x1a);

  return (
    <group
      ref={groupRef}
      position={[zombie.position.x, zombie.position.y, zombie.position.z]}
    >
      {/* Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 1.2, 0.4]} />
        <meshStandardMaterial
          color={new THREE.Color(0x1e2a1e).setHex(
            0x1a2a15 + greenTint * 0x010000,
          )}
          roughness={0.9}
          emissive={new THREE.Color(0x0a1a05)}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} castShadow position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={0x1e2a15} roughness={0.85} />
      </mesh>

      {/* Glowing green eyes */}
      <mesh position={[0.12, 0.9, 0.28]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color={0x00ff44}
          emissive={0x00ff44}
          emissiveIntensity={isChasing ? 4 : 1.5}
        />
      </mesh>
      <mesh position={[-0.12, 0.9, 0.28]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color={0x00ff44}
          emissive={0x00ff44}
          emissiveIntensity={isChasing ? 4 : 1.5}
        />
      </mesh>

      {/* Eye glow light */}
      {isChasing && (
        <pointLight
          color={0x00ff44}
          intensity={0.8}
          distance={4}
          position={[0, 0.9, 0.3]}
        />
      )}

      {/* Left arm */}
      <mesh castShadow position={[-0.5, 0.0, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color={0x1a2a12} roughness={0.9} />
      </mesh>

      {/* Right arm - raised when attacking */}
      <mesh
        castShadow
        position={[0.5, isChasing ? 0.3 : 0, isChasing ? 0.3 : 0]}
        rotation={[isChasing ? -1.2 : 0, 0, -0.4]}
      >
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color={0x1a2a12} roughness={0.9} />
      </mesh>

      {/* Health indicator (small bar above head) */}
      {!zombie.isDying && zombie.health < 30 && (
        <group position={[0, 1.5, 0]}>
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

// Zombie AI logic (runs in useFrame)
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

  // Initial spawn and wave management
  useEffect(() => {
    if (gameState !== "playing") return;

    const { zombies: currentZombies } = useGameStore.getState();

    if (currentZombies.length === 0 && !isWaveTransition) {
      zombiesSpawnedRef.current = false;
    }
  }, [gameState, isWaveTransition]);

  // Spawn initial wave
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

    // Check if all zombies dead -> start wave transition
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

    // Update zombie AI
    const updatedZombies = currentZombies.map((zombie) => {
      if (zombie.isDying) {
        // Check if death animation done
        if (now - zombie.deathTime > 0.8) return null;
        return zombie;
      }

      const distToPlayer = zombie.position.distanceTo(pPos);
      let newState = zombie.state;
      let newPos = zombie.position.clone();
      let newWanderTarget = zombie.wanderTarget.clone();

      // Determine AI state
      if (distToPlayer < ATTACK_RADIUS) {
        newState = "attack";
      } else if (distToPlayer < CHASE_RADIUS) {
        newState = "chase";
      } else {
        newState = "idle";
      }

      // Move
      if (newState === "chase" || newState === "attack") {
        const dir = new THREE.Vector3().subVectors(pPos, newPos).normalize();
        const speed = newState === "attack" ? CHASE_SPEED * 0.5 : CHASE_SPEED;
        newPos.addScaledVector(dir, speed * dt);
      } else {
        // Wander
        const dist = newPos.distanceTo(newWanderTarget);
        if (dist < 2) {
          // New wander target
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
        newPos.addScaledVector(dir, WANDER_SPEED * dt);
      }

      // Keep on ground and in bounds
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
