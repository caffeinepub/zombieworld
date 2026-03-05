import { Sky } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "./gameStore";
import type { WeaponPickup } from "./gameStore";

// Deterministic pseudo-random from position hash
function posHash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Ground plane with rolling hills via vertex displacement
function Ground() {
  const geoRef = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    const geo = geoRef.current;
    if (!geo) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        Math.sin(x * 0.04) * Math.cos(z * 0.035) * 1.4 +
        Math.sin(x * 0.09 + z * 0.06) * 0.7 +
        Math.cos(x * 0.055 - z * 0.08) * 0.5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4a7a2a),
        roughness: 0.95,
        metalness: 0.0,
      }),
    [],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry ref={geoRef} args={[400, 400, 80, 80]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// Wall color palette for buildings
const WALL_COLORS = [0x8a7560, 0x7a6550, 0x9a8570, 0x6a5540];

function Building({
  position,
  size,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
}) {
  const colorIndex =
    Math.floor(
      Math.abs(posHash(position[0], position[2]) * WALL_COLORS.length),
    ) % WALL_COLORS.length;

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(WALL_COLORS[colorIndex]),
        roughness: 0.85,
        metalness: 0.05,
      }),
    [colorIndex],
  );

  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4a3520),
        roughness: 0.9,
        metalness: 0.02,
      }),
    [],
  );

  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1a2a3a),
        roughness: 0.4,
        metalness: 0.3,
      }),
    [],
  );

  const roofY = position[1] + size[1] / 2 + 0.08;
  const roofThickness = 0.16;

  // Place 1–2 windows on front face
  const numWindows = size[0] >= 6 ? 2 : 1;
  const winW = Math.min(1.2, size[0] * 0.25);
  const winH = Math.min(1.4, size[1] * 0.3);
  const winDepth = 0.06;
  const winY = position[1] + size[1] * 0.1;
  const winZ = position[2] - size[2] / 2 - 0.01;

  return (
    <group rotation={[0, rotation, 0]}>
      {/* Main wall body */}
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Roof cap */}
      <mesh
        position={[position[0], roofY, position[2]]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[size[0] + 0.4, roofThickness, size[2] + 0.4]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Windows */}
      {Array.from({ length: numWindows }).map((_, wi) => {
        const offsetX =
          numWindows === 1
            ? position[0]
            : position[0] + (wi === 0 ? -size[0] * 0.22 : size[0] * 0.22);
        const wKey = `win-${position[0]}-${position[2]}-${wi}`;
        return (
          <mesh key={wKey} position={[offsetX, winY, winZ]} castShadow={false}>
            <boxGeometry args={[winW, winH, winDepth]} />
            <primitive object={windowMat} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}

// Tree with multi-layer pine foliage
function Tree({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const treeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4a3520),
        roughness: 0.95,
      }),
    [],
  );

  const foliageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2e6b1a),
        roughness: 0.9,
      }),
    [],
  );

  const trunkH = size[1];
  const trunkR = size[0] * 0.8;

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow>
        <cylinderGeometry args={[trunkR * 0.5, trunkR * 0.7, trunkH, 6]} />
        <primitive object={treeMat} attach="material" />
      </mesh>

      {/* Foliage layer 1 - bottom (widest) */}
      <mesh position={[0, trunkH * 0.5, 0]} castShadow>
        <coneGeometry args={[size[0] * 3.0, trunkH * 0.7, 7]} />
        <primitive object={foliageMat} attach="material" />
      </mesh>

      {/* Foliage layer 2 - middle */}
      <mesh position={[0, trunkH * 0.8, 0]} castShadow>
        <coneGeometry args={[size[0] * 2.3, trunkH * 0.6, 7]} />
        <primitive object={foliageMat} attach="material" />
      </mesh>

      {/* Foliage layer 3 - top (narrowest) */}
      <mesh position={[0, trunkH * 1.1, 0]} castShadow>
        <coneGeometry args={[size[0] * 1.5, trunkH * 0.5, 7]} />
        <primitive object={foliageMat} attach="material" />
      </mesh>
    </group>
  );
}

// Rock boulder with organic scale variation
function Rock({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const rockMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x7a7060),
        roughness: 0.92,
        metalness: 0.1,
      }),
    [],
  );

  const h = posHash(position[0], position[2]);
  const h2 = posHash(position[0] + 1, position[2] - 1);
  const scaleX = 0.8 + h * 0.6;
  const scaleY = 0.6 + h2 * 0.5;
  const scaleZ = 0.75 + (1 - h) * 0.55;

  return (
    <mesh
      position={position}
      scale={[scaleX, scaleY, scaleZ]}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[size[0] / 2, 1]} />
      <primitive object={rockMat} attach="material" />
    </mesh>
  );
}

// Barricade
function Barricade({
  position,
  size,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
}) {
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x6b4a22),
        roughness: 0.92,
      }),
    [],
  );

  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow>
      <boxGeometry args={size} />
      <primitive object={woodMat} attach="material" />
    </mesh>
  );
}

