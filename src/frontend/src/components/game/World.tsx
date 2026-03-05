import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "./gameStore";

// Ground plane with grass/dirt look
function Ground() {
  const groundMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x4a7a2a),
      roughness: 0.9,
      metalness: 0.0,
    });
    return mat;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[400, 400]} />
      <primitive object={groundMat} attach="material" />
    </mesh>
  );
}

// Building mesh
function Building({
  position,
  size,
  rotation = 0,
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: number;
}) {
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8a7560),
        roughness: 0.85,
        metalness: 0.05,
      }),
    [],
  );

  return (
    <mesh
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <primitive object={wallMat} attach="material" />
    </mesh>
  );
}

// Tree with foliage
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

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow>
        <cylinderGeometry
          args={[size[0] / 2, (size[2] / 2) * 1.4, size[1], 5]}
        />
        <primitive object={treeMat} attach="material" />
      </mesh>
      {/* Foliage cone */}
      <mesh position={[0, size[1] * 0.7, 0]} castShadow>
        <coneGeometry args={[size[0] * 2.5, size[1] * 1.2, 7]} />
        <primitive object={foliageMat} attach="material" />
      </mesh>
    </group>
  );
}

// Rock boulder
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

  return (
    <mesh position={position} castShadow receiveShadow>
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
      {/* Ember glow sphere */}
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
      {/* Fog - light blue daytime haze */}
      <fog attach="fog" args={[0x87ceeb, 60, 180]} />

      {/* Daytime Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, -100]}
        inclination={0.6}
        azimuth={0.25}
      />

      {/* Daytime Lighting */}
      <ambientLight color={0xfff5e0} intensity={0.7} />
      {/* Sun directional light */}
      <directionalLight
        color={0xfff8d0}
        intensity={2.2}
        position={[100, 80, -100]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      {/* Fill light from the sky */}
      <hemisphereLight args={[0x87ceeb, 0x4a7a2a, 0.5]} />

      {/* Campfire lights (dimmer in daytime) */}
      {campfirePositions.map((pos) => (
        <CampfireLight key={`fire-${pos[0]}-${pos[2]}`} position={pos} />
      ))}

      {/* Ground */}
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
