import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "./gameStore";

export function HUD() {
  const { playerHealth, score, kills, wave, isWaveTransition, waveCountdown } =
    useGameStore();
  const [damageFlash, setDamageFlash] = useState(false);
  const prevHealthRef = useRef(100);

  useEffect(() => {
    if (playerHealth < prevHealthRef.current) {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
    }
    prevHealthRef.current = playerHealth;
  }, [playerHealth]);

  const healthPercent = Math.max(0, playerHealth);
  const healthColor =
    healthPercent > 60
      ? "oklch(0.52 0.22 22)"
      : healthPercent > 30
        ? "oklch(0.65 0.2 52)"
        : "oklch(0.52 0.22 22)";

  return (
    <>
      {/* Damage flash overlay */}
      <AnimatePresence>
        {damageFlash && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 pointer-events-none z-20"
            style={{ background: "oklch(0.4 0.2 22 / 0.4)" }}
          />
        )}
      </AnimatePresence>

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-10 vignette" />

      {/* Health Bar - Top Left */}
      <div
        data-ocid="hud.health_state"
        className="fixed top-4 left-4 z-30 hud-panel rounded px-3 py-2 min-w-[180px]"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold tracking-widest uppercase text-red-400/80">
            ❤ HEALTH
          </span>
          <span
            className={`text-xs font-bold ml-auto ${playerHealth <= 30 ? "text-red-500 flicker" : "text-red-300"}`}
          >
            {playerHealth}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: "oklch(0.15 0.02 25)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${healthPercent}%`,
              background: `linear-gradient(90deg, oklch(0.38 0.22 22), ${healthColor})`,
              boxShadow: `0 0 8px ${healthColor}`,
            }}
          />
        </div>
      </div>

      {/* Wave & Kills - Top Right */}
      <div
        data-ocid="hud.wave_panel"
        className="fixed top-4 right-4 z-30 hud-panel rounded px-3 py-2 text-right"
      >
        <div
          className="text-xs tracking-widest uppercase"
          style={{ color: "oklch(0.65 0.18 52)" }}
        >
          WAVE
        </div>
        <div
          className="text-2xl font-bold game-font leading-none"
          style={{
            color: "oklch(0.75 0.18 52)",
            textShadow: "0 0 15px oklch(0.65 0.18 52 / 0.6)",
          }}
        >
          {wave}
        </div>
        <div
          className="text-xs tracking-widest uppercase mt-1"
          style={{ color: "oklch(0.58 0.03 50)" }}
        >
          KILLS: <span style={{ color: "oklch(0.72 0.2 145)" }}>{kills}</span>
        </div>
      </div>

      {/* Score - Bottom Center */}
      <div
        data-ocid="hud.score_panel"
        className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 hud-panel rounded px-4 py-2 text-center"
      >
        <div
          className="text-xs tracking-widest uppercase mb-1"
          style={{ color: "oklch(0.58 0.03 50)" }}
        >
          SCORE
        </div>
        <div
          className="text-xl font-bold game-font"
          style={{
            color: "oklch(0.75 0.22 22)",
            textShadow: "0 0 20px oklch(0.52 0.22 22 / 0.6)",
          }}
        >
          {score.toString().padStart(6, "0")}
        </div>
      </div>

      {/* Controls - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30 hud-panel rounded px-3 py-2 text-xs hidden md:block">
        <div
          className="text-xs tracking-widest uppercase mb-1"
          style={{ color: "oklch(0.58 0.03 50)" }}
        >
          CONTROLS
        </div>
        <div style={{ color: "oklch(0.7 0.02 60)" }} className="space-y-0.5">
          <div>
            <kbd className="text-amber-400/80">WASD</kbd> Move
          </div>
          <div>
            <kbd className="text-amber-400/80">Click/Space</kbd> Attack
          </div>
          <div>
            <kbd className="text-amber-400/80">ESC</kbd> Pause
          </div>
        </div>
      </div>

      {/* Wave Transition Announcement */}
      <AnimatePresence>
        {isWaveTransition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <div className="text-center">
              <div
                className="game-font text-5xl font-black mb-2 text-glow-green"
                style={{ color: "oklch(0.72 0.2 145)" }}
              >
                WAVE CLEARED!
              </div>
              <div
                className="game-font text-3xl font-bold text-glow-red"
                style={{ color: "oklch(0.75 0.22 22)" }}
              >
                Next wave in {waveCountdown}...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
