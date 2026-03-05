import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { ZOMBIE_SCORE } from "./Zombies";
import { useGameStore } from "./gameStore";
import type { EnvObject } from "./gameStore";

const MOVE_SPEED = 6;
const ATTACK_COOLDOWN = 0.6;
const RIFLE_COOLDOWN = 0.4;
const SHOTGUN_COOLDOWN = 0.8;
const ZOMBIE_HIT_INTERVAL = 1.5;
const MELEE_RANGE = 3;
const RIFLE_RANGE = 40;
const SHOTGUN_RANGE = 15;
const MELEE_DAMAGE = 25;
const RIFLE_DAMAGE = 35;
const SHOTGUN_DAMAGE = 20;
const SHOTGUN_PELLETS = 5;
const SHOTGUN_SPREAD = 15 * (Math.PI / 180); // 15 degrees in radians
const WEAPON_PICKUP_RADIUS = 2;

function checkAABBCollision(
  pos: THREE.Vector3,
  envObjects: EnvObject[],
  playerRadius: number,
): THREE.Vector3 {
  const result = pos.clone();

  for (const obj of envObjects) {
    if (obj.type === "tree") continue;
    const [ox, oy, oz] = obj.position;
    const [sw, , sd] = obj.size;

    const hw = sw / 2 + playerRadius;
    const hd = sd / 2 + playerRadius;

    const dx = result.x - ox;
    const dz = result.z - oz;

    if (Math.abs(result.y - oy) > obj.size[1] / 2 + 1) continue;

    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const overlapX = hw - Math.abs(dx);
      const overlapZ = hd - Math.abs(dz);
      if (overlapX < overlapZ) {
        result.x += dx > 0 ? overlapX : -overlapX;
      } else {
        result.z += dz > 0 ? overlapZ : -overlapZ;
      }
    }
  }

  return result;
}

// Weapons array for cycling
const WEAPONS: Array<"fists" | "rifle" | "shotgun"> = [
  "fists",
  "rifle",
  "shotgun",
];

