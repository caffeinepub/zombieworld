import { CheckCircle, Skull, Zap } from "lucide-react";
import { useEffect } from "react";

interface PaymentSuccessProps {
  onPlay: () => void;
}

export function PaymentSuccess({ onPlay }: PaymentSuccessProps) {
  useEffect(() => {
    sessionStorage.setItem("gamePaid", "true");
  }, []);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#060508" }}
    >
      {/* Atmospheric background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.25 0.12 145 / 0.25) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* Success card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-8 py-10 mx-4"
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "oklch(0.09 0.01 25 / 0.96)",
          border: "1px solid oklch(0.62 0.24 145 / 0.5)",
          borderRadius: "4px",
          boxShadow:
            "0 0 40px oklch(0.62 0.24 145 / 0.2), 0 0 80px oklch(0.62 0.24 145 / 0.08), inset 0 1px 0 oklch(0.62 0.24 145 / 0.15)",
        }}
      >
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <CheckCircle
            size={56}
            style={{
              color: "oklch(0.62 0.24 145)",
              filter: "drop-shadow(0 0 12px oklch(0.62 0.24 145 / 0.8))",
            }}
          />
          <h1
            className="game-font"
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "oklch(0.92 0.02 60)",
              textTransform: "uppercase",
              textAlign: "center",
              textShadow:
                "0 0 10px oklch(0.62 0.24 145 / 0.5), 0 0 30px oklch(0.62 0.24 145 / 0.25)",
            }}
          >
            Entry Granted
          </h1>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, oklch(0.62 0.24 145 / 0.5), transparent)",
          }}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Skull size={16} style={{ color: "oklch(0.52 0.22 22)" }} />
            <span
              style={{
                color: "oklch(0.75 0.02 60)",
                fontSize: "0.9rem",
                fontFamily: '"Mona Sans", sans-serif',
                letterSpacing: "0.05em",
              }}
            >
              Payment successful
            </span>
            <Skull size={16} style={{ color: "oklch(0.52 0.22 22)" }} />
          </div>
          <p
            style={{
              color: "oklch(0.55 0.03 50)",
              fontSize: "0.8rem",
              fontFamily: '"Mona Sans", sans-serif',
              lineHeight: 1.6,
              maxWidth: "260px",
            }}
          >
            The horde is waiting. Your survival session is active — good luck,
            survivor.
          </p>
        </div>

        {/* Play button */}
        <button
          type="button"
          data-ocid="payment_success.primary_button"
          onClick={onPlay}
          style={{
            width: "100%",
            padding: "14px 0",
            background:
              "linear-gradient(135deg, oklch(0.48 0.22 145), oklch(0.38 0.22 145))",
            border: "1px solid oklch(0.62 0.24 145 / 0.6)",
            borderRadius: "2px",
            color: "oklch(0.98 0.01 60)",
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: '"Mona Sans", sans-serif',
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "linear-gradient(135deg, oklch(0.55 0.24 145), oklch(0.45 0.24 145))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "linear-gradient(135deg, oklch(0.48 0.22 145), oklch(0.38 0.22 145))";
          }}
        >
          <Zap size={18} />
          <span>Play Now</span>
        </button>
      </div>
    </div>
  );
}
