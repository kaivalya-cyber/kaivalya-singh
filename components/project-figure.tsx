"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useInView } from "@react-spring/web";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

const GREEN = "#D29922";
const RED = "#F47067";
const BLUE = "#B0A99A";
const MUTED = "#8F887A";
const BORDER = "#2A261E";

function useDrawIn(
  svgRef: React.RefObject<SVGSVGElement | null>,
  active: boolean,
  reduced: boolean,
) {
  useEffect(() => {
    if (!active || reduced || !svgRef.current) return;
    const svg = svgRef.current;

    /* getTotalLength() exists only on SVGGeometryElement — <text> does not
     * implement it (SVG 2 extension Chromium ships, WebKit never did), so
     * probing text there throws and takes the whole React tree down the
     * moment the figure scrolls into view. Draw strokes only; text fades
     * in via opacity below. */
    const strokes = svg.querySelectorAll<SVGGeometryElement>(
      ".fig-draw:not(text):not(textArea):not(tspan)",
    );
    const texts = svg.querySelectorAll<SVGTextElement>("text.fig-draw");
    const drawable: SVGGeometryElement[] = [];
    strokes.forEach((p) => {
      if (typeof p.getTotalLength !== "function") return;
      try {
        const len = p.getTotalLength();
        if (!Number.isFinite(len) || len <= 0) return;
        p.setAttribute("stroke-dasharray", String(len));
        p.setAttribute("stroke-dashoffset", String(len));
        drawable.push(p);
      } catch {
        /* element can't be measured — just fade it in with the text */
      }
    });

    const bars = svg.querySelectorAll<SVGRectElement>(".fig-bar");
    bars.forEach((r) => {
      r.style.transformBox = "fill-box";
      r.style.transformOrigin = "bottom left";
    });

    const anims = [
      ...drawable.map((p, i) =>
        animate(p, {
          strokeDashoffset: [p.getTotalLength(), 0],
          duration: 1100,
          delay: i * 140,
          ease: "outExpo",
        }),
      ),
      ...Array.from(texts).map((t, i) =>
        animate(t, {
          opacity: [0, 1],
          duration: 700,
          delay: 300 + i * 90,
          ease: "outQuad",
        }),
      ),
      ...Array.from(bars).map((r, i) =>
        animate(r, {
          scaleY: [0, 1],
          opacity: [0, 1],
          duration: 800,
          delay: 200 + i * 120,
          ease: "outExpo",
        }),
      ),
    ];

    return () => anims.forEach((a) => a.pause());
  }, [active, reduced, svgRef]);
}

