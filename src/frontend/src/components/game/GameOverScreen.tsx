import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useLeaderboard, useSubmitScore } from "../../hooks/useQueries";
import { useGameStore } from "./gameStore";

export function GameOverScreen() {
  const {
    score,
    kills,
    wave,
    playerName,
    setPlayerName,
    resetGame,
    setGameState,
  } = useGameStore();
  const [name, setName] = useState(playerName || "");
  const [submitted, setSubmitted] = useState(false);
  const submitScore = useSubmitScore();
  useLeaderboard(10n);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setPlayerName(name);
    try {
      await submitScore.mutateAsync({
        name: name.trim(),
        score: BigInt(score),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Score submission failed:", err);
      setSubmitted(true); // Allow playing again anyway
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    setGameState("playing");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 overflow-auto py-4"
      style={{ background: "oklch(0.04 0.005 25 / 0.95)" }}
    >
      <div className="w-full max-w-md px-4">
        <div
          className="rounded-sm p-6"
          style={{
            background: "oklch(0.08 0.01 25)",
            border: "1px solid oklch(0.52 0.22 22 / 0.5)",
            boxShadow: "0 0 60px oklch(0.4 0.2 22 / 0.2)",
          }}
        >
          {/* Title */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center mb-6"
          >
            <div
              className="text-xs tracking-[0.4em] uppercase mb-2"
              style={{ color: "oklch(0.52 0.22 22 / 0.7)" }}
            >
              YOU HAVE FALLEN
            </div>
            <h2
              className="game-font font-black text-4xl text-glow-red"
              style={{
                color: "oklch(0.72 0.22 22)",
                textShadow: "0 0 30px oklch(0.52 0.22 22 / 0.5)",
              }}
            >
              GAME OVER
            </h2>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "SCORE",
                value: score.toLocaleString(),
                color: "oklch(0.72 0.22 22)",
              },
              { label: "KILLS", value: kills, color: "oklch(0.62 0.24 145)" },
              { label: "WAVE", value: wave, color: "oklch(0.65 0.18 52)" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="text-center px-3 py-3 rounded-sm"
                style={{ background: "oklch(0.12 0.01 25)" }}
              >
                <div
                  className="text-xs tracking-widest uppercase mb-1"
                  style={{ color: "oklch(0.45 0.02 50)" }}
                >
                  {label}
                </div>
                <div className="game-font text-xl font-bold" style={{ color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Score submission */}
          {!submitted ? (
            <div className="mb-4">
              <label
                htmlFor="survivor-name"
                className="block text-xs tracking-widest uppercase mb-2"
                style={{ color: "oklch(0.55 0.02 50)" }}
              >
                Record Your Name
              </label>
              <div className="flex gap-2">
                <input
                  id="survivor-name"
                  type="text"
                  placeholder="Survivor name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  className="flex-1 px-3 py-2.5 rounded-sm text-sm outline-none"
                  style={{
                    background: "oklch(0.1 0.01 25)",
                    border: "1px solid oklch(0.52 0.22 22 / 0.4)",
                    color: "oklch(0.9 0.02 60)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  type="button"
                  data-ocid="game.submit_button"
                  onClick={handleSubmit}
                  disabled={!name.trim() || submitScore.isPending}
                  className="px-4 py-2.5 rounded-sm text-sm font-bold tracking-wider uppercase transition-all"
                  style={{
                    background: name.trim()
                      ? "linear-gradient(135deg, oklch(0.45 0.22 22), oklch(0.55 0.22 22))"
                      : "oklch(0.15 0.02 25)",
                    border: "1px solid oklch(0.52 0.22 22 / 0.5)",
                    color: name.trim()
                      ? "oklch(0.95 0.01 60)"
                      : "oklch(0.4 0.02 50)",
                    cursor: name.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  {submitScore.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "SUBMIT"
                  )}
                </button>
              </div>
              {submitScore.isError && (
                <p
                  data-ocid="game.submit_error_state"
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.62 0.22 22)" }}
                >
                  Failed to submit. Score may not be saved.
                </p>
              )}
            </div>
          ) : (
            <div
              data-ocid="game.submit_success_state"
              className="mb-4 text-center py-3 rounded-sm text-sm"
              style={{
                background: "oklch(0.42 0.2 145 / 0.15)",
                border: "1px solid oklch(0.5 0.2 145 / 0.3)",
                color: "oklch(0.72 0.2 145)",
              }}
            >
              ✓ Score recorded!
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              type="button"
              data-ocid="game.restart_button"
              onClick={handlePlayAgain}
              className="w-full py-3.5 rounded-sm font-bold text-sm tracking-[0.25em] uppercase transition-all duration-200"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.42 0.22 22), oklch(0.52 0.22 22))",
                border: "1px solid oklch(0.62 0.22 22 / 0.6)",
                color: "oklch(0.96 0.01 60)",
                boxShadow: "0 0 15px oklch(0.42 0.22 22 / 0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 30px oklch(0.42 0.22 22 / 0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 15px oklch(0.42 0.22 22 / 0.25)";
              }}
            >
              ↺ PLAY AGAIN
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.35 0.04 25)";
                (e.currentTarget as HTMLElement).style.color =
                  "oklch(0.65 0.02 50)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "oklch(0.25 0.02 25)";
                (e.currentTarget as HTMLElement).style.color =
                  "oklch(0.5 0.02 50)";
              }}
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
