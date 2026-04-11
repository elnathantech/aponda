import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "800"], subsets: ["latin"] });

export const Scene1Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [20, 50], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [45, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [45, 75], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [60, 100], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Logo circle */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #38BDF8, #06B6D4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${logoScale})`,
          marginBottom: 40,
          boxShadow: "0 0 60px rgba(56,189,248,0.3)",
        }}
      >
        <span style={{ fontSize: 52, fontWeight: 800, color: "#0F172A" }}>A</span>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 88,
          fontWeight: 800,
          color: "#F8FAFC",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          letterSpacing: -2,
          marginBottom: 16,
        }}
      >
        Meet <span style={{ color: "#38BDF8" }}>Aponda</span>
      </h1>

      {/* Accent line */}
      <div
        style={{
          width: lineWidth,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #38BDF8, #06B6D4)",
          marginBottom: 24,
        }}
      />

      {/* Subtitle */}
      <p
        style={{
          fontSize: 32,
          color: "#94A3B8",
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontWeight: 400,
          maxWidth: 700,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        AI-powered tools for growing SMEs.
        <br />
        Forms, invoices, payroll — all in one place.
      </p>
    </AbsoluteFill>
  );
};
