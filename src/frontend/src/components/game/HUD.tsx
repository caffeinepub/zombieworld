import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActivePlayers } from "../../hooks/useQueries";
import { useGameStore } from "./gameStore";

function getDayLabel(dayTime: number): { label: string; icon: string } {
  if (dayTime >= 0.2 && dayTime < 0.35) return { label: "DAWN", icon: "🌅" };
  if (dayTime >= 0.35 && dayTime <= 0.65) return { label: "DAY", icon: "☀️" };
  if (dayTime > 0.65 && dayTime <= 0.8) return { label: "DUSK", icon: "🌇" };
  return { label: "NIGHT", icon: "🌙" };
}

function getWeaponIcon(weapon: string): string {
  if (weapon === "rifle") return "🔫";
  if (weapon === "shotgun") return "💥";
  return "🥊";
}

export function HUD() {
  const {
    playerHealth,
    score,
    kills,
    wave,
    isWaveTransition,
    waveCountdown,
    currentWeapon,
    rifleAmmo,
    shotgunAmmo,
    dayTime,
  } = useGameStore();

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

  // Ammo display
  const ammo =
    currentWeapon === "rifle"
      ? rifleAmmo
      : currentWeapon === "shotgun"
        ? shotgunAmmo
        : null;
  const isLowAmmo =
    (currentWeapon === "rifle" && rifleAmmo <= 5 && rifleAmmo > 0) ||
    (currentWeapon === "shotgun" && shotgunAmmo <= 5 && shotgunAmmo > 0);
  const isOutOfAmmo =
    (currentWeapon === "rifle" && rifleAmmo <= 0) ||
    (currentWeapon === "shotgun" && shotgunAmmo <= 0);

  const { label: dayLabel, icon: dayIcon } = getDayLabel(dayTime);
  const isNight = dayTime < 0.2 || dayTime > 0.8;

  const { data: activePlayers } = useActivePlayers();

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

      {/* Weapon Panel - Below Health */}
      <div
        data-ocid="hud.weapon_panel"
        className="fixed top-[80px] left-4 z-30 hud-panel rounded px-3 py-2 min-w-[180px]"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">
            {getWeaponIcon(currentWeapon)}
          </span>
          <div className="flex-1">
            <div
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "oklch(0.72 0.18 52)" }}
            >
              {currentWeapon.toUpperCase()}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {ammo !== null ? (
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isOutOfAmmo
                      ? "text-red-500 flicker"
                      : isLowAmmo
                        ? "text-yellow-400 flicker"
                        : "text-white/80"
                  }`}
                >
                  {isOutOfAmmo ? "EMPTY" : `AMMO: ${ammo}`}
                </span>
              ) : (
                <span
                  className="text-xs"
                  style={{ color: "oklch(0.5 0.05 80)" }}
                >
                  MELEE
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Weapon key hints */}
        <div
          className="flex gap-1 mt-1.5 text-[10px]"
          style={{ color: "oklch(0.45 0.05 80)" }}
        >
          <span
            className={`px-1 rounded ${currentWeapon === "fists" ? "bg-amber-500/30 text-amber-300" : ""}`}
          >
            1:🥊
          </span>
          <span
            className={`px-1 rounded ${currentWeapon === "rifle" ? "bg-amber-500/30 text-amber-300" : ""}`}
          >
            2:🔫
          </span>
          <span
            className={`px-1 rounded ${currentWeapon === "shotgun" ? "bg-amber-500/30 text-amber-300" : ""}`}
          >
            3:💥
          </span>
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

      {/* Day/Night Indicator - Top Center */}
      <div
        data-ocid="hud.daytime_panel"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-30 hud-panel rounded px-3 py-2 text-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{dayIcon}</span>
          <div>
            <div
              className="text-xs font-bold tracking-widest uppercase leading-none"
              style={{
                color: isNight ? "oklch(0.75 0.1 240)" : "oklch(0.75 0.18 75)",
                textShadow: isNight
                  ? "0 0 10px oklch(0.5 0.15 240 / 0.6)"
                  : "0 0 10px oklch(0.65 0.2 75 / 0.6)",
              }}
            >
              {dayLabel}
            </div>
            {isNight && (
              <div
                className="text-[10px] tracking-wider"
                style={{ color: "oklch(0.55 0.1 22)" }}
              >
                ZOMBIES FASTER!
              </div>
            )}
          </div>
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

      {/* Playing Now - Bottom Left */}
      <div
        data-ocid="hud.active_players.panel"
        className="fixed bottom-4 left-4 z-30 hud-panel rounded px-3 py-2 text-center"
      >
        <div
          className="text-[10px] tracking-widest uppercase mb-0.5"
          style={{ color: "oklch(0.58 0.03 50)" }}
        >
          PLAYING NOW
        </div>
        <div
          className="text-base font-bold game-font leading-none"
          style={{
            color: "oklch(0.75 0.22 22)",
            textShadow: "0 0 12px oklch(0.52 0.22 22 / 0.7)",
          }}
        >
          {activePlayers !== undefined
            ? Number(activePlayers).toLocaleString()
            : "—"}
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
            <kbd className="text-amber-400/80">1/2/3</kbd> Weapon
          </div>
          <div>
            <kbd className="text-amber-400/80">Scroll</kbd> Cycle
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
