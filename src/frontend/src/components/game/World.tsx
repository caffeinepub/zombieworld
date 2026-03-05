import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "./gameStore";

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
      {/* Atmospheric fog - light sky blue haze */}
      <fog attach="fog" args={[0xc8dff0, 80, 220]} />

      {/* Dramatic lower-angle daytime sky */}
      <Sky
        distance={450000}
        sunPosition={[50, 15, -80]}
        inclination={0.52}
        azimuth={0.22}
      />

      {/* Cooler ambient light */}
      <ambientLight color={0xd0e8ff} intensity={0.5} />

      {/* Sun directional light - stronger, softer shadows */}
      <directionalLight
        color={0xfff8d0}
        intensity={3.5}
        position={[100, 80, -100]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={250}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />

      {/* Warm secondary fill light */}
      <directionalLight
        color={0xffe8c0}
        intensity={0.6}
        position={[-80, 40, 80]}
        castShadow={false}
      />

      {/* Sky hemisphere */}
      <hemisphereLight args={[0x87ceeb, 0x4a7a2a, 0.4]} />

      {/* Campfire lights */}
      {campfirePositions.map((pos) => (
        <CampfireLight key={`fire-${pos[0]}-${pos[2]}`} position={pos} />
      ))}

      {/* Ground with rolling hills */}
      <Ground />

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
