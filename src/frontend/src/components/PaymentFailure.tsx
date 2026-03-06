import { RotateCcw, Skull, XCircle } from "lucide-react";

interface PaymentFailureProps {
  onRetry: () => void;
}

export function PaymentFailure({ onRetry }: PaymentFailureProps) {
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
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.22 0.1 22 / 0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* Failure card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-8 py-10 mx-4"
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "oklch(0.09 0.01 25 / 0.96)",
          border: "1px solid oklch(0.52 0.22 22 / 0.5)",
          borderRadius: "4px",
          boxShadow:
            "0 0 40px oklch(0.52 0.22 22 / 0.2), 0 0 80px oklch(0.52 0.22 22 / 0.08), inset 0 1px 0 oklch(0.52 0.22 22 / 0.15)",
        }}
      >
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <XCircle
            size={56}
            style={{
              color: "oklch(0.52 0.22 22)",
              filter: "drop-shadow(0 0 12px oklch(0.52 0.22 22 / 0.8))",
            }}
          />
          <h1
            className="game-font text-glow-red"
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              letterSpacing: "0.06em",
              color: "oklch(0.92 0.02 60)",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Access Denied
          </h1>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, oklch(0.52 0.22 22 / 0.5), transparent)",
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
              Payment cancelled or failed
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
            Your entry fee was not processed. The zombies will wait — try again
            when you're ready.
          </p>
        </div>

        {/* Retry button */}
        <button
          type="button"
          data-ocid="payment_failure.primary_button"
          onClick={onRetry}
          style={{
            width: "100%",
            padding: "14px 0",
            background:
              "linear-gradient(135deg, oklch(0.52 0.22 22), oklch(0.45 0.22 22))",
            border: "1px solid oklch(0.6 0.22 22 / 0.6)",
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
              "linear-gradient(135deg, oklch(0.58 0.22 22), oklch(0.5 0.22 22))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "linear-gradient(135deg, oklch(0.52 0.22 22), oklch(0.45 0.22 22))";
          }}
        >
          <RotateCcw size={18} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