function FigureShell({
  children,
  caption,
  viewBox,
}: {
  children: React.ReactNode;
  caption: string;
  viewBox: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [inViewRef, inView] = useInView({ rootMargin: "-15% 0px", once: true });
  const svgRef = useRef<SVGSVGElement>(null);
  useDrawIn(svgRef, inView, reduced);

  return (
    <figure ref={inViewRef} className="my-12 border border-border bg-bg-raised/40">
      <div className="border-b border-border px-4 py-2 font-mono text-xs text-text-muted">
        <span className="text-accent-add">fig.</span> {caption}
      </div>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="block h-auto w-full"
        role="img"
        aria-label={caption}
      >
        {children}
      </svg>
    </figure>
  );
}

/* ── LSR paper: what's known, drawn honestly ─────────────────────────── */
function LsrFigure() {
  return (
    <FigureShell
      viewBox="0 0 600 240"
      caption="Reward shaping study — headline results (energy formulation vs LQR-optimal)"
    >
      {/* gap-closed bar: 97% of the gap to LQR-optimal */}
      <text x="24" y="46" fill={MUTED} fontSize="11" fontFamily="monospace">
        gap to LQR-optimal closed
      </text>
      <rect x="24" y="56" width="552" height="18" fill="none" stroke={BORDER} />
      <rect className="fig-bar" x="24" y="56" width="535" height="18" fill={GREEN} opacity="0.75" />
      <text x="567" y="70" fill={GREEN} fontSize="12" fontFamily="monospace" textAnchor="end" className="fig-draw" stroke="none">
        97%
      </text>

      {/* LSR bar: 0.515 on a 0→1 scale */}
      <text x="24" y="112" fill={MUTED} fontSize="11" fontFamily="monospace">
        energy-based LSR (± 0.016)
      </text>
      <rect x="24" y="122" width="552" height="18" fill="none" stroke={BORDER} />
      <rect className="fig-bar" x="24" y="122" width="283" height="18" fill={BLUE} opacity="0.7" />
      <text x="315" y="136" fill={BLUE} fontSize="12" fontFamily="monospace" className="fig-draw" stroke="none">
        0.515
      </text>

      {/* Euler vs RK4 variance ratio, log scale: log10(845) ≈ 2.93 */}
      <text x="24" y="178" fill={MUTED} fontSize="11" fontFamily="monospace">
        Euler vs RK4 reward variance (log₁₀ scale)
      </text>
      <rect x="24" y="188" width="552" height="18" fill="none" stroke={BORDER} />
      <rect className="fig-bar" x="24" y="188" width="540" height="18" fill={RED} opacity="0.55" />
      <text x="470" y="202" fill={RED} fontSize="12" fontFamily="monospace" className="fig-draw" stroke="none">
        845×
      </text>
    </FigureShell>
  );
}

/* ── QEC decoder: routing pipeline + metrics ─────────────────────────── */
function QecFigure() {
  return (
    <FigureShell
      viewBox="0 0 600 220"
      caption="QEC decoder — adaptive routing pipeline and headline metrics"
    >
      {/* pipeline: syndrome → CNN classifier → 3 variational decoders */}
      <rect x="30" y="80" width="120" height="44" fill="none" stroke={MUTED} className="fig-draw" />
      <text x="90" y="106" fill="#D8D2C4" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none">
        syndrome
      </text>
      <line className="fig-draw" x1="150" y1="102" x2="220" y2="102" stroke={BLUE} strokeWidth="1.5" />
      <rect x="220" y="80" width="130" height="44" fill="none" stroke={BLUE} className="fig-draw" />
      <text x="285" y="106" fill="#D8D2C4" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none">
        CNN classifier
      </text>
      <line className="fig-draw" x1="350" y1="102" x2="400" y2="60" stroke={GREEN} strokeWidth="1.5" />
      <line className="fig-draw" x1="350" y1="102" x2="400" y2="102" stroke={GREEN} strokeWidth="1.5" />
      <line className="fig-draw" x1="350" y1="102" x2="400" y2="144" stroke={GREEN} strokeWidth="1.5" />
      <rect x="400" y="42" width="150" height="34" fill="none" stroke={GREEN} className="fig-draw" />
      <rect x="400" y="85" width="150" height="34" fill="none" stroke={GREEN} className="fig-draw" />
      <rect x="400" y="128" width="150" height="34" fill="none" stroke={GREEN} className="fig-draw" />
      <text x="475" y="63" fill="#D8D2C4" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none">
        variational A
      </text>
      <text x="475" y="106" fill="#D8D2C4" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none">
        variational B
      </text>
      <text x="475" y="149" fill="#D8D2C4" fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none">
        variational C
      </text>

      {/* metric row */}
      <text x="30" y="185" fill={GREEN} fontSize="13" fontFamily="monospace" stroke="none" className="fig-draw">
        −18.4% LER avg · −27.2% peak · 94.2% classifier · +3.8% overhead
      </text>
    </FigureShell>
  );
}

/* ── MAPPO swarm: 2 teams of 3, emergent roles ───────────────────────── */
function SwarmFigure() {
  return (
    <FigureShell
      viewBox="0 0 600 260"
      caption="Drone swarm — two teams of three, CTDE, emergent role split"
    >
      <line x1="300" y1="20" x2="300" y2="240" stroke={BORDER} strokeDasharray="4 6" className="fig-draw" />
      <text x="292" y="254" fill={MUTED} fontSize="10" fontFamily="monospace" textAnchor="end" stroke="none">
        team A
      </text>
      <text x="308" y="254" fill={MUTED} fontSize="10" fontFamily="monospace" stroke="none">
        team B
      </text>

      {/* team A nodes */}
      {[
        { x: 170, y: 70, label: "aggressor" },
        { x: 120, y: 150, label: "support" },
        { x: 190, y: 210, label: "scout" },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="14" fill="#0E0D0B" stroke={BLUE} strokeWidth="1.5" className="fig-draw" />
          <text x={n.x} y={n.y + 32} fill={MUTED} fontSize="10" fontFamily="monospace" textAnchor="middle" stroke="none">
            {n.label}
          </text>
        </g>
      ))}
      <line className="fig-draw" x1="170" y1="70" x2="120" y2="150" stroke={BLUE} strokeWidth="1" opacity="0.6" />
      <line className="fig-draw" x1="120" y1="150" x2="190" y2="210" stroke={BLUE} strokeWidth="1" opacity="0.6" />
      <line className="fig-draw" x1="190" y1="210" x2="170" y2="70" stroke={BLUE} strokeWidth="1" opacity="0.6" />

      {/* team B nodes — mirrored, green */}
      {[
        { x: 430, y: 70, label: "aggressor" },
        { x: 480, y: 150, label: "support" },
        { x: 410, y: 210, label: "scout" },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="14" fill="#0E0D0B" stroke={GREEN} strokeWidth="1.5" className="fig-draw" />
          <text x={n.x} y={n.y + 32} fill={MUTED} fontSize="10" fontFamily="monospace" textAnchor="middle" stroke="none">
            {n.label}
          </text>
        </g>
      ))}
      <line className="fig-draw" x1="430" y1="70" x2="480" y2="150" stroke={GREEN} strokeWidth="1" opacity="0.6" />
      <line className="fig-draw" x1="480" y1="150" x2="410" y2="210" stroke={GREEN} strokeWidth="1" opacity="0.6" />
      <line className="fig-draw" x1="410" y1="210" x2="430" y2="70" stroke={GREEN} strokeWidth="1" opacity="0.6" />

      <text x="300" y="150" fill={RED} fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" className="fig-draw">
        competitive pressure
      </text>
    </FigureShell>
  );
}

