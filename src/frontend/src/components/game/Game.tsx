import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "motion/react";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { CameraController } from "./Camera";
import { GameOverScreen } from "./GameOverScreen";
import { HUD } from "./HUD";
import { MobileControls } from "./MobileControls";
import { PauseScreen } from "./PauseScreen";
import { Player } from "./Player";
import { StartScreen } from "./StartScreen";
import { World } from "./World";
import { ZombieSystem } from "./Zombies";
import { useGameStore } from "./gameStore";
import { generateWorld } from "./worldGen";

function GameScene({
  cameraRef,
}: {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}) {
  const { gameState } = useGameStore();

  return (
    <>
      <CameraController cameraRef={cameraRef} />
      <World />
      {(gameState === "playing" || gameState === "paused") && (
        <>
          <Player cameraRef={cameraRef} />
          <ZombieSystem />
        </>
      )}
    </>
  );
}

export function Game() {
  const { gameState, setEnvObjects } = useGameStore();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Generate world once
  useEffect(() => {
    const objects = generateWorld();
    setEnvObjects(objects);
  }, [setEnvObjects]);

  return (
    <div
      className="w-full h-full relative select-none"
      style={{ background: "#87ceeb" }}
    >
      {/* 3D Canvas - always rendered */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 65,
          near: 0.1,
          far: 200,
          position: [0, 5, 12],
        }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={null}>
          <GameScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>

      {/* Scanlines overlay for gritty feel */}
      <div className="fixed inset-0 pointer-events-none z-5 scanlines" />

      {/* HUD - only during play/pause */}
      {(gameState === "playing" || gameState === "paused") && <HUD />}

      {/* Mobile controls */}
      {gameState === "playing" && <MobileControls />}

      {/* Screen overlays */}
      <AnimatePresence mode="wait">
        {gameState === "start" && <StartScreen key="start" />}
        {gameState === "gameover" && <GameOverScreen key="gameover" />}
        {gameState === "paused" && <PauseScreen key="paused" />}
      </AnimatePresence>
    </div>
  );
}
