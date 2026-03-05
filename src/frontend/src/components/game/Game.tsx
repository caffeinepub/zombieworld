import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "motion/react";
import { Suspense, useEffect, useRef, useState } from "react";
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

function isMobileDevice(): boolean {
  return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
}

function PortraitWarning() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());

    const mq = window.matchMedia("(orientation: portrait)");
    setIsPortrait(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!isMobile || !isPortrait) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
      }}
    >
      {/* Rotate icon */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Rotate device to landscape"
        style={{ color: "#ffffff" }}
      >
        {/* Phone outline in portrait */}
        <rect
          x="22"
          y="8"
          width="36"
          height="60"
          rx="5"
          stroke="white"
          strokeWidth="3"
          fill="none"
          opacity="0.5"
        />
        {/* Arrow indicating rotation */}
        <path
          d="M 66 28 A 30 30 0 0 1 28 66"
          stroke="white"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <polygon points="24,60 22,70 32,68" fill="white" />
      </svg>

      <div
        style={{
          color: "#ffffff",
          fontSize: "1.6rem",
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        Rotate your device
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: "1rem",
          textAlign: "center",
          maxWidth: "260px",
          lineHeight: 1.5,
        }}
      >
        This game is best in landscape mode
      </div>
    </div>
  );
}

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
        data-ocid="game.canvas_target"
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 65,
          near: 0.1,
          far: 250,
          position: [0, 5, 16],
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

      {/* Subtle vignette overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 5,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />

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

      {/* Portrait mode warning for mobile */}
      <PortraitWarning />
    </div>
  );
}