/* ── PureGrad: autograd DAG ──────────────────────────────────────────── */
function AutogradFigure() {
  return (
    <FigureShell
      viewBox="0 0 600 200"
      caption="PureGrad — dynamic computation graph, reverse-mode autodiff"
    >
      {[
        { x: 60, label: "x" },
        { x: 200, label: "linear" },
        { x: 340, label: "relu" },
        { x: 480, label: "ŷ" },
      ].map((n, i) => (
        <g key={n.label}>
          <rect
            x={n.x - 45}
            y="48"
            width="90"
            height="36"
            fill="none"
            stroke={i === 3 ? GREEN : BLUE}
            className="fig-draw"
          />
          <text x={n.x} y="70" fill="#D8D2C4" fontSize="12" fontFamily="monospace" textAnchor="middle" stroke="none">
            {n.label}
          </text>
        </g>
      ))}
      <line className="fig-draw" x1="105" y1="66" x2="155" y2="66" stroke={MUTED} strokeWidth="1.2" />
      <line className="fig-draw" x1="245" y1="66" x2="295" y2="66" stroke={MUTED} strokeWidth="1.2" />
      <line className="fig-draw" x1="385" y1="66" x2="435" y2="66" stroke={MUTED} strokeWidth="1.2" />

      {/* backward pass arrows */}
      <line className="fig-draw" x1="435" y1="120" x2="385" y2="120" stroke={RED} strokeWidth="1.2" strokeDasharray="5 4" />
      <line className="fig-draw" x1="295" y1="120" x2="245" y2="120" stroke={RED} strokeWidth="1.2" strokeDasharray="5 4" />
      <line className="fig-draw" x1="155" y1="120" x2="105" y2="120" stroke={RED} strokeWidth="1.2" strokeDasharray="5 4" />
      <text x="300" y="150" fill={RED} fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" className="fig-draw">
        ∂L/∂θ — 19/19 gradient-checker tests passing
      </text>
      <text x="300" y="178" fill={MUTED} fontSize="11" fontFamily="monospace" textAnchor="middle" stroke="none" className="fig-draw">
        99.7% moons accuracy
      </text>
    </FigureShell>
  );
}

/* ── FTC dataset: dataset scale + model results ──────────────────────── */
function FtcFigure() {
  const rows = [
    { label: "matches", w: 540, text: "1,762" },
    { label: "teams", w: 277, text: "902" },
    { label: "events", w: 53, text: "53" },
    { label: "seasons", w: 6, text: "6" },
  ];
  return (
    <FigureShell
      viewBox="0 0 600 250"
      caption="FTC Open Analytics Dataset — scale and best model results"
    >
      {rows.map((r, i) => (
        <g key={r.label}>
          <text x="24" y={40 + i * 40} fill={MUTED} fontSize="11" fontFamily="monospace" stroke="none">
            {r.label}
          </text>
          <rect x="110" y={30 + i * 40} width={r.w} height="16" fill={BLUE} opacity="0.55" className="fig-bar" />
          <text x={120 + r.w} y={43 + i * 40} fill="#D8D2C4" fontSize="11" fontFamily="monospace" stroke="none">
            {r.text}
          </text>
        </g>
      ))}
      <text x="24" y="215" fill={GREEN} fontSize="12" fontFamily="monospace" stroke="none" className="fig-draw">
        logistic regression: 88.69% accuracy · 0.9412 AUC-ROC
      </text>
    </FigureShell>
  );
}

export function ProjectFigure({ slug }: { slug: string }) {
  switch (slug) {
    case "reward-shaping-lsr":
      return <LsrFigure />;
    case "variational-qec-decoder":
      return <QecFigure />;
    case "mappo-drone-swarm":
      return <SwarmFigure />;
    case "puregrad":
      return <AutogradFigure />;
    case "ftc-analytics-dataset":
      return <FtcFigure />;
    default:
      return null;
  }
}
