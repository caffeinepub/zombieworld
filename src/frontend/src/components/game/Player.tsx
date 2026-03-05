import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "./gameStore";
import type { EnvObject } from "./gameStore";

const MOVE_SPEED = 6;
const ATTACK_COOLDOWN = 0.6;
const ZOMBIE_HIT_INTERVAL = 1.5;
const ATTACK_RANGE = 3;
const ZOMBIE_DAMAGE_TO_PLAYER = 10;
const ZOMBIE_DAMAGE = 25;

function checkAABBCollision(
  pos: THREE.Vector3,
  envObjects: EnvObject[],
  playerRadius: number,
): THREE.Vector3 {
  const result = pos.clone();

  for (const obj of envObjects) {
    if (obj.type === "tree") continue; // trees allow pass-through visually
    const [ox, oy, oz] = obj.position;
    const [sw, , sd] = obj.size;

    const hw = sw / 2 + playerRadius;
    const hd = sd / 2 + playerRadius;

    const dx = result.x - ox;
    const dz = result.z - oz;

    // Check vertical height - only collide if within building height
    if (Math.abs(result.y - oy) > obj.size[1] / 2 + 1) continue;

    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      // Push out on the shortest axis
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

export function Player({
  cameraRef,
}: {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}) {
  const bodyRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Mesh>(null);
  const attackAnimRef = useRef(0); // 0..1 animation progress

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
  const facingRef = useRef(0); // y rotation angle
  const lastZombieHitTimes = useRef<Map<string, number>>(new Map());

  // Handle keyboard attack trigger
  const handleAttack = useCallback(() => {
    const now = performance.now() / 1000;
    if (now - lastAttackTime < ATTACK_COOLDOWN) return;
    setIsAttacking(true);
    setLastAttackTime(now);
    attackAnimRef.current = 0;

    // Deal damage to zombies in range
    const playerPos = bodyRef.current?.position;
    if (!playerPos) return;

    const currentZombies = useGameStore.getState().zombies;
    for (const z of currentZombies) {
      const dist = playerPos.distanceTo(z.position);
      if (dist < ATTACK_RANGE && !z.isDying) {
        const newHp = z.health - ZOMBIE_DAMAGE;
        if (newHp <= 0) {
          updateZombie(z.id, {
            isDying: true,
            deathTime: performance.now() / 1000,
          });
          addScore(10);
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

  // Global key & mouse listeners
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
    };
    const onKeyUp = (e: KeyboardEvent) =>
      useGameStore.getState().setKey(e.key, false);
    const onClick = () => {
      if (gameState === "playing") handleAttack();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("click", onClick);
    };
  }, [gameState, handleAttack]);

  useFrame((_state, delta) => {
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

    // Input direction
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

    // Joystick input
    if (Math.abs(jd.x) > 0.05 || Math.abs(jd.y) > 0.05) {
      moveDir.addScaledVector(right, jd.x);
      moveDir.addScaledVector(camDir, -jd.y);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      facingRef.current = Math.atan2(moveDir.x, moveDir.z);
    }

    // Smooth velocity
    const targetVel = moveDir.clone().multiplyScalar(MOVE_SPEED);
    velocityRef.current.lerp(targetVel, 0.15);

    // New position
    const newPos = body.position
      .clone()
      .addScaledVector(velocityRef.current, dt);
    newPos.y = 1;

    // Clamp to world
    newPos.x = Math.max(-95, Math.min(95, newPos.x));
    newPos.z = Math.max(-95, Math.min(95, newPos.z));

    // Collision detection
    const corrected = checkAABBCollision(newPos, envObjects, 0.5);
    body.position.copy(corrected);

    // Rotate to face movement direction
    body.rotation.y = THREE.MathUtils.lerp(
      body.rotation.y,
      facingRef.current,
      0.2,
    );

    // Update store
    setPlayerPosition(body.position.clone());

    // Attack arm animation
    if (attackAnimRef.current < 1) {
      attackAnimRef.current = Math.min(1, attackAnimRef.current + dt * 4);
      if (armRef.current) {
        const progress = attackAnimRef.current;
        const swing = Math.sin(progress * Math.PI);
        armRef.current.rotation.x = -swing * 1.5;
        armRef.current.position.z = 0.3 - swing * 0.3;
      }
    } else if (armRef.current) {
      armRef.current.rotation.x = 0;
      armRef.current.position.z = 0.3;
    }

    // Zombie damage to player
    const now = performance.now() / 1000;
    const currentZombies = useGameStore.getState().zombies;
    let takingDamage = false;

    for (const z of currentZombies) {
      if (z.isDying) continue;
      const dist = body.position.distanceTo(z.position);
      if (dist < 2) {
        takingDamage = true;
        const lastHit = lastZombieHitTimes.current.get(z.id) || 0;
        if (now - lastHit > ZOMBIE_HIT_INTERVAL) {
          lastZombieHitTimes.current.set(z.id, now);
          const newHp =
            useGameStore.getState().playerHealth - ZOMBIE_DAMAGE_TO_PLAYER;
          setPlayerHealth(newHp);
          if (newHp <= 0) {
            useGameStore.getState().setGameState("gameover");
          }
        }
      }
    }

    // Remove stale zombie hit timers
    if (!takingDamage) {
      // cleanup old entries periodically
    }

    // Clean up dead zombies
    const deadZombies = currentZombies.filter(
      (z) => z.isDying && now - z.deathTime > 0.8,
    );
    for (const z of deadZombies) {
      removeZombie(z.id);
    }
  });

  return (
    <group ref={bodyRef} position={[0, 1, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.4, 1.0, 4, 8]} />
        <meshStandardMaterial
          color={0x2d4a2d}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color={0x3d5a3d} roughness={0.7} />
      </mesh>

      {/* Right Arm */}
      <mesh
        ref={armRef}
        castShadow
        position={[0.55, 0.1, 0.3]}
        rotation={[0, 0, -0.3]}
      >
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={0x2d4a2d} roughness={0.8} />
      </mesh>

      {/* Left Arm */}
      <mesh castShadow position={[-0.55, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color={0x2d4a2d} roughness={0.8} />
      </mesh>

      {/* Attack effect light */}
      {isAttacking && (
        <pointLight
          color={0xff3300}
          intensity={3}
          distance={5}
          position={[0, 0, 0.5]}
        />
      )}
    </group>
  );
}