// Campfire point light (flickers)
function CampfireLight({
  position,
}: {
  position: [number, number, number];
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.intensity =
        1.5 + Math.sin(t * 7.3) * 0.5 + Math.sin(t * 13.7) * 0.2;
    }
  });

  return (
    <>
      <pointLight
        ref={lightRef}
        position={position}
        color={0xff6020}
        intensity={2}
        distance={12}
        castShadow={false}
      />
      <mesh position={position}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={0xff6020}
          emissive={0xff4000}
          emissiveIntensity={3}
        />
      </mesh>
    </>
  );
}

// Weapon pickup item that bobs and glows
function WeaponPickupMesh({ pickup }: { pickup: WeaponPickup }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 1.5;
      meshRef.current.position.y = pickup.position[1] + Math.sin(t * 2) * 0.15;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(t * 3) * 0.4;
    }
  });

  const isRifle = pickup.type === "rifle";
  const color = isRifle ? 0xffff00 : 0x00ffff;
  const geomArgs: [number, number, number] = isRifle
    ? [0.8, 0.1, 0.15]
    : [0.5, 0.1, 0.25];

  return (
    <group position={pickup.position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={geomArgs} />
        <meshStandardMaterial
          color={isRifle ? 0x887700 : 0x007788}
          emissive={color}
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={color}
        intensity={1.5}
        distance={4}
        castShadow={false}
      />
    </group>
  );
}

// All weapon pickups
function WeaponPickups() {
  const { weaponPickups, setWeaponPickups } = useGameStore();

  // Fixed pickup positions spread across the map
  useEffect(() => {
    const initialPickups: WeaponPickup[] = [
      // Rifle pickups (6)
      { id: "rifle_1", type: "rifle", position: [20, 1.5, 15] },
      { id: "rifle_2", type: "rifle", position: [-30, 1.5, 20] },
      { id: "rifle_3", type: "rifle", position: [45, 1.5, -25] },
      { id: "rifle_4", type: "rifle", position: [-15, 1.5, -40] },
      { id: "rifle_5", type: "rifle", position: [60, 1.5, 35] },
      { id: "rifle_6", type: "rifle", position: [-50, 1.5, -10] },
      // Shotgun pickups (4)
      { id: "shotgun_1", type: "shotgun", position: [10, 1.5, -20] },
      { id: "shotgun_2", type: "shotgun", position: [-40, 1.5, 35] },
      { id: "shotgun_3", type: "shotgun", position: [35, 1.5, -50] },
      { id: "shotgun_4", type: "shotgun", position: [-25, 1.5, 50] },
    ];
    setWeaponPickups(initialPickups);
  }, [setWeaponPickups]);

  return (
    <>
      {weaponPickups.map((pickup) => (
        <WeaponPickupMesh key={pickup.id} pickup={pickup} />
      ))}
    </>
  );
}

// Dynamic sky that updates sun position at a slower cadence
function DynamicSky() {
  const [sunPos, setSunPos] = useState<[number, number, number]>([50, 15, -80]);
  const frameCountRef = useRef(0);
  const dayTimeRef = useRef(useGameStore.getState().dayTime);

  useFrame(() => {
    frameCountRef.current++;
    // Update sky sun position every 30 frames (~0.5s) to avoid re-render overhead
    if (frameCountRef.current % 30 === 0) {
      const t = dayTimeRef.current;
      const angle = (t - 0.25) * Math.PI * 2;
      const sunX = Math.cos(angle) * 100;
      const sunY = Math.sin(angle) * 80;
      setSunPos([sunX, sunY, -60]);
    }
    // Keep local ref in sync with store
    dayTimeRef.current = useGameStore.getState().dayTime;
  });

  return (
    <Sky
      distance={450000}
      sunPosition={sunPos}
      inclination={0.52}
      azimuth={0.22}
    />
  );
}