export function Player({
  cameraRef,
}: {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  // armRef is now a Group to wrap upper arm + forearm + hand
  const armRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const attackAnimRef = useRef(0);
  const lastRangedAttackRef = useRef(0);

  const {
    gameState,
    setPlayerPosition,
    setPlayerHealth,
    isAttacking,
    setIsAttacking,
    lastAttackTime,
    setLastAttackTime,
    updateZombie,
    removeZombie,
    addScore,
    addKill,
    envObjects,
  } = useGameStore();

  const velocityRef = useRef(new THREE.Vector3());
  const facingRef = useRef(0);
  const lastZombieHitTimes = useRef<Map<string, number>>(new Map());

  // Ranged attack helper
  const handleRangedAttack = useCallback(() => {
    const store = useGameStore.getState();
    const { currentWeapon, rifleAmmo, shotgunAmmo } = store;
    const now = performance.now() / 1000;
    const cooldown =
      currentWeapon === "rifle" ? RIFLE_COOLDOWN : SHOTGUN_COOLDOWN;

    if (now - lastRangedAttackRef.current < cooldown) return;

    if (currentWeapon === "rifle") {
      if (rifleAmmo <= 0) return;
      store.setRifleAmmo(rifleAmmo - 1);
    } else if (currentWeapon === "shotgun") {
      if (shotgunAmmo <= 0) return;
      store.setShotgunAmmo(shotgunAmmo - 1);
    }

    lastRangedAttackRef.current = now;
    setIsAttacking(true);
    attackAnimRef.current = 0;
    setTimeout(() => setIsAttacking(false), 200);

    const playerPos = bodyRef.current?.position;
    if (!playerPos) return;

    const facing = facingRef.current;
    const currentZombies = useGameStore.getState().zombies;

    if (currentWeapon === "rifle") {
      // Single hitscan ray
      const dirX = Math.sin(facing);
      const dirZ = Math.cos(facing);
      for (const z of currentZombies) {
        if (z.isDying) continue;
        const dist = playerPos.distanceTo(z.position);
        if (dist > RIFLE_RANGE) continue;

        // Direction from player to zombie
        const dx = z.position.x - playerPos.x;
        const dz = z.position.z - playerPos.z;
        const dot = dirX * (dx / dist) + dirZ * (dz / dist);
        if (dot > 0.85) {
          // ~32 degree cone for hitscan
          const newHp = z.health - RIFLE_DAMAGE;
          if (newHp <= 0) {
            updateZombie(z.id, {
              isDying: true,
              deathTime: performance.now() / 1000,
            });
            addScore(ZOMBIE_SCORE[z.zombieType]);
            addKill();
          } else {
            updateZombie(z.id, { health: newHp });
          }
        }
      }
    } else if (currentWeapon === "shotgun") {
      // 5 rays in spread cone
      for (let pellet = 0; pellet < SHOTGUN_PELLETS; pellet++) {
        const spreadAngle =
          (pellet - (SHOTGUN_PELLETS - 1) / 2) *
          ((SHOTGUN_SPREAD * 2) / (SHOTGUN_PELLETS - 1));
        const pelletAngle = facing + spreadAngle;
        const dirX = Math.sin(pelletAngle);
        const dirZ = Math.cos(pelletAngle);

        for (const z of currentZombies) {
          if (z.isDying) continue;
          const dist = playerPos.distanceTo(z.position);
          if (dist > SHOTGUN_RANGE) continue;

          const dx = z.position.x - playerPos.x;
          const dz = z.position.z - playerPos.z;
          const dot = dirX * (dx / dist) + dirZ * (dz / dist);
          if (dot > 0.9) {
            const newHp = z.health - SHOTGUN_DAMAGE;
            if (newHp <= 0) {
              updateZombie(z.id, {
                isDying: true,
                deathTime: performance.now() / 1000,
              });
              addScore(ZOMBIE_SCORE[z.zombieType]);
              addKill();
            } else {
              updateZombie(z.id, { health: newHp });
            }
          }
        }
      }
    }
  }, [setIsAttacking, updateZombie, addScore, addKill]);

  // Melee attack (original logic extracted)
  const handleMeleeAttack = useCallback(() => {
    const now = performance.now() / 1000;
    if (now - lastAttackTime < ATTACK_COOLDOWN) return;
    setIsAttacking(true);
    setLastAttackTime(now);
    attackAnimRef.current = 0;

    const playerPos = bodyRef.current?.position;
    if (!playerPos) return;

    const currentZombies = useGameStore.getState().zombies;
    for (const z of currentZombies) {
      const dist = playerPos.distanceTo(z.position);
      if (dist < MELEE_RANGE && !z.isDying) {
        const newHp = z.health - MELEE_DAMAGE;
        if (newHp <= 0) {
          updateZombie(z.id, {
            isDying: true,
            deathTime: performance.now() / 1000,
          });
          addScore(ZOMBIE_SCORE[z.zombieType]);
          addKill();
        } else {
          updateZombie(z.id, { health: newHp });
        }
      }
    }

    setTimeout(() => setIsAttacking(false), 300);
  }, [
    lastAttackTime,
    setIsAttacking,
    setLastAttackTime,
    updateZombie,
    addScore,
    addKill,
  ]);

  // Dispatch attack based on current weapon
  const handleAttack = useCallback(() => {
    const { currentWeapon } = useGameStore.getState();
    if (currentWeapon === "fists") {
      handleMeleeAttack();
    } else {
      handleRangedAttack();
    }
  }, [handleMeleeAttack, handleRangedAttack]);

  // Global key, mouse, and wheel listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      useGameStore.getState().setKey(e.key, true);
      if (e.code === "Space") {
        e.preventDefault();
        handleAttack();
      }
      if (e.code === "Escape" && gameState === "playing") {
        useGameStore.getState().setGameState("paused");
      } else if (e.code === "Escape" && gameState === "paused") {
        useGameStore.getState().setGameState("playing");
      }

      // Weapon switching with 1/2/3
      if (e.key === "1") useGameStore.getState().setCurrentWeapon("fists");
      if (e.key === "2") useGameStore.getState().setCurrentWeapon("rifle");
      if (e.key === "3") useGameStore.getState().setCurrentWeapon("shotgun");
    };
    const onKeyUp = (e: KeyboardEvent) =>
      useGameStore.getState().setKey(e.key, false);
    const onClick = () => {
      if (gameState === "playing") handleAttack();
    };
    const onWheel = (e: WheelEvent) => {
      if (gameState !== "playing") return;
      const store = useGameStore.getState();
      const idx = WEAPONS.indexOf(store.currentWeapon);
      const nextIdx =
        e.deltaY > 0
          ? (idx + 1) % WEAPONS.length
          : (idx - 1 + WEAPONS.length) % WEAPONS.length;
      store.setCurrentWeapon(WEAPONS[nextIdx]);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("click", onClick);
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("click", onClick);
      window.removeEventListener("wheel", onWheel);
    };
  }, [gameState, handleAttack]);

  useFrame((state, delta) => {
    if (gameState !== "playing" || !bodyRef.current) return;

    const body = bodyRef.current;
    const dt = Math.min(delta, 0.05);

    // Camera direction projected on ground
    const camDir = new THREE.Vector3();
    if (cameraRef.current) {
      cameraRef.current.getWorldDirection(camDir);
    }
    camDir.y = 0;
    camDir.normalize();

    const right = new THREE.Vector3()
      .crossVectors(camDir, new THREE.Vector3(0, 1, 0))
      .normalize();

    const moveDir = new THREE.Vector3();
    const { keys: currentKeys, joystickDelta: jd } = useGameStore.getState();

    if (currentKeys.has("w") || currentKeys.has("arrowup"))
      moveDir.addScaledVector(camDir, 1);
    if (currentKeys.has("s") || currentKeys.has("arrowdown"))
      moveDir.addScaledVector(camDir, -1);
    if (currentKeys.has("a") || currentKeys.has("arrowleft"))
      moveDir.addScaledVector(right, -1);
    if (currentKeys.has("d") || currentKeys.has("arrowright"))
      moveDir.addScaledVector(right, 1);

    if (Math.abs(jd.x) > 0.05 || Math.abs(jd.y) > 0.05) {
      moveDir.addScaledVector(right, jd.x);
      moveDir.addScaledVector(camDir, -jd.y);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      facingRef.current = Math.atan2(moveDir.x, moveDir.z);
    }

    const targetVel = moveDir.clone().multiplyScalar(MOVE_SPEED);
    velocityRef.current.lerp(targetVel, 0.15);

    const newPos = body.position
      .clone()
      .addScaledVector(velocityRef.current, dt);
    newPos.y = 1;

    newPos.x = Math.max(-95, Math.min(95, newPos.x));
    newPos.z = Math.max(-95, Math.min(95, newPos.z));

    const corrected = checkAABBCollision(newPos, envObjects, 0.5);
    body.position.copy(corrected);

    body.rotation.y = THREE.MathUtils.lerp(
      body.rotation.y,
      facingRef.current,
      0.2,
    );

    setPlayerPosition(body.position.clone());

    // Walk cycle animation
    const speed = velocityRef.current.length();
    const walkCycle =
      Math.sin(state.clock.getElapsedTime() * 8) * Math.min(speed / 6, 1) * 0.6;
    if (rightLegRef.current) rightLegRef.current.rotation.x = walkCycle;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -walkCycle;

    // Attack arm animation — animate the group rotation
    if (attackAnimRef.current < 1) {
      attackAnimRef.current = Math.min(1, attackAnimRef.current + dt * 4);
      if (armRef.current) {
        const progress = attackAnimRef.current;
        const swing = Math.sin(progress * Math.PI);
        armRef.current.rotation.x = -swing * 1.5;
      }
    } else if (armRef.current) {
      armRef.current.rotation.x = 0;
    }

    // Zombie damage to player
    const now = performance.now() / 1000;
    const currentZombies = useGameStore.getState().zombies;

    for (const z of currentZombies) {
      if (z.isDying) continue;
      const dist = body.position.distanceTo(z.position);
      if (dist < 2) {
        const lastHit = lastZombieHitTimes.current.get(z.id) || 0;
        if (now - lastHit > ZOMBIE_HIT_INTERVAL) {
          lastZombieHitTimes.current.set(z.id, now);
          const newHp = useGameStore.getState().playerHealth - z.damage;
          setPlayerHealth(newHp);
          if (newHp <= 0) {
            useGameStore.getState().setGameState("gameover");
          }
        }
      }
    }

    // Clean up dead zombies
    const deadZombies = currentZombies.filter(
      (z) => z.isDying && now - z.deathTime > 0.8,
    );
    for (const z of deadZombies) {
      removeZombie(z.id);
    }

    // Weapon pickup collection
    const storeState = useGameStore.getState();
    const { weaponPickups } = storeState;
    for (const pickup of weaponPickups) {
      const pickupPos = new THREE.Vector3(...pickup.position);
      if (body.position.distanceTo(pickupPos) < WEAPON_PICKUP_RADIUS) {
        if (pickup.type === "rifle") {
          storeState.setRifleAmmo(storeState.rifleAmmo + 30);
          // Auto-switch to rifle if currently using fists
          if (storeState.currentWeapon === "fists") {
            storeState.setCurrentWeapon("rifle");
          }
        } else if (pickup.type === "shotgun") {
          storeState.setShotgunAmmo(storeState.shotgunAmmo + 10);
          if (storeState.currentWeapon === "fists") {
            storeState.setCurrentWeapon("shotgun");
          }
        }
        storeState.removeWeaponPickup(pickup.id);
      }
    }
  });

  // Read weapon from store reactively for rendering
  const currentWeapon = useGameStore((s) => s.currentWeapon);

  return (
    <group ref={bodyRef} position={[0, 1, 0]}>
      {/* ── HEAD GROUP ─────────────────────────────────────────────────────── */}
      <group position={[0, 1.05, 0]}>
        {/* Head sphere — skin */}
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 14]} />
          <meshStandardMaterial color="#c8856a" roughness={0.75} />
        </mesh>
        {/* Brow ridge */}
        <mesh castShadow position={[0, 0.1, 0.16]}>
          <boxGeometry args={[0.32, 0.06, 0.1]} />
          <meshStandardMaterial color="#b87060" roughness={0.8} />
        </mesh>
        {/* Nose */}
        <mesh castShadow position={[0, 0.01, 0.19]}>
          <boxGeometry args={[0.06, 0.09, 0.1]} />
          <meshStandardMaterial color="#c8856a" roughness={0.8} />
        </mesh>
        {/* Left ear */}
        <mesh castShadow position={[-0.19, 0, 0]} scale={[0.6, 1, 0.4]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#c8856a" roughness={0.8} />
        </mesh>
        {/* Right ear */}
        <mesh castShadow position={[0.19, 0, 0]} scale={[0.6, 1, 0.4]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#c8856a" roughness={0.8} />
        </mesh>
        {/* Hair — dark, only top half (clipped via scaleY) */}
        <mesh castShadow position={[0, 0.08, -0.03]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.19, 16, 8]} />
          <meshStandardMaterial color="#2a1a0e" roughness={0.9} />
        </mesh>
        {/* Left eye */}
        <mesh position={[-0.07, 0.06, 0.17]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a0a05" roughness={0.3} />
        </mesh>
        {/* Right eye */}
        <mesh position={[0.07, 0.06, 0.17]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a0a05" roughness={0.3} />
        </mesh>
      </group>

      {/* ── NECK ───────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.18, 8]} />
        <meshStandardMaterial color="#c8856a" roughness={0.75} />
      </mesh>

      {/* ── TORSO ──────────────────────────────────────────────────────────── */}
      {/* Undershirt/body */}
      <mesh castShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[0.42, 0.62, 0.28]} />
        <meshStandardMaterial color="#3a4a2a" roughness={0.85} />
      </mesh>
      {/* Jacket/shirt layer */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.46, 0.58, 0.3]} />
        <meshStandardMaterial color="#2d3d1d" roughness={0.7} />
      </mesh>
      {/* Jacket collar */}
      <mesh castShadow position={[0, 0.75, 0.12]}>
        <boxGeometry args={[0.44, 0.1, 0.08]} />
        <meshStandardMaterial color="#2d3d1d" roughness={0.7} />
      </mesh>

      {/* ── PELVIS ─────────────────────────────────────────────────────────── */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.38, 0.2, 0.26]} />
        <meshStandardMaterial color="#1a1e28" roughness={0.85} />
      </mesh>

      {/* ── RIGHT ARM (armRef group for attack animation) ───────────────────── */}
      <group ref={armRef}>
        {/* Upper arm */}
        <mesh castShadow position={[0.31, 0.55, 0]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.07, 0.32, 4, 8]} />
          <meshStandardMaterial color="#2d3d1d" roughness={0.75} />
        </mesh>
        {/* Forearm */}
        <mesh castShadow position={[0.38, 0.22, 0.08]}>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          <meshStandardMaterial color="#c8856a" roughness={0.75} />
        </mesh>
        {/* Hand */}
        <mesh castShadow position={[0.42, 0.04, 0.1]}>
          <boxGeometry args={[0.1, 0.12, 0.07]} />
          <meshStandardMaterial color="#c8856a" roughness={0.75} />
        </mesh>

        {/* Weapon mesh on right hand */}
        {currentWeapon === "rifle" && (
          <mesh
            castShadow
            position={[0.44, 0.04, 0.26]}
            rotation={[0, 0, -0.2]}
          >
            <boxGeometry args={[0.7, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#222222"
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        )}
        {currentWeapon === "shotgun" && (
          <mesh
            castShadow
            position={[0.44, 0.04, 0.26]}
            rotation={[0, 0, -0.2]}
          >
            <boxGeometry args={[0.45, 0.1, 0.1]} />
            <meshStandardMaterial
              color="#3a2010"
              roughness={0.6}
              metalness={0.5}
            />
          </mesh>
        )}
      </group>

      {/* ── LEFT ARM ───────────────────────────────────────────────────────── */}
      <group>
        {/* Upper arm */}
        <mesh castShadow position={[-0.31, 0.55, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.07, 0.32, 4, 8]} />
          <meshStandardMaterial color="#2d3d1d" roughness={0.75} />
        </mesh>
        {/* Forearm */}
        <mesh castShadow position={[-0.38, 0.22, 0.08]}>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          <meshStandardMaterial color="#c8856a" roughness={0.75} />
        </mesh>
        {/* Hand */}
        <mesh castShadow position={[-0.42, 0.04, 0.1]}>
          <boxGeometry args={[0.1, 0.12, 0.07]} />
          <meshStandardMaterial color="#c8856a" roughness={0.75} />
        </mesh>
      </group>

      {/* ── RIGHT LEG ──────────────────────────────────────────────────────── */}
      <group ref={rightLegRef} position={[0.12, 0.0, 0]}>
        {/* Thigh */}
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1a1e28" roughness={0.85} />
        </mesh>
        {/* Lower leg */}
        <mesh castShadow position={[0.01, -0.35, 0]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1a1e28" roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh castShadow position={[0.01, -0.62, 0.04]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
        </mesh>
      </group>

      {/* ── LEFT LEG ───────────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.12, 0.0, 0]}>
        {/* Thigh */}
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1a1e28" roughness={0.85} />
        </mesh>
        {/* Lower leg */}
        <mesh castShadow position={[-0.01, -0.35, 0]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1a1e28" roughness={0.85} />
        </mesh>
        {/* Boot */}
        <mesh castShadow position={[-0.01, -0.62, 0.04]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
        </mesh>
      </group>

      {/* Attack effect light */}
      {isAttacking && (
        <pointLight
          color={
            currentWeapon === "rifle"
              ? 0xffff44
              : currentWeapon === "shotgun"
                ? 0xff8800
                : 0xff3300
          }
          intensity={3}
          distance={5}
          position={[0, 0, 0.5]}
        />
      )}
    </group>
  );
}
