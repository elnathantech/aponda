import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const Step = ({ label, delay, index }: { label: string; delay: number; index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 150 } });
  const checkScale = spring({ frame: frame - delay - 15, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #38BDF8, #06B6D4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${checkScale})`,
          boxShadow: "0 4px 20px rgba(56,189,248,0.3)",
        }}
      >
        <span style={{ fontSize: 28, color: "#0F172A", fontWeight: 700 }}>{index}</span>
      </div>
      <span style={{ fontSize: 30, color: "#E2E8F0", fontWeight: 600 }}>{label}</span>
    </div>
  );
};

export const Scene2SignUp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame, fps, config: { damping: 20, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 120, alignItems: "center" }}>
        {/* Left: Title */}
        <div
          style={{
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          <p style={{ fontSize: 22, color: "#38BDF8", fontWeight: 600, marginBottom: 12, letterSpacing: 3, textTransform: "uppercase" }}>
            Step 1
          </p>
          <h2 style={{ fontSize: 64, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2, maxWidth: 450 }}>
            Sign up in seconds
          </h2>
          <p style={{ fontSize: 24, color: "#94A3B8", marginTop: 16, maxWidth: 400 }}>
            No credit card needed. Start your free trial instantly.
          </p>
        </div>

        {/* Right: Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <Step label="Enter your email" delay={20} index={1} />
          <Step label="Set a password" delay={40} index={2} />
          <Step label="Add your company" delay={60} index={3} />
          <Step label="You're in! 🎉" delay={80} index={4} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
