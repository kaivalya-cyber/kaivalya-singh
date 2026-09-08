"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

const COLORS = {
  bg: "#0E0D0B",
  bgRaised: "#16140F",
  rail: "#2A261E",
  cartFill: "#211d15",
  cartStroke: "#D8B478",
  rod: "#D8B478",
  bobFill: "#0E0D0B",
  bobStroke: "#D8D2C4",
  face: "#8F887A",
  stable: "#D29922",
  unstable: "#F47067",
} as const;

const DT = 1 / 60;
const SUB_STEPS = 4;

const GRAVITY = 9.81;
const PENDULUM_LENGTH = 1.6;
const CART_MASS = 1.0;
const PENDULUM_MASS = 0.3;
const TOTAL_MASS = CART_MASS + PENDULUM_MASS;

const KP = 4.5;
const KD = 2.0;
const K_POSITION = 0.4;
const K_VELOCITY = 1.0;

const DAMPING = 0.9985;
const NOISE_STRENGTH = 0.02;
const CART_LIMIT = 4.0;
const ANGLE_LIMIT = Math.PI * 0.4;

/** Cursor interaction tuning. */
const FIELD_RADIUS = 150;
const FIELD_STRENGTH = 2.4;
const GRAB_RADIUS = 30;
const CART_SHOVE = 2.4;
const POKE_KICK = 1.5;
const TRAIL_LENGTH = 36;

interface CreatureState {
  x: number;
  vx: number;
  theta: number;
  omega: number;
}

function createInitial(): CreatureState {
  return { x: 0, vx: 0, theta: (Math.random() - 0.5) * 0.06, omega: 0 };
}

function stepPhysics(s: CreatureState, force: number): void {
  const subDt = DT / SUB_STEPS;

  for (let i = 0; i < SUB_STEPS; i++) {
    const sinT = Math.sin(s.theta);
    const cosT = Math.cos(s.theta);

    const cartAccel =
      (force +
        PENDULUM_LENGTH *
          sinT *
          (s.omega * s.omega * PENDULUM_MASS -
            (GRAVITY * PENDULUM_MASS * cosT) / PENDULUM_LENGTH)) /
      (TOTAL_MASS - PENDULUM_MASS * cosT * cosT);

    const angleAccel =
      (GRAVITY * sinT * TOTAL_MASS -
        cosT *
          (force +
            PENDULUM_LENGTH * sinT * s.omega * s.omega * PENDULUM_MASS)) /
      (PENDULUM_LENGTH * (TOTAL_MASS - PENDULUM_MASS * cosT * cosT));

    s.vx += cartAccel * subDt;
    s.x += s.vx * subDt;
    s.omega += angleAccel * subDt;
    s.theta += s.omega * subDt;

    s.vx *= DAMPING;
    s.omega *= DAMPING;

    s.x = Math.max(-CART_LIMIT, Math.min(CART_LIMIT, s.x));
    if (s.theta > ANGLE_LIMIT) {
      s.theta = ANGLE_LIMIT;
      s.omega *= -0.3;
    } else if (s.theta < -ANGLE_LIMIT) {
      s.theta = -ANGLE_LIMIT;
      s.omega *= -0.3;
    }
  }
}

/** Shared canvas-space geometry for drawing and hit-testing. */
function geometry(s: CreatureState, w: number, h: number) {
  const cx = w / 2;
  const railY = h * 0.7;
  const pxPerMeter = h * 0.16;
  const cartX = cx + s.x * pxPerMeter;
  const cartW = 40;
  const cartH = 14;
  const rodLen = PENDULUM_LENGTH * pxPerMeter;
  const bobX = cartX + Math.sin(s.theta) * rodLen;
  const bobY = railY - Math.cos(s.theta) * rodLen;
  const bobR = 14;
  return { cx, railY, pxPerMeter, cartX, cartW, cartH, rodLen, bobX, bobY, bobR };
}

interface DrawExtras {
  cursor: { x: number; y: number; active: boolean };
  grabbed: boolean;
  force: number;
  trail: { x: number; y: number; stable: boolean }[];
  pokeFlash: number;
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  state: CreatureState,
  w: number,
  h: number,
  extras: DrawExtras,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  const g = geometry(state, w, h);
  const stability = Math.max(0, 1 - Math.abs(state.theta) / ANGLE_LIMIT);
  const fillColor = stability > 0.5 ? COLORS.stable : COLORS.unstable;

