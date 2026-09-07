"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import type { GitHubContributions } from "@/content/github-contributions";

/**
 * ContributionSkyline — the GitHub contribution calendar as a 3D city.
 * Real data from content/github-contributions.json (regenerate with
 * `npm run fetch:github`). Each day with contributions is an extruded box
 * on a 7×~53 grid; drag to orbit. Pure canvas 2D: yaw camera + painter's-
 * algorithm depth sort — no WebGL dependency, works everywhere.
 */

const AMBER_RAMPS = [
  [90, 70, 40], // level 1 — dim amber
  [168, 118, 34], // level 2
  [210, 153, 34], // level 3 — full accent
  [240, 194, 106], // level 4 — hot
] as const;

type Rgb = readonly [number, number, number];

function shade(base: Rgb, k: number): string {
  const f = (c: number) => Math.min(255, Math.round(c * k));
  return `rgb(${f(base[0])}, ${f(base[1])}, ${f(base[2])})`;
}

function levelColor(level: number): Rgb {
  return AMBER_RAMPS[Math.min(3, Math.max(0, level - 1))];
}

interface Box {
  /** grid coords: col = week, row = weekday */
  col: number;
  row: number;
  h: number; // extrusion height (world units)
  level: number;
  date: string;
  count: number;
}

const CELL = 11; // px between grid cells at scale 1
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function ContributionSkyline({
  data,
  className,
}: {
  data: GitHubContributions;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  // Ref-driven render state — the RAF loop reads these without re-subscribing
  const growRef = useRef(reduced ? 1 : 0);
  const yawRef = useRef(-0.5);
  const hoveredRef = useRef<Box | null>(null);
  const dragRef = useRef<{ x: number; yaw: number } | null>(null);
  const dirtyRef = useRef(true);
  const rafRef = useRef(0);

  const [hovered, setHovered] = useState<Box | null>(null);
  const [inView, setInView] = useState(false);

  // Group calendar days into weeks (columns of 7)
  const weeks = useMemo(() => {
    const out: (typeof data.calendar.days)[] = [];
    let current: typeof data.calendar.days = [];
    for (const day of data.calendar.days) {
      current.push(day);
      if (current.length === 7) {
        out.push(current);
        current = [];
      }
    }
    if (current.length) out.push(current);
    return out;
  }, [data]);

  const boxes = useMemo<Box[]>(() => {
    const out: Box[] = [];
    weeks.forEach((week, col) => {
      week.forEach((day, row) => {
        if (day.count <= 0) return;
        // Smooth height, capped so the best day doesn't dwarf everything
        const h = Math.min(3.2, 0.35 + Math.log2(1 + day.count) * 0.55);
        out.push({ col, row, h, level: day.level, date: day.date, count: day.count });
      });
    });
    return out;
  }, [weeks]);

  const maxCol = weeks.length - 1;
  const maxRow = 6;

  /* ── draw one frame ─────────────────────────────────────────────────── */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    if (canvas.width !== Math.round(rect.width * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const yaw = yawRef.current;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const project = (gx: number, gy: number, gz: number) => {
      const wx = (gx - maxCol / 2) * CELL;
      const wy = (gy - maxRow / 2) * CELL;
      const rx = wx * cosY - wy * sinY;
      const ry = wx * sinY + wy * cosY;
      return { x: rect.width / 2 + rx, y: rect.height * 0.6 - ry * 0.5 - gz * CELL };
    };

    // Ground plate
    const p00 = project(-0.5, -0.5, 0);
    const p10 = project(maxCol + 0.5, -0.5, 0);
    const p11 = project(maxCol + 0.5, maxRow + 0.5, 0);
    const p01 = project(-0.5, maxRow + 0.5, 0);
    ctx.beginPath();
    ctx.moveTo(p00.x, p00.y);
    ctx.lineTo(p10.x, p10.y);
    ctx.lineTo(p11.x, p11.y);
    ctx.lineTo(p01.x, p01.y);
    ctx.closePath();
    ctx.fillStyle = "rgba(22, 20, 15, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#2A261E";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Painter sort: far → near
    const sorted = boxes
      .map((b) => {
        const wx = (b.col - maxCol / 2) * CELL;
        const wy = (b.row - maxRow / 2) * CELL;
        return { b, depth: wx * sinY + wy * cosY };
      })
      .sort((a, z) => a.depth - z.depth);

    const t = performance.now() / 1000;
    const hoveredBox = hoveredRef.current;

    for (const { b } of sorted) {
      // build in left→right, ease-out cubic per box
      const local = growRef.current >= 1
        ? 1
        : Math.max(0, Math.min(1, (growRef.current - (b.col / maxCol) * 0.6) / 0.35));
      if (local <= 0.01) continue;
      const e = 1 - Math.pow(1 - local, 3);
      const h = b.h * e;
      const base = levelColor(b.level);

      const a0 = project(b.col - 0.5, b.row - 0.5, h);
      const a1 = project(b.col + 0.5, b.row - 0.5, h);
      const a2 = project(b.col + 0.5, b.row + 0.5, h);
      const a3 = project(b.col - 0.5, b.row + 0.5, h);
      const c1 = project(b.col + 0.5, b.row - 0.5, 0);
      const c2 = project(b.col + 0.5, b.row + 0.5, 0);
      const c3 = project(b.col - 0.5, b.row + 0.5, 0);

      const isHover = hoveredBox?.col === b.col && hoveredBox?.row === b.row;

      // Right wall
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.closePath();
      ctx.fillStyle = shade(base, 0.55);
      ctx.fill();

      // Front wall
      ctx.beginPath();
      ctx.moveTo(a2.x, a2.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.lineTo(c3.x, c3.y);
      ctx.lineTo(a3.x, a3.y);
      ctx.closePath();
      ctx.fillStyle = shade(base, 0.75);
      ctx.fill();

      // Top face
      ctx.beginPath();
      ctx.moveTo(a0.x, a0.y);
      ctx.lineTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.lineTo(a3.x, a3.y);
      ctx.closePath();
      ctx.fillStyle = shade(base, isHover ? 1.35 : 1);
      ctx.fill();
      ctx.strokeStyle = isHover ? "rgba(240, 194, 106, 0.9)" : "#0E0D0B";
      ctx.lineWidth = isHover ? 1.2 : 0.5;
      ctx.stroke();

      // Hover pulse ring on the ground
      if (isHover && !reduced) {
        const pulse = (Math.sin(t * 5) + 1) / 2;
        const q0 = project(b.col - 0.5, b.row - 0.5, 0.02);
        const q1 = project(b.col + 0.5, b.row - 0.5, 0.02);
        const q2 = project(b.col + 0.5, b.row + 0.5, 0.02);
        const q3 = project(b.col - 0.5, b.row + 0.5, 0.02);
        ctx.beginPath();
        ctx.moveTo(q0.x, q0.y);
        ctx.lineTo(q1.x, q1.y);
        ctx.lineTo(q2.x, q2.y);
        ctx.lineTo(q3.x, q3.y);
        ctx.closePath();
        ctx.strokeStyle = `rgba(240, 194, 106, ${0.25 + pulse * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Month labels along the near edge
    ctx.font = "9px monospace";
    ctx.fillStyle = "rgba(143, 136, 122, 0.8)";
    let lastMonth = -1;
    for (let col = 0; col <= maxCol; col++) {
      const firstDay = weeks[col]?.[0];
      if (!firstDay) continue;
      const month = new Date(firstDay.date + "T00:00:00Z").getUTCMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        const lp = project(col, -0.9, 0);
        ctx.fillText(MONTHS[month], lp.x - 9, lp.y + 3);
      }
    }
  }, [boxes, weeks, maxCol, reduced]);

  /* ── RAF loop: draw only when dirty ─────────────────────────────────── */

  useEffect(() => {
    if (reduced) return; // static full frame is painted by the mount effect
    let running = true;
    const loop = () => {
      if (!running) return;
      if (growRef.current > 0 && growRef.current < 1) {
        growRef.current = Math.min(1, growRef.current + 0.012);
        dirtyRef.current = true;
      }
      if (hoveredRef.current) dirtyRef.current = true; // pulse animation
      if (dirtyRef.current) {
        draw();
        dirtyRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, reduced]);

  // Paint one full static frame on mount so the graph is never blank,
  // even where RAF doesn't tick (hidden tabs, preview webviews).
  useEffect(() => {
    growRef.current = 1;
    draw();
  }, [draw]);

  // Repaint when the canvas is resized (breakpoint shifts, sidebar, etc.)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (growRef.current >= 1 && !hoveredRef.current) draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  // Start the build when scrolled into view
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (!reduced) {
            growRef.current = 0.0001;
            dirtyRef.current = true;
          }
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  /* ── interaction ────────────────────────────────────────────────────── */

  const pick = useCallback(
    (clientX: number, clientY: number): Box | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const yaw = yawRef.current;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const project = (gx: number, gy: number, gz: number) => {
        const wx = (gx - maxCol / 2) * CELL;
        const wy = (gy - maxRow / 2) * CELL;
        const rx = wx * cosY - wy * sinY;
        const ry = wx * sinY + wy * cosY;
        return { x: rect.width / 2 + rx, y: rect.height * 0.6 - ry * 0.5 - gz * CELL };
      };

      let best: Box | null = null;
      let bestDepth = -Infinity;
      for (const b of boxes) {
        const top = project(b.col - 0.5, b.row - 0.5, b.h);
        const bot = project(b.col + 0.5, b.row + 0.5, 0);
        const minX = Math.min(top.x, bot.x) - CELL;
        const maxX = Math.max(top.x, bot.x) + CELL;
        const minY = Math.min(top.y, bot.y) - 2;
        const maxY = Math.max(top.y, bot.y) + 2;
        if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
          const wx = (b.col - maxCol / 2) * CELL;
          const wy = (b.row - maxRow / 2) * CELL;
          const depth = wx * sinY + wy * cosY;
          if (depth > bestDepth) {
            bestDepth = depth;
            best = b;
          }
        }
      }
      return best;
    },
    [boxes, maxCol],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, yaw: yawRef.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x;
      yawRef.current = dragRef.current.yaw + dx * 0.008;
      draw(); // synchronous: orbit must not depend on RAF
      return;
    }
    const hit = pick(e.clientX, e.clientY);
    if (hit?.date !== hoveredRef.current?.date) {
      hoveredRef.current = hit;
      setHovered(hit);
      draw();
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="h-[380px] w-full touch-pan-y select-none md:h-[440px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          hoveredRef.current = null;
          setHovered(null);
          dirtyRef.current = true;
        }}
        aria-label={`3D contribution graph: ${data.calendar.total} contributions across ${data.calendar.activeDays} active days in the last 12 months. Drag to rotate.`}
        role="img"
      />
      {hovered && (
        <div
          className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded border border-border bg-bg-raised px-3 py-1.5 font-mono text-xs text-text-primary"
          role="status"
        >
          <span className="text-accent-add">{hovered.count}</span> on{" "}
          {hovered.date}
        </div>
      )}
      <p className="pointer-events-none absolute bottom-2 right-2 font-mono text-[0.65rem] text-text-muted">
        drag to orbit
      </p>
      {/* inView is read via the IO above; kept for potential CSS hooks */}
      <span hidden data-inview={inView} />
    </div>
  );
}
