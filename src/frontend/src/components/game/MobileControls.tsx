import { useCallback, useRef } from "react";
import { useGameStore } from "./gameStore";

export function MobileControls() {
  const {
    setJoystickDelta,
    isAttacking,
    setIsAttacking,
    setLastAttackTime,
    updateZombie,
    addScore,
    addKill,
  } = useGameStore();
  const joystickRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const activeTouchId = useRef<number | null>(null);

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    e.stopPropagation();
  }, []);

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeTouchId.current,
      );
      if (!touch) return;

      const dx = touch.clientX - joystickCenter.current.x;
      const dy = touch.clientY - joystickCenter.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 40;
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);

      const normX = (clampedDist / maxDist) * Math.cos(angle);
      const normY = (clampedDist / maxDist) * Math.sin(angle);

      setJoystickDelta({ x: normX, y: normY });

      if (thumbRef.current) {
        thumbRef.current.style.transform = `translate(calc(-50% + ${normX * maxDist}px), calc(-50% + ${normY * maxDist}px))`;
      }

      e.stopPropagation();
    },
    [setJoystickDelta],
  );

  const handleJoystickEnd = useCallback(
    (e: React.TouchEvent) => {
      activeTouchId.current = null;
      setJoystickDelta({ x: 0, y: 0 });
      if (thumbRef.current) {
        thumbRef.current.style.transform = "translate(-50%, -50%)";
      }
      e.stopPropagation();
    },
    [setJoystickDelta],
  );

  const handleAttack = useCallback(() => {
    const now = performance.now() / 1000;
    const state = useGameStore.getState();
    if (now - state.lastAttackTime < 0.6) return;
    setIsAttacking(true);
    setLastAttackTime(now);

    const playerPos = state.playerPosition;
    for (const z of state.zombies) {
      const dist = playerPos.distanceTo(z.position);
      if (dist < 3 && !z.isDying) {
        const newHp = z.health - 25;
        if (newHp <= 0) {
          updateZombie(z.id, { isDying: true, deathTime: now });
          addScore(10);
          addKill();
        } else {
          updateZombie(z.id, { health: newHp });
        }
      }
    }

    setTimeout(() => setIsAttacking(false), 300);
  }, [setIsAttacking, setLastAttackTime, updateZombie, addScore, addKill]);

  return (
    <>
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        className="joystick-zone fixed z-50 md:hidden"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        <div ref={thumbRef} className="joystick-thumb" />
      </div>

      {/* Attack Button */}
      <button
        type="button"
        className="attack-button fixed bottom-20 right-6 z-50 md:hidden w-20 h-20 rounded-full flex items-center justify-center font-bold text-sm tracking-widest uppercase"
        style={{
          background: isAttacking
            ? "oklch(0.65 0.22 22)"
            : "oklch(0.45 0.22 22 / 0.85)",
          border: "2px solid oklch(0.65 0.22 22)",
          color: "oklch(0.95 0.02 60)",
          textShadow: "0 0 8px oklch(0.52 0.22 22)",
          boxShadow: isAttacking
            ? "0 0 20px oklch(0.52 0.22 22 / 0.8)"
            : "0 0 10px oklch(0.52 0.22 22 / 0.3)",
          transform: isAttacking ? "scale(0.95)" : "scale(1)",
          transition: "all 0.15s ease",
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          handleAttack();
        }}
      >
        ⚔
      </button>
    </>
  );
}
