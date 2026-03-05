import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "./gameStore";

const LERP_FACTOR = 0.1;
const AUTO_ROTATE_SPEED = 0.15; // radians per second

export function CameraController({
  cameraRef,
}: {
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
}) {
  const { camera } = useThree();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const cameraAngleRef = useRef({ yaw: 0, pitch: 0.3 });
  const lastInteractRef = useRef(0);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraRef.current = camera;
    }
  }, [camera, cameraRef]);

  // Touch camera drag
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as Element;
      if (target.closest(".joystick-zone") || target.closest(".attack-button"))
        return;
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      cameraAngleRef.current.yaw -= dx * 0.005;
      cameraAngleRef.current.pitch = Math.max(
        0.1,
        Math.min(1.0, cameraAngleRef.current.pitch + dy * 0.005),
      );
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      lastInteractRef.current = Date.now();
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // Mouse drag camera control (desktop)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left button only
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseStartRef.current) return;
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      cameraAngleRef.current.yaw -= dx * 0.005;
      cameraAngleRef.current.pitch = Math.max(
        0.1,
        Math.min(1.0, cameraAngleRef.current.pitch + dy * 0.005),
      );
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
      lastInteractRef.current = Date.now();
    };

    const onMouseUp = () => {
      mouseStartRef.current = null;
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useFrame((_, delta) => {
    const { playerPosition } = useGameStore.getState();

    const timeSinceInteract = (Date.now() - lastInteractRef.current) / 1000;
    if (timeSinceInteract > 2) {
      cameraAngleRef.current.yaw += AUTO_ROTATE_SPEED * delta;
    }

    const yaw = cameraAngleRef.current.yaw;
    const pitch = cameraAngleRef.current.pitch;
    const dist = 16;

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const offsetY = Math.sin(pitch) * dist;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;

    const desiredPos = new THREE.Vector3(
      playerPosition.x + offsetX,
      playerPosition.y + offsetY,
      playerPosition.z + offsetZ,
    );

    camera.position.lerp(desiredPos, LERP_FACTOR);
    camera.lookAt(playerPosition.x, playerPosition.y + 0.5, playerPosition.z);
  });

  return null;
}
