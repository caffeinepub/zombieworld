import { motion } from "motion/react";
import { useGameStore } from "./gameStore";

export function PauseScreen() {
  const { setGameState, score, wave, kills } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "oklch(0.04 0.005 25 / 0.85)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xs px-4"
      >
        <div
          className="rounded-sm p-6 text-center"
          style={{
            background: "oklch(0.08 0.01 25)",
            border: "1px solid oklch(0.52 0.22 22 / 0.4)",
          }}
        >
          <div
            className="text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: "oklch(0.52 0.22 22 / 0.7)" }}
          >
            ⏸ PAUSED
          </div>
          <h2
            className="game-font text-3xl font-black mb-4"
            style={{ color: "oklch(0.85 0.02 60)" }}
          >
            GAME PAUSED
          </h2>

          {/* Quick stats */}
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <div>
              <div
                className="text-xs tracking-wider uppercase"
                style={{ color: "oklch(0.45 0.02 50)" }}
              >
                Wave
              </div>
              <div
                className="font-bold game-font"
                style={{ color: "oklch(0.65 0.18 52)" }}
              >
                {wave}
              </div>
            </div>
            <div>
              <div
                className="text-xs tracking-wider uppercase"
                style={{ color: "oklch(0.45 0.02 50)" }}
              >
                Score
              </div>
              <div
                className="font-bold game-font"
                style={{ color: "oklch(0.72 0.22 22)" }}
              >
                {score}
              </div>
            </div>
            <div>
              <div
                className="text-xs tracking-wider uppercase"
                style={{ color: "oklch(0.45 0.02 50)" }}
              >
                Kills
              </div>
              <div
                className="font-bold game-font"
                style={{ color: "oklch(0.62 0.24 145)" }}
              >
                {kills}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              data-ocid="game.resume_button"
              onClick={() => setGameState("playing")}
              className="w-full py-3 rounded-sm font-bold text-sm tracking-[0.2em] uppercase transition-all duration-200"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.42 0.22 22), oklch(0.52 0.22 22))",
                border: "1px solid oklch(0.62 0.22 22 / 0.6)",
                color: "oklch(0.96 0.01 60)",
              }}
            >
              ▶ RESUME
            </button>

            <button
              type="button"
              onClick={() => setGameState("start")}
              className="w-full py-2.5 rounded-sm font-medium text-xs tracking-[0.2em] uppercase transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid oklch(0.25 0.02 25)",
                color: "oklch(0.5 0.02 50)",
              }}
            >
              QUIT TO MENU
            </button>
          </div>

          <div
            className="mt-4 text-xs"
            style={{ color: "oklch(0.35 0.02 50)" }}
          >
            Press ESC to resume
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
