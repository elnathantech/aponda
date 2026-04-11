import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const InvoiceRow = ({ client, amount, status, delay }: { client: string; amount: string; status: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  const statusColor = status === "Paid" ? "#34D399" : status === "Sent" ? "#FBBF24" : "#94A3B8";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "20px 32px",
        borderBottom: "1px solid rgba(148,163,184,0.1)",
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
      }}
    >
      <span style={{ flex: 1, fontSize: 22, color: "#E2E8F0", fontWeight: 600 }}>{client}</span>
      <span style={{ width: 180, fontSize: 22, color: "#F8FAFC", fontWeight: 700, textAlign: "right" }}>{amount}</span>
      <div style={{ width: 140, display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: 16,
            color: statusColor,
            fontWeight: 600,
            background: `${statusColor}20`,
            padding: "6px 16px",
            borderRadius: 20,
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export const Scene4Invoicing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });
  const cardS = spring({ frame: frame - 10, fps, config: { damping: 18 } });

  // Simulate a "Send" button press
  const sendFrame = 120;
  const sendPulse = spring({ frame: frame - sendFrame, fps, config: { damping: 10, stiffness: 200 } });
  const sent = frame >= sendFrame;

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 80, alignItems: "flex-start" }}>
        {/* Left: Description */}
        <div
          style={{
            maxWidth: 420,
            opacity: interpolate(titleS, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleS, [0, 1], [30, 0])}px)`,
          }}
        >
          <p style={{ fontSize: 22, color: "#38BDF8", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
            Step 3
          </p>
          <h2 style={{ fontSize: 56, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2, marginBottom: 20 }}>
            Create & send invoices
          </h2>
          <p style={{ fontSize: 22, color: "#94A3B8", lineHeight: 1.6 }}>
            Generate professional invoices, track payments, and get paid faster — all from one screen.
          </p>

          {/* Send button animation */}
          <div
            style={{
              marginTop: 40,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 36px",
              borderRadius: 16,
              background: sent ? "linear-gradient(135deg, #34D399, #10B981)" : "linear-gradient(135deg, #38BDF8, #06B6D4)",
              transform: `scale(${sent ? interpolate(sendPulse, [0, 0.5, 1], [1, 1.08, 1]) : 1})`,
              boxShadow: sent ? "0 4px 30px rgba(52,211,153,0.3)" : "0 4px 30px rgba(56,189,248,0.3)",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
              {sent ? "✓ Invoice Sent!" : "Send Invoice →"}
            </span>
          </div>
        </div>

        {/* Right: Invoice preview */}
        <div
          style={{
            width: 680,
            background: "rgba(15,23,42,0.9)",
            borderRadius: 24,
            border: "1px solid rgba(148,163,184,0.15)",
            overflow: "hidden",
            transform: `scale(${interpolate(cardS, [0, 1], [0.9, 1])})`,
            opacity: interpolate(cardS, [0, 1], [0, 1]),
          }}
        >
          {/* Header */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(148,163,184,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#F8FAFC" }}>Recent Invoices</span>
            <span style={{ fontSize: 16, color: "#94A3B8" }}>This month</span>
          </div>
          <InvoiceRow client="Acme Corp" amount="£3,200" status="Paid" delay={30} />
          <InvoiceRow client="TechStart Ltd" amount="£1,850" status="Sent" delay={45} />
          <InvoiceRow client="Green & Co" amount="£4,500" status="Draft" delay={60} />
          <InvoiceRow client="Nova Design" amount="£2,100" status="Paid" delay={75} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
