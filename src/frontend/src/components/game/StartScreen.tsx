import { motion } from "motion/react";
import { useState } from "react";
import {
  useLeaderboard,
  useRecordPlayerJoin,
  useTotalPlayersJoined,
} from "../../hooks/useQueries";
import { useGameStore } from "./gameStore";

function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const { data: scores, isLoading } = useLeaderboard(10n);

  return (
    <motion.div
      data-ocid="leaderboard.panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "oklch(0.04 0.005 25 / 0.97)" }}
    >
      <div
        className="w-full max-w-md rounded-sm p-6"
        style={{
          background: "oklch(0.08 0.01 25)",
          border: "1px solid oklch(0.52 0.22 22 / 0.5)",
          boxShadow: "0 0 40px oklch(0.52 0.22 22 / 0.15)",
        }}
      >
        <div className="text-center mb-6">
          <h2
            className="game-font text-3xl font-black tracking-wider text-glow-red"
            style={{ color: "oklch(0.72 0.22 22)" }}
          >
            LEADERBOARD
          </h2>
          <div
            className="text-xs tracking-widest mt-1"
            style={{ color: "oklch(0.5 0.03 50)" }}
          >
            TOP SURVIVORS
          </div>
        </div>

        {isLoading ? (
          <div
            data-ocid="leaderboard.loading_state"
            className="text-center py-8"
          >
            <div
              className="text-sm tracking-widest animate-pulse"
              style={{ color: "oklch(0.58 0.03 50)" }}
            >
              LOADING...
            </div>
          </div>
        ) : (
          <div className="space-y-2 leaderboard-scroll overflow-y-auto max-h-72">
            {scores && scores.length > 0 ? (
              scores.slice(0, 10).map((score, i) => (
                <div
                  key={`lb-${score.playerName}-${i}`}
                  data-ocid={`leaderboard.item.${i + 1}` as string}
                  className="flex items-center gap-3 px-3 py-2 rounded-sm"
                  style={{
                    background:
                      i === 0
                        ? "oklch(0.52 0.22 22 / 0.15)"
                        : "oklch(0.12 0.01 25)",
                    border: `1px solid ${i === 0 ? "oklch(0.52 0.22 22 / 0.4)" : "oklch(0.18 0.02 25)"}`,
                  }}
                >
                  <span
                    className="w-6 text-center font-bold game-font text-sm"
                    style={{
                      color:
                        i === 0
                          ? "oklch(0.72 0.18 52)"
                          : i === 1
                            ? "oklch(0.75 0.02 60)"
                            : i === 2
                              ? "oklch(0.62 0.1 52)"
                              : "oklch(0.45 0.02 50)",
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm font-medium truncate"
                    style={{ color: "oklch(0.85 0.02 60)" }}
                  >
                    {score.playerName || "Unknown"}
                  </span>
                  <span
                    className="font-bold game-font text-sm"
                    style={{ color: "oklch(0.72 0.22 22)" }}
                  >
                    {Number(score.score).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div
                data-ocid="leaderboard.empty_state"
                className="text-center py-8 text-sm"
                style={{ color: "oklch(0.45 0.02 50)" }}
              >
                No survivors recorded yet.
                <br />
                Be the first!
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          data-ocid="leaderboard.close_button"
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-sm text-sm font-bold tracking-widest uppercase transition-all duration-200"
          style={{
            background: "oklch(0.15 0.02 25)",
            border: "1px solid oklch(0.52 0.22 22 / 0.4)",
            color: "oklch(0.75 0.22 22)",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background =
              "oklch(0.52 0.22 22 / 0.2)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "oklch(0.15 0.02 25)";
          }}
        >
          BACK
        </button>
      </div>
    </motion.div>
  );
}

export function StartScreen() {
  const { setGameState, playerName, setPlayerName, resetGame } = useGameStore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGoogleNote, setShowGoogleNote] = useState(false);
  const { data: totalPlayers, isLoading: isLoadingPlayers } =
    useTotalPlayersJoined();
  const recordPlayerJoin = useRecordPlayerJoin();

  const handleStart = () => {
    recordPlayerJoin.mutate();
    resetGame();
    setGameState("playing");
  };

  if (showLeaderboard) {
    return <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
      style={{ background: "oklch(0.04 0.005 25 / 0.96)" }}
    >
      {/* Background noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px",
        }}
      />

      {/* Animated blood drip lines */}
      <div
        className="absolute top-0 left-0 w-full h-1 opacity-40"
        style={{ background: "oklch(0.45 0.22 22)" }}
      />

      <div className="relative z-10 text-center px-4 max-w-lg w-full">
        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs tracking-[0.4em] uppercase mb-4"
          style={{ color: "oklch(0.52 0.22 22)" }}
        >
          ☣ OUTBREAK PROTOCOL ☣
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 12 }}
          className="game-font font-black leading-none mb-3"
          style={{
            fontSize: "clamp(3rem, 12vw, 6rem)",
            color: "oklch(0.88 0.02 60)",
            textShadow: `
              0 0 20px oklch(0.52 0.22 22 / 0.6),
              0 0 60px oklch(0.52 0.22 22 / 0.3),
              2px 2px 0 oklch(0.3 0.15 22)
            `,
          }}
        >
          ZOMBIE
          <br />
          <span
            style={{
              color: "oklch(0.62 0.24 22)",
              textShadow: `
                0 0 30px oklch(0.52 0.22 22 / 0.8),
                0 0 80px oklch(0.52 0.22 22 / 0.4)
              `,
            }}
          >
            WORLD
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm tracking-[0.2em] uppercase mb-8"
          style={{ color: "oklch(0.55 0.03 50)" }}
        >
          Save humanity. Kill them all.
        </motion.p>

        {/* Players Joined Counter */}
        <motion.div
          data-ocid="game.players_joined.panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col items-center gap-1 mb-6 py-3 rounded-sm"
          style={{
            background: "oklch(0.07 0.01 25)",
            border: "1px solid oklch(0.52 0.22 22 / 0.2)",
          }}
        >
          <div
            className="text-[10px] tracking-[0.4em] uppercase"
            style={{ color: "oklch(0.48 0.03 50)" }}
          >
            SURVIVORS JOINED
          </div>
          <div
            className="game-font font-black text-4xl leading-none tabular-nums"
            style={{
              color: "oklch(0.72 0.22 22)",
              textShadow:
                "0 0 20px oklch(0.52 0.22 22 / 0.7), 0 0 50px oklch(0.52 0.22 22 / 0.3)",
            }}
          >
            {isLoadingPlayers || totalPlayers === undefined
              ? "---"
              : Number(totalPlayers).toLocaleString()}
          </div>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.52 0.22 22 / 0.3)" }}
          />
          <div
            className="text-xs"
            style={{ color: "oklch(0.52 0.22 22 / 0.6)" }}
          >
            ✦
          </div>
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.52 0.22 22 / 0.3)" }}
          />
        </div>

        {/* Name input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <label
            htmlFor="start-player-name"
            className="block text-xs tracking-widest uppercase mb-2 text-left"
            style={{ color: "oklch(0.58 0.03 50)" }}
          >
            Survivor Name
          </label>
          <input
            id="start-player-name"
            data-ocid="game.name_input"
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 rounded-sm text-sm font-medium tracking-wide placeholder:opacity-40 outline-none transition-all duration-200"
            style={{
              background: "oklch(0.1 0.01 25)",
              border: "1px solid oklch(0.52 0.22 22 / 0.4)",
              color: "oklch(0.9 0.02 60)",
              caretColor: "oklch(0.72 0.22 22)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "oklch(0.52 0.22 22 / 0.8)";
              e.target.style.boxShadow = "0 0 0 2px oklch(0.52 0.22 22 / 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "oklch(0.52 0.22 22 / 0.4)";
              e.target.style.boxShadow = "none";
            }}
          />
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <button
            type="button"
            data-ocid="game.start_button"
            onClick={handleStart}
            className="w-full py-4 rounded-sm font-bold text-base tracking-[0.3em] uppercase transition-all duration-200 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.45 0.22 22), oklch(0.55 0.22 22))",
              border: "1px solid oklch(0.65 0.22 22 / 0.6)",
              color: "oklch(0.96 0.01 60)",
              textShadow: "0 0 10px oklch(0.4 0.2 22 / 0.8)",
              boxShadow:
                "0 0 20px oklch(0.45 0.22 22 / 0.3), inset 0 1px 0 oklch(0.7 0.2 22 / 0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 40px oklch(0.45 0.22 22 / 0.5), inset 0 1px 0 oklch(0.7 0.2 22 / 0.3)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 20px oklch(0.45 0.22 22 / 0.3), inset 0 1px 0 oklch(0.7 0.2 22 / 0.2)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            ⚔ START GAME
          </button>

          <button
            type="button"
            data-ocid="game.leaderboard_button"
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 rounded-sm font-medium text-sm tracking-[0.2em] uppercase transition-all duration-200"
            style={{
              background: "oklch(0.1 0.01 25)",
              border: "1px solid oklch(0.3 0.04 25)",
              color: "oklch(0.65 0.03 50)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "oklch(0.52 0.22 22 / 0.4)";
              (e.currentTarget as HTMLElement).style.color =
                "oklch(0.75 0.22 22)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "oklch(0.3 0.04 25)";
              (e.currentTarget as HTMLElement).style.color =
                "oklch(0.65 0.03 50)";
            }}
          >
            🏆 LEADERBOARD
          </button>

          {/* Google Connect Button */}
          <button
            type="button"
            data-ocid="game.google_connect_button"
            onClick={() => setShowGoogleNote((prev) => !prev)}
            className="w-full py-3 rounded-sm font-medium text-sm tracking-wide flex items-center justify-center gap-3 transition-all duration-200"
            style={{
              background: "oklch(0.97 0.005 60)",
              border: "1px solid oklch(0.82 0.01 60)",
              color: "oklch(0.25 0.01 60)",
              boxShadow: "0 1px 3px oklch(0 0 0 / 0.12)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "oklch(0.92 0.008 60)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 2px 6px oklch(0 0 0 / 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "oklch(0.97 0.005 60)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 1px 3px oklch(0 0 0 / 0.12)";
            }}
          >
            {/* Google "G" SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Connect with Google
          </button>

          {/* Google note */}
          {showGoogleNote && (
            <motion.div
              data-ocid="game.google_connect.error_state"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="w-full px-4 py-2.5 rounded-sm text-xs text-center"
              style={{
                background: "oklch(0.14 0.02 50)",
                border: "1px solid oklch(0.3 0.05 50 / 0.5)",
                color: "oklch(0.72 0.06 50)",
              }}
            >
              Google login isn't available — just enter your name above to play!
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-xs"
          style={{ color: "oklch(0.35 0.02 50)" }}
        >
          © {new Date().getFullYear()} · Built with{" "}
          <span style={{ color: "oklch(0.52 0.22 22)" }}>♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.48 0.03 50)" }}
            className="hover:underline"
          >
            caffeine.ai
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
