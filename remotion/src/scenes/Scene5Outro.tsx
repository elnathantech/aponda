import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export const Scene5Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [30, 60], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ctaS = spring({ frame: frame - 80, fps, config: { damping: 15 } });

  // Gentle pulse on CTA
  const pulse = Math.sin((frame - 100) * 0.08) * 0.02 + 1;

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Logo */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #38BDF8, #06B6D4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${logoS})`,
          marginBottom: 40,
          boxShadow: "0 0 80px rgba(56,189,248,0.4)",
        }}
      >
        <span style={{ fontSize: 44, fontWeight: 800, color: "#0F172A" }}>A</span>
      </div>

      {/* Headline */}
      <h2
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#F8FAFC",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: -1,
          marginBottom: 16,
        }}
      >
        Ready to simplify
        <br />
        your business?
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 28,
          color: "#94A3B8",
          opacity: subtitleOpacity,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        Start your free trial today — no credit card required.
      </p>

      {/* CTA */}
      <div
        style={{
          padding: "20px 56px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #38BDF8, #06B6D4)",
          transform: `scale(${interpolate(ctaS, [0, 1], [0.8, 1]) * (frame > 100 ? pulse : 1)})`,
          opacity: interpolate(ctaS, [0, 1], [0, 1]),
          boxShadow: "0 8px 40px rgba(56,189,248,0.35)",
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 700, color: "#0F172A" }}>aponda.lovable.app</span>
      </div>
    </AbsoluteFill>
  );
};