  // Motion trail — a fading ribbon behind the bob.
  if (extras.trail.length > 1) {
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    for (let i = 1; i < extras.trail.length; i++) {
      const a = extras.trail[i - 1];
      const b = extras.trail[i];
      const t = i / extras.trail.length;
      ctx.globalAlpha = t * 0.35;
      ctx.strokeStyle = b.stable ? COLORS.stable : COLORS.unstable;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Rail
  ctx.strokeStyle = COLORS.rail;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(g.cx - w * 0.44, g.railY);
  ctx.lineTo(g.cx + w * 0.44, g.railY);
  ctx.stroke();

  // Tick marks
  ctx.lineWidth = 0.5;
  for (
    let tick = g.cx - w * 0.44 + 24;
    tick < g.cx + w * 0.44;
    tick += 24
  ) {
    ctx.beginPath();
    ctx.moveTo(tick, g.railY - 2);
    ctx.lineTo(tick, g.railY + 2);
    ctx.stroke();
  }

  // Cursor field — a soft ring where the pointer bends the physics.
  if (extras.cursor.active && !extras.grabbed) {
    const dist = Math.hypot(
      extras.cursor.x - g.bobX,
      extras.cursor.y - g.bobY,
    );
    const prox = Math.exp(-((dist / FIELD_RADIUS) ** 2));
    if (prox > 0.04) {
      ctx.strokeStyle = COLORS.stable;
      ctx.globalAlpha = 0.10 + prox * 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(extras.cursor.x, extras.cursor.y, 22 + prox * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Poke flash — an expanding ring when the creature is kicked.
  if (extras.pokeFlash > 0) {
    ctx.strokeStyle = COLORS.unstable;
    ctx.globalAlpha = extras.pokeFlash * 0.5;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(g.bobX, g.bobY, g.bobR + (1 - extras.pokeFlash) * 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Rod
  ctx.strokeStyle = COLORS.rod;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.cartX, g.railY - g.cartH / 2);
  ctx.lineTo(g.bobX, g.bobY);
  ctx.stroke();

  // Cart
  ctx.fillStyle = COLORS.cartFill;
  ctx.strokeStyle = COLORS.cartStroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(
    g.cartX - g.cartW / 2,
    g.railY - g.cartH,
    g.cartW,
    g.cartH,
    2,
  );
  ctx.fill();
  ctx.stroke();

  // Controller force arrow — what the PID is doing right now.
  const fNorm = extras.force / 8;
  const arrowLen = Math.max(-70, Math.min(70, fNorm * 140));
  if (Math.abs(arrowLen) > 3) {
    const ay = g.railY - g.cartH / 2;
    const ax0 = g.cartX + Math.sign(arrowLen) * (g.cartW / 2 + 4);
    const ax1 = ax0 + arrowLen;
    const saturating = Math.abs(extras.force) > 7.5;
    ctx.strokeStyle = saturating ? COLORS.unstable : COLORS.stable;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax0, ay);
    ctx.lineTo(ax1, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax1, ay);
    ctx.lineTo(ax1 - Math.sign(arrowLen) * 5, ay - 3);
    ctx.lineTo(ax1 - Math.sign(arrowLen) * 5, ay + 3);
    ctx.closePath();
    ctx.fillStyle = saturating ? COLORS.unstable : COLORS.stable;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Bob
  ctx.fillStyle = COLORS.bobFill;
  const hoverable = extras.grabbed || stability <= 0.5;
  ctx.strokeStyle = hoverable ? COLORS.stable : COLORS.bobStroke;
  ctx.lineWidth = extras.grabbed ? 2.5 : 2;
  ctx.beginPath();
  ctx.arc(g.bobX, g.bobY, g.bobR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes — shift with tilt, widen when grabbed
  const eyeOffset = Math.sin(state.theta) * 2.5;
  const eyeY = g.bobY - 2;
  const eyeR = extras.grabbed ? 2.2 : 1.5;
  ctx.fillStyle = COLORS.face;
  ctx.beginPath();
  ctx.arc(g.bobX - 4 + eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(g.bobX + 4 + eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Stability bar
  const barW = 52;
  const barH = 2;
  const barX = g.cx - barW / 2;
  const barY = g.railY + 14;

  ctx.fillStyle = COLORS.rail;
  ctx.fillRect(barX, barY, barW, barH);

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, barW * stability, barH);
  ctx.globalAlpha = 1;

  // Controller-effort bar — how hard the PID is working.
  const effort = Math.min(1, Math.abs(extras.force) / 10);
  const effortY = barY + 7;
  ctx.fillStyle = COLORS.rail;
  ctx.fillRect(barX, effortY, barW, barH);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = effort > 0.75 ? COLORS.unstable : COLORS.stable;
  ctx.fillRect(
    g.cx - (barW / 2) * Math.sign(extras.force || 1) * effort,
    effortY,
    (barW / 2) * effort,
    barH,
  );
  ctx.globalAlpha = 1;
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillStyle = COLORS.rail;
  ctx.fillText("u", barX + barW + 6, effortY + 3);

  // Angle readout
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = fillColor;
  ctx.globalAlpha = 0.6;
  const angleDeg = ((state.theta * 180) / Math.PI).toFixed(1);
  ctx.fillText(`\u03B8 ${angleDeg}\u00B0`, g.cx - 20, barY + 27);
  ctx.globalAlpha = 1;

  ctx.restore();
}

interface PendulumCreatureProps {
  className?: string;
}

export function PendulumCreature({ className = "" }: PendulumCreatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CreatureState>(createInitial());
  const cursorRef = useRef({ x: 0, y: 0, active: false });
  const grabRef = useRef<{
    active: boolean;
    prevTheta: number;
    lastT: number;
  } | null>(null);
  const forceRef = useRef(0);
  const pokeRef = useRef(0);
  const pokeFlashRef = useRef(0);
  const trailRef = useRef<{ x: number; y: number; stable: boolean }[]>([]);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const heroEl = canvas.closest("section");
    if (!heroEl) return;

    const cvs = canvas;
    const context = ctx;
    const dpr = window.devicePixelRatio || 1;

    const updateRect = () => {
      rectRef.current = cvs.getBoundingClientRect();
    };

    function resize() {
      const rect = cvs.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      updateRect();
    }
    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(cvs);
    window.addEventListener("scroll", updateRect, { passive: true });

    const viewObs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    viewObs.observe(heroEl);

    const toLocal = (clientX: number, clientY: number) => {
      const rect = rectRef.current ?? cvs.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    /** Where is the pointer relative to the creature's parts? */
    const hitTest = (lx: number, ly: number) => {
      const rect = rectRef.current;
      if (!rect) return { part: "none" as const };
      const s = stateRef.current;
      const g = geometry(s, rect.width, rect.height);
      const bobDist = Math.hypot(lx - g.bobX, ly - g.bobY);
      if (bobDist < GRAB_RADIUS) return { part: "bob" as const };
      if (
        Math.abs(lx - g.cartX) < g.cartW / 2 + 12 &&
        Math.abs(ly - (g.railY - g.cartH / 2)) < g.cartH
      )
        return { part: "cart" as const };
      return { part: "none" as const };
    };

    /** Ambient field: the cursor bends the physics anywhere in the hero. */
    function onPointerMove(e: PointerEvent) {
      const local = toLocal(e.clientX, e.clientY);
      cursorRef.current.x = local.x;
      cursorRef.current.y = local.y;
      cursorRef.current.active = true;

      if (grabRef.current?.active) {
        const rect = rectRef.current;
        if (!rect) return;
        const s = stateRef.current;
        const g = geometry(s, rect.width, rect.height);
        const pivotX = g.cartX;
        const pivotY = g.railY - g.cartH / 2;
        const target = Math.max(
          -ANGLE_LIMIT,
          Math.min(ANGLE_LIMIT, Math.atan2(local.x - pivotX, pivotY - local.y)),
        );
        const now = performance.now();
        const dt = Math.max(1, now - grabRef.current.lastT) / 1000;
        s.omega = (target - grabRef.current.prevTheta) / dt;
        grabRef.current.prevTheta = target;
        grabRef.current.lastT = now;
        s.theta = target;
      } else {
        cvs.style.cursor = hitTest(local.x, local.y).part === "bob"
          ? "grab"
          : "default";
      }
    }

    function onPointerDown(e: PointerEvent) {
      const local = toLocal(e.clientX, e.clientY);
      const hit = hitTest(local.x, local.y);
      const s = stateRef.current;

      if (hit.part === "bob") {
        // Grab the bob — hold it anywhere, release to fling.
        const rect = rectRef.current;
        if (!rect) return;
        const g = geometry(s, rect.width, rect.height);
        grabRef.current = {
          active: true,
          prevTheta: s.theta,
          lastT: performance.now(),
        };
        s.omega = 0;
        cvs.style.cursor = "grabbing";
        cvs.setPointerCapture(e.pointerId);
        e.preventDefault();
      } else if (hit.part === "cart") {
        // Shove the cart — a slap in the direction you hit it.
        const rect = rectRef.current;
        if (!rect) return;
        const g = geometry(s, rect.width, rect.height);
        s.vx += Math.sign(local.x - g.cartX) * CART_SHOVE;
        pokeFlashRef.current = 0.6;
        e.preventDefault();
      }
    }

    function onPointerUp() {
      if (grabRef.current?.active) {
        grabRef.current = null;
        cvs.style.cursor = "grab";
      }
    }

    function onPointerLeave() {
      cursorRef.current.active = false;
    }

    heroEl.addEventListener("pointermove", onPointerMove);
    cvs.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    heroEl.addEventListener("pointerleave", onPointerLeave);

    /** Poke button / external kicks. */
    const poke = () => {
      pokeRef.current = (Math.random() > 0.5 ? 1 : -1) * POKE_KICK;
      pokeFlashRef.current = 1;
    };
    const pokeBtn = cvs.parentElement?.querySelector("[data-poke]");
    pokeBtn?.addEventListener("click", poke);

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      if (!visibleRef.current) return;

      const s = stateRef.current;
      const rect = rectRef.current;
      const w = rect?.width ?? 0;
      const h = rect?.height ?? 0;

      let force = 0;
      const grabbed = grabRef.current?.active ?? false;

      if (grabbed) {
        // The visitor holds the bob; the cart auto-balances by driving
        // underneath it. Holding the pole at angle θ requires the pivot to
        // accelerate at g·tanθ — the classic cart-pole equilibrium — so the
        // controller feeds that forward and damps the drift. Push the bob
        // left or right and the cart visibly chases under it.
        force += TOTAL_MASS * GRAVITY * Math.tan(s.theta) * 0.92;
        force -= K_VELOCITY * s.vx * 0.55;
      } else {
        // PD controller
        force -= KP * s.theta;
        force -= KD * s.omega;
        force -= K_POSITION * s.x;
        force -= K_VELOCITY * s.vx;

        // Cursor field — pushes the bob away from the pointer.
        if (cursorRef.current.active && w > 0) {
          const g = geometry(s, w, h);
          const dx = g.bobX - cursorRef.current.x;
          const dy = g.bobY - cursorRef.current.y;
          const dist = Math.hypot(dx, dy) || 1;
          const prox = Math.exp(-((dist / FIELD_RADIUS) ** 2));
          if (prox > 0.02) {
            // Pushing the bob sideways maps to an opposing cart force.
            force -= (dx / dist) * FIELD_STRENGTH * prox;
          }
        }
      }

      // Poke kick
      if (pokeRef.current !== 0) {
        s.omega += pokeRef.current;
        pokeRef.current = 0;
      }
      if (pokeFlashRef.current > 0) {
        pokeFlashRef.current = Math.max(0, pokeFlashRef.current - 0.03);
      }

      // Idle noise (suspended while the visitor holds the bob)
      if (!grabbed) force += (Math.random() - 0.5) * NOISE_STRENGTH;

      stepPhysics(s, force);
      forceRef.current = force;

      // Trail
      if (w > 0) {
        const g = geometry(s, w, h);
        const stability = Math.max(0, 1 - Math.abs(s.theta) / ANGLE_LIMIT);
        trailRef.current.push({
          x: g.bobX,
          y: g.bobY,
          stable: stability > 0.5,
        });
        if (trailRef.current.length > TRAIL_LENGTH) trailRef.current.shift();
      }

      if (w > 0 && h > 0) {
        drawCreature(context, s, w, h, {
          cursor: cursorRef.current,
          grabbed,
          force,
          trail: trailRef.current,
          pokeFlash: pokeFlashRef.current,
        });
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      heroEl.removeEventListener("pointermove", onPointerMove);
      cvs.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      heroEl.removeEventListener("pointerleave", onPointerLeave);
      pokeBtn?.removeEventListener("click", poke);
      resizeObs.disconnect();
      viewObs.disconnect();
      window.removeEventListener("scroll", updateRect);
    };
  }, []);

  if (reduced) {
    return (
      <div
        className={`pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 500 360"
          className="h-full w-full"
          role="img"
          aria-label="Inverted pendulum illustration"
        >
          <line
            x1="55"
            y1="252"
            x2="445"
            y2="252"
            stroke={COLORS.rail}
            strokeWidth="1"
          />
          <rect
            x="230"
            y="238"
            width="40"
            height="14"
            rx="2"
            fill={COLORS.cartFill}
            stroke={COLORS.cartStroke}
            strokeWidth="1"
          />
          <line
            x1="250"
            y1="238"
            x2="250"
            y2="100"
            stroke={COLORS.rod}
            strokeWidth="2"
          />
          <circle
            cx="250"
            cy="86"
            r="14"
            fill={COLORS.bobFill}
            stroke={COLORS.stable}
            strokeWidth="2"
          />
          <circle cx="246" cy="84" r="1.5" fill={COLORS.face} />
          <circle cx="254" cy="84" r="1.5" fill={COLORS.face} />
          <rect
            x="224"
            y="266"
            width="52"
            height="2"
            fill={COLORS.stable}
            opacity="0.7"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`select-none ${className}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: "auto" }}
      />
      <div className="pointer-events-auto absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[0.6rem] text-text-muted">
        <button
          type="button"
          data-poke
          className="border border-border bg-bg-raised/70 px-2 py-1 transition-colors hover:border-accent-add hover:text-accent-add"
        >
          [ poke ]
        </button>
        <span className="hidden sm:inline">
          push · grab the bob — the cart drives to catch it · shove the cart
        </span>
      </div>
    </div>
  );
}
