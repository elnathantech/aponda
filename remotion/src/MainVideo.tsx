import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2SignUp } from "./scenes/Scene2SignUp";
import { Scene3Dashboard } from "./scenes/Scene3Dashboard";
import { Scene4Invoicing } from "./scenes/Scene4Invoicing";
import { Scene5Outro } from "./scenes/Scene5Outro";

const BG_COLORS = {
  from: "#0F172A",
  to: "#1E293B",
};

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const hue = interpolate(frame, [0, 900], [210, 240]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 60%, 8%) 0%, hsl(${hue + 20}, 50%, 14%) 100%)`,
      }}
    >
      {/* Floating accent orbs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
          top: interpolate(frame, [0, 900], [-100, 200]),
          left: interpolate(frame, [0, 900], [-200, 100]),
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
          bottom: interpolate(frame, [0, 900], [-50, 150]),
          right: interpolate(frame, [0, 900], [-100, 50]),
          filter: "blur(60px)",
        }}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene2SignUp />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={200}>
          <Scene3Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={200}>
          <Scene4Invoicing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene5Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
