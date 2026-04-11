import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const StatCard = ({ label, value, delay, color }: { label: string; value: string; delay: number; color: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 140 } });

  return (
    <div
      style={{
        background: "rgba(30,41,59,0.8)",
        borderRadius: 20,
        padding: "36px 40px",
        border: "1px solid rgba(148,163,184,0.15)",
        transform: `scale(${interpolate(s, [0, 1], [0.8, 1])}) translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        opacity: interpolate(s, [0, 1], [0, 1]),
        minWidth: 220,
      }}
    >
      <p style={{ fontSize: 18, color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 42, fontWeight: 700, color }}>{value}</p>
    </div>
  );
};

const SidebarItem = ({ label, delay, active }: { label: string; delay: number; active?: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });

  return (
    <div
      style={{
        padding: "14px 24px",
        borderRadius: 12,
        background: active ? "rgba(56,189,248,0.15)" : "transparent",
        borderLeft: active ? "3px solid #38BDF8" : "3px solid transparent",
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
      }}
    >
      <span style={{ fontSize: 18, color: active ? "#38BDF8" : "#94A3B8", fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
};

export const Scene3Dashboard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {/* Header label */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [20, 0])}px)`,
        }}
      >
        <p style={{ fontSize: 22, color: "#38BDF8", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Step 2</p>
        <h2 style={{ fontSize: 48, fontWeight: 700, color: "#F8FAFC" }}>Your command centre</h2>
      </div>

      {/* Mock dashboard */}
      <div style={{ position: "absolute", bottom: 60, left: 120, right: 120, top: 200, display: "flex", gap: 24 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 240,
            background: "rgba(15,23,42,0.9)",
            borderRadius: 20,
            padding: "24px 0",
            border: "1px solid rgba(148,163,184,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ padding: "0 24px 20px", marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#F8FAFC" }}>Aponda</span>
          </div>
          <SidebarItem label="Dashboard" delay={15} active />
          <SidebarItem label="Employees" delay={25} />
          <SidebarItem label="Payroll" delay={35} />
          <SidebarItem label="Invoices" delay={45} />
          <SidebarItem label="Projects" delay={55} />
          <SidebarItem label="Reports" delay={65} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 24 }}>
            <StatCard label="Revenue" value="£42,850" delay={30} color="#34D399" />
            <StatCard label="Invoices Due" value="7" delay={45} color="#FBBF24" />
            <StatCard label="Employees" value="12" delay={60} color="#38BDF8" />
            <StatCard label="Projects" value="5" delay={75} color="#A78BFA" />
          </div>

          {/* Chart placeholder */}
          <div
            style={{
              flex: 1,
              background: "rgba(30,41,59,0.8)",
              borderRadius: 20,
              border: "1px solid rgba(148,163,184,0.15)",
              padding: 40,
              display: "flex",
              alignItems: "flex-end",
              gap: 16,
              opacity: interpolate(frame, [80, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {[65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100, 88].map((h, i) => {
              const barS = spring({ frame: frame - 90 - i * 5, fps, config: { damping: 12 } });
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h * interpolate(barS, [0, 1], [0, 1])}%`,
                    background: `linear-gradient(180deg, #38BDF8, rgba(56,189,248,0.3))`,
                    borderRadius: "8px 8px 0 0",
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