// Dynamic day/night sky + lighting
function DayNightSystem() {
  const { scene } = useThree();
  const dayTimeRef = useRef(useGameStore.getState().dayTime);

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    // Init fog
    scene.fog = new THREE.Fog(0xc8dff0, 80, 220);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    // Advance time
    let t = dayTimeRef.current + delta / 120;
    if (t > 1) t -= 1;
    dayTimeRef.current = t;
    useGameStore.getState().setDayTime(t);

    // Sun angle: t=0.25 sunrise, t=0.5 noon, t=0.75 sunset
    const angle = (t - 0.25) * Math.PI * 2;
    const sunX = Math.cos(angle) * 100;
    const sunY = Math.sin(angle) * 80;
    const sunZ = -60;

    // Compute day factor: 0=night, 1=full day
    let dayFactor: number;
    if (t >= 0.2 && t <= 0.8) {
      dayFactor = Math.sin(((t - 0.2) / 0.6) * Math.PI);
    } else {
      dayFactor = 0;
    }
    dayFactor = Math.max(0, Math.min(1, dayFactor));

    // Ambient light
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        0.05,
        0.55,
        dayFactor,
      );
    }

    // Sun directional light
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(0, 3.5, dayFactor);
      sunRef.current.position.set(sunX, sunY, sunZ);
      // Color shifts: day=warm white, dusk/dawn=orange
      const duskFactor = 1 - Math.abs(t - 0.5) * 4; // peaks at noon
      const r = 1.0;
      const g = THREE.MathUtils.lerp(0.5, 0.97, Math.max(0, duskFactor));
      const b = THREE.MathUtils.lerp(0.2, 0.82, dayFactor);
      sunRef.current.color.setRGB(r, g, b);
    }

    // Moon directional light (opposite sun)
    if (moonRef.current) {
      moonRef.current.intensity = THREE.MathUtils.lerp(0.3, 0, dayFactor);
      moonRef.current.position.set(-sunX, -sunY, sunZ);
    }

    // Hemisphere light sky color
    if (hemiRef.current) {
      const skyR = THREE.MathUtils.lerp(0.04, 0.53, dayFactor);
      const skyG = THREE.MathUtils.lerp(0.04, 0.81, dayFactor);
      const skyB = THREE.MathUtils.lerp(0.16, 0.92, dayFactor);
      hemiRef.current.color.setRGB(skyR, skyG, skyB);
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.1, 0.4, dayFactor);
    }

    // Fog: night = closer/spookier
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      scene.fog.near = THREE.MathUtils.lerp(30, 80, dayFactor);
      scene.fog.far = THREE.MathUtils.lerp(120, 220, dayFactor);
      // Fog color: night=dark blue, day=sky blue
      const fogR = THREE.MathUtils.lerp(0.02, 0.78, dayFactor);
      const fogG = THREE.MathUtils.lerp(0.02, 0.87, dayFactor);
      const fogB = THREE.MathUtils.lerp(0.12, 0.94, dayFactor);
      scene.fog.color.setRGB(fogR, fogG, fogB);
    }

    // Moon mesh: opposite the sun, visible at night
    if (moonMeshRef.current) {
      const moonX = (-sunX / 100) * 80;
      const moonY = (-sunY / 80) * 60;
      moonMeshRef.current.position.set(moonX, moonY, sunZ);
      moonMeshRef.current.visible = sunY < 10; // visible near/during night
      const moonIntensity = THREE.MathUtils.lerp(1.5, 0, dayFactor);
      const moonMat = moonMeshRef.current
        .material as THREE.MeshStandardMaterial;
      moonMat.emissiveIntensity = moonIntensity;
    }
  });

  return (
    <>
      {/* Dynamic sky */}
      <DynamicSky />

      {/* Ambient light */}
      <ambientLight ref={ambientRef} color={0xd0e8ff} intensity={0.3} />

      {/* Sun directional light */}
      <directionalLight
        ref={sunRef}
        color={0xfff8d0}
        intensity={2}
        position={[50, 15, -80]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={250}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />

      {/* Moon directional light */}
      <directionalLight
        ref={moonRef}
        color={0x8899cc}
        intensity={0.3}
        position={[-50, -15, -80]}
        castShadow={false}
      />

      {/* Hemisphere light */}
      <hemisphereLight ref={hemiRef} args={[0x87ceeb, 0x4a7a2a, 0.3]} />

      {/* Moon mesh */}
      <mesh ref={moonMeshRef} position={[-50, -10, -60]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshStandardMaterial
          color={0xeeeeff}
          emissive={0xccccff}
          emissiveIntensity={1.5}
          roughness={0.8}
        />
      </mesh>
    </>
  );
}

// Main World component
export function World() {
  const envObjects = useGameStore((s) => s.envObjects);

  const campfirePositions: Array<[number, number, number]> = [
    [15, 0.3, 12],
    [-20, 0.3, -18],
    [30, 0.3, -25],
    [-35, 0.3, 20],
  ];

  return (
    <>
      {/* Dynamic day/night lighting + sky */}
      <DayNightSystem />

      {/* Campfire lights */}
      {campfirePositions.map((pos) => (
        <CampfireLight key={`fire-${pos[0]}-${pos[2]}`} position={pos} />
      ))}

      {/* Ground with rolling hills */}
      <Ground />

      {/* Weapon pickups */}
      <WeaponPickups />

      {/* Environment objects */}
      {envObjects.map((obj) => {
        switch (obj.type) {
          case "building":
            return (
              <Building
                key={obj.id}
                position={obj.position}
                size={obj.size}
                rotation={obj.rotation}
              />
            );
          case "tree":
            return (
              <Tree key={obj.id} position={obj.position} size={obj.size} />
            );
          case "rock":
            return (
              <Rock key={obj.id} position={obj.position} size={obj.size} />
            );
          case "barricade":
            return (
              <Barricade
                key={obj.id}
                position={obj.position}
                size={obj.size}
                rotation={obj.rotation}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
