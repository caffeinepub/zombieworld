import { Loader2, Shield, Skull, Zap } from "lucide-react";
import { useState } from "react";
import { useCreateCheckoutSession } from "../hooks/useCreateCheckoutSession";

const BASE_URL = window.location.origin;

interface PaymentGateProps {
  children: React.ReactNode;
}

export function PaymentGate({ children }: PaymentGateProps) {
  const [hasPaid] = useState(
    () => sessionStorage.getItem("gamePaid") === "true",
  );
  const {
    mutate: createSession,
    isPending,
    isError,
    error,
  } = useCreateCheckoutSession();

  if (hasPaid) {
    return <>{children}</>;
  }

  const handlePay = () => {
    createSession(
      {
        items: [
          {
            productName: "Game Entry",
            currency: "usd",
            quantity: 1n,
            priceInCents: 100n,
            productDescription: "ZombieWorld game entry fee",
          },
        ],
        successUrl: `${BASE_URL}/payment-success`,
        cancelUrl: `${BASE_URL}/payment-failure`,
      },
      {
        onSuccess: (session) => {
          window.location.href = session.url;
        },
      },
    );
  };

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
            "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.18 0.08 22 / 0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
        }}
      />

      {/* Entry card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-8 py-10 mx-4"
        style={{
          maxWidth: "420px",
          width: "100%",
          background: "oklch(0.09 0.01 25 / 0.96)",
          border: "1px solid oklch(0.52 0.22 22 / 0.5)",
          borderRadius: "4px",
          boxShadow:
            "0 0 40px oklch(0.52 0.22 22 / 0.2), 0 0 80px oklch(0.52 0.22 22 / 0.08), inset 0 1px 0 oklch(0.52 0.22 22 / 0.15)",
        }}
      >
        {/* Title cluster */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <Skull
              size={28}
              style={{
                color: "oklch(0.52 0.22 22)",
                filter: "drop-shadow(0 0 6px oklch(0.52 0.22 22 / 0.7))",
              }}
            />
            <h1
              className="game-font text-glow-red"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                color: "oklch(0.92 0.02 60)",
                textTransform: "uppercase",
              }}
            >
              ZombieWorld
            </h1>
            <Skull
              size={28}
              style={{
                color: "oklch(0.52 0.22 22)",
                filter: "drop-shadow(0 0 6px oklch(0.52 0.22 22 / 0.7))",
              }}
            />
          </div>
          <p
            style={{
              color: "oklch(0.58 0.03 50)",
              fontSize: "0.78rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: '"Mona Sans", sans-serif',
            }}
          >
            Open World Zombie Survival
          </p>
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

        {/* Entry fee badge */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center gap-2 px-6 py-3"
            style={{
              background: "oklch(0.12 0.04 22 / 0.8)",
              border: "1px solid oklch(0.52 0.22 22 / 0.35)",
              borderRadius: "2px",
            }}
          >
            <Shield size={16} style={{ color: "oklch(0.65 0.18 52)" }} />
            <span
              style={{
                color: "oklch(0.92 0.02 60)",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                fontFamily: '"Mona Sans", sans-serif',
                textTransform: "uppercase",
              }}
            >
              Entry Fee
            </span>
            <span
              style={{
                color: "oklch(0.65 0.18 52)",
                fontSize: "1.4rem",
                fontWeight: 800,
                marginLeft: "0.5rem",
                fontFamily: '"Fraunces", serif',
                filter: "drop-shadow(0 0 6px oklch(0.65 0.18 52 / 0.5))",
              }}
            >
              $1.00
            </span>
          </div>

          <p
            style={{
              color: "oklch(0.55 0.03 50)",
              fontSize: "0.78rem",
              textAlign: "center",
              lineHeight: 1.6,
              fontFamily: '"Mona Sans", sans-serif',
              maxWidth: "280px",
            }}
          >
            Pay once, survive as long as you can. Fight through waves of
            walkers, runners, and tank zombies. Earn your place on the
            leaderboard.
          </p>
        </div>

        {/* Pay button */}
        <button
          type="button"
          data-ocid="payment.pay_button"
          disabled={isPending}
          onClick={handlePay}
          className="pulse-red"
          style={{
            width: "100%",
            padding: "14px 0",
            background: isPending
              ? "oklch(0.3 0.1 22)"
              : "linear-gradient(135deg, oklch(0.52 0.22 22), oklch(0.45 0.22 22))",
            border: "1px solid oklch(0.6 0.22 22 / 0.6)",
            borderRadius: "2px",
            color: "oklch(0.98 0.01 60)",
            fontSize: "1rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: '"Mona Sans", sans-serif',
            cursor: isPending ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
          }}
        >
          {isPending ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
                data-ocid="payment.loading_state"
              />
              <span>Connecting to Stripe...</span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>Pay $1 to Play</span>
            </>
          )}
        </button>

        {/* Error state */}
        {isError && (
          <div
            data-ocid="payment.error_state"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "oklch(0.15 0.08 22 / 0.8)",
              border: "1px solid oklch(0.52 0.22 22 / 0.6)",
              borderRadius: "2px",
              color: "oklch(0.75 0.15 22)",
              fontSize: "0.8rem",
              fontFamily: '"Mona Sans", sans-serif',
              lineHeight: 1.5,
            }}
          >
            ⚠{" "}
            {error instanceof Error
              ? error.message
              : "Payment failed. Please try again."}
          </div>
        )}

        {/* Footer note */}
        <p
          style={{
            color: "oklch(0.4 0.02 50)",
            fontSize: "0.7rem",
            textAlign: "center",
            fontFamily: '"Mona Sans", sans-serif',
            letterSpacing: "0.05em",
          }}
        >
          Powered by Stripe. Secure payment.
        </p>
      </div>
    </div>
  );
}
