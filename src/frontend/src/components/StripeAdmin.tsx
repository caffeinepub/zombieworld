import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, Settings, X } from "lucide-react";
import { useState } from "react";
import type { StripeConfiguration } from "../backend.d";
import { useActor } from "../hooks/useActor";

export function StripeAdmin() {
  const { actor, isFetching } = useActor();
  const [isOpen, setIsOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [allowedCountries, setAllowedCountries] = useState("US,CA,GB");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: isConfigured, refetch: refetchConfigured } = useQuery({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching && isOpen,
  });

  const {
    mutate: saveConfig,
    isPending: isSaving,
    isError: isSaveError,
  } = useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("No actor");
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      refetchConfigured();
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  if (!isAdmin) return null;

  const handleSave = () => {
    const countries = allowedCountries
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    saveConfig({ secretKey, allowedCountries: countries });
  };

  return (
    <>
      {/* Floating gear button */}
      <button
        type="button"
        data-ocid="stripe_admin.open_modal_button"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "oklch(0.12 0.02 25 / 0.95)",
          border: "1px solid oklch(0.52 0.22 22 / 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        title="Stripe Admin"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "oklch(0.52 0.22 22 / 0.8)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "oklch(0.52 0.22 22 / 0.4)";
        }}
      >
        <Settings size={18} style={{ color: "oklch(0.65 0.03 50)" }} />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          role="presentation"
        >
          <div
            data-ocid="stripe_admin.dialog"
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "oklch(0.1 0.01 25)",
              border: "1px solid oklch(0.52 0.22 22 / 0.4)",
              borderRadius: "4px",
              boxShadow:
                "0 0 40px oklch(0.52 0.22 22 / 0.15), 0 20px 60px rgba(0,0,0,0.6)",
              padding: "0",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid oklch(0.2 0.04 25)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Settings size={16} style={{ color: "oklch(0.52 0.22 22)" }} />
                <span
                  style={{
                    color: "oklch(0.88 0.02 60)",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: '"Mona Sans", sans-serif',
                  }}
                >
                  Stripe Admin
                </span>
              </div>
              <button
                type="button"
                data-ocid="stripe_admin.close_button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "oklch(0.55 0.03 50)",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px" }}>
              {isConfigured ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    background: "oklch(0.12 0.04 145 / 0.4)",
                    border: "1px solid oklch(0.48 0.22 145 / 0.4)",
                    borderRadius: "2px",
                  }}
                >
                  <CheckCircle
                    size={18}
                    style={{ color: "oklch(0.62 0.24 145)" }}
                  />
                  <span
                    style={{
                      color: "oklch(0.75 0.02 60)",
                      fontSize: "0.85rem",
                      fontFamily: '"Mona Sans", sans-serif',
                    }}
                  >
                    Stripe is configured and active.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <p
                    style={{
                      color: "oklch(0.55 0.03 50)",
                      fontSize: "0.78rem",
                      fontFamily: '"Mona Sans", sans-serif',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Configure your Stripe secret key to enable the $1 payment
                    gate.
                  </p>

                  {/* Secret key */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      htmlFor="stripe-secret-key"
                      style={{
                        color: "oklch(0.65 0.03 50)",
                        fontSize: "0.72rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontFamily: '"Mona Sans", sans-serif',
                      }}
                    >
                      Stripe Secret Key
                    </label>
                    <input
                      id="stripe-secret-key"
                      data-ocid="stripe_admin.input"
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="sk_live_..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "oklch(0.13 0.02 25)",
                        border: "1px solid oklch(0.25 0.04 25)",
                        borderRadius: "2px",
                        color: "oklch(0.88 0.02 60)",
                        fontSize: "0.85rem",
                        fontFamily: '"Geist Mono", monospace',
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "oklch(0.52 0.22 22 / 0.7)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "oklch(0.25 0.04 25)";
                      }}
                    />
                  </div>

                  {/* Allowed countries */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      htmlFor="stripe-countries"
                      style={{
                        color: "oklch(0.65 0.03 50)",
                        fontSize: "0.72rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontFamily: '"Mona Sans", sans-serif',
                      }}
                    >
                      Allowed Countries (comma-separated)
                    </label>
                    <input
                      id="stripe-countries"
                      type="text"
                      value={allowedCountries}
                      onChange={(e) => setAllowedCountries(e.target.value)}
                      placeholder="US,CA,GB"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "oklch(0.13 0.02 25)",
                        border: "1px solid oklch(0.25 0.04 25)",
                        borderRadius: "2px",
                        color: "oklch(0.88 0.02 60)",
                        fontSize: "0.85rem",
                        fontFamily: '"Geist Mono", monospace',
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "oklch(0.52 0.22 22 / 0.7)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "oklch(0.25 0.04 25)";
                      }}
                    />
                  </div>

                  {/* Error */}
                  {isSaveError && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "oklch(0.15 0.08 22 / 0.8)",
                        border: "1px solid oklch(0.52 0.22 22 / 0.5)",
                        borderRadius: "2px",
                        color: "oklch(0.72 0.15 22)",
                        fontSize: "0.78rem",
                        fontFamily: '"Mona Sans", sans-serif',
                      }}
                    >
                      ⚠ Failed to save configuration. Please try again.
                    </div>
                  )}

                  {/* Success */}
                  {saveSuccess && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "oklch(0.12 0.06 145 / 0.5)",
                        border: "1px solid oklch(0.48 0.22 145 / 0.5)",
                        borderRadius: "2px",
                        color: "oklch(0.72 0.18 145)",
                        fontSize: "0.78rem",
                        fontFamily: '"Mona Sans", sans-serif',
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle size={14} />
                      Configuration saved successfully!
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    type="button"
                    data-ocid="stripe_admin.submit_button"
                    disabled={isSaving || !secretKey.trim()}
                    onClick={handleSave}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      background:
                        isSaving || !secretKey.trim()
                          ? "oklch(0.18 0.02 25)"
                          : "linear-gradient(135deg, oklch(0.52 0.22 22), oklch(0.45 0.22 22))",
                      border: "1px solid oklch(0.52 0.22 22 / 0.4)",
                      borderRadius: "2px",
                      color:
                        isSaving || !secretKey.trim()
                          ? "oklch(0.45 0.03 50)"
                          : "oklch(0.98 0.01 60)",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontFamily: '"Mona Sans", sans-serif',
                      cursor:
                        isSaving || !secretKey.trim()
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Configuration</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
