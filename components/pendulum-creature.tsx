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
const CURSOR_FORCE = 1.2;
const CURSOR_INFLUENCE_RADIUS = 600;

const CART_LIMIT = 4.0;
const ANGLE_LIMIT = Math.PI * 0.4;

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

function drawCreature(
  ctx: CanvasRenderingContext2D,
  state: CreatureState,
  w: number,
  h: number,
) {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  const cx = w / 2;
  const railY = h * 0.7;
  const pxPerMeter = h * 0.16;

  const railLeft = cx - w * 0.44;
  const railRight = cx + w * 0.44;

  // Rail
  ctx.strokeStyle = COLORS.rail;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(railLeft, railY);
  ctx.lineTo(railRight, railY);
  ctx.stroke();

  // Tick marks
  ctx.lineWidth = 0.5;
  for (let tick = railLeft + 24; tick < railRight; tick += 24) {
    ctx.beginPath();
    ctx.moveTo(tick, railY - 2);
    ctx.lineTo(tick, railY + 2);
    ctx.stroke();
  }

  const cartX = cx + state.x * pxPerMeter;
  const cartW = 40;
  const cartH = 14;

  // Pendulum geometry
  const rodLen = PENDULUM_LENGTH * pxPerMeter;
  const bobX = cartX + Math.sin(state.theta) * rodLen;
  const bobY = railY - Math.cos(state.theta) * rodLen;
  const bobR = 14;

  // Rod
  ctx.strokeStyle = COLORS.rod;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cartX, railY - cartH / 2);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();

  // Cart
  ctx.fillStyle = COLORS.cartFill;
  ctx.strokeStyle = COLORS.cartStroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cartX - cartW / 2, railY - cartH, cartW, cartH, 2);
  ctx.fill();
  ctx.stroke();

  // Bob
  ctx.fillStyle = COLORS.bobFill;
  const stability = Math.max(0, 1 - Math.abs(state.theta) / ANGLE_LIMIT);
  ctx.strokeStyle = stability > 0.5 ? COLORS.stable : COLORS.bobStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bobX, bobY, bobR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes — shift with tilt
  const eyeOffset = Math.sin(state.theta) * 2.5;
  const eyeY = bobY - 2;
  ctx.fillStyle = COLORS.face;
  ctx.beginPath();
  ctx.arc(bobX - 4 + eyeOffset, eyeY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bobX + 4 + eyeOffset, eyeY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Stability bar
  const barW = 52;
  const barH = 2;
  const barX = cx - barW / 2;
  const barY = railY + 14;

  ctx.fillStyle = COLORS.rail;
  ctx.fillRect(barX, barY, barW, barH);

  const fillColor = stability > 0.5 ? COLORS.stable : COLORS.unstable;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, barW * stability, barH);
  ctx.globalAlpha = 1;

  // Angle readout
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = fillColor;
  ctx.globalAlpha = 0.6;
  const angleDeg = ((state.theta * 180) / Math.PI).toFixed(1);
  ctx.fillText(`\u03B8 ${angleDeg}\u00B0`, cx - 20, barY + 13);
  ctx.globalAlpha = 1;

  ctx.restore();
}

interface PendulumCreatureProps {
  className?: string;
}

export function PendulumCreature({ className = "" }: PendulumCreatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CreatureState>(createInitial());
  const cursorRef = useRef({ x: 0, y: 0, active: false, prevX: 0 });
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

    function resize() {
      const rect = cvs.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
    }
    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(cvs);

    const viewObs = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    viewObs.observe(heroEl);

    function onMouseMove(e: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      const localX = e.clientX - rect.left - rect.width / 2;
      const localY = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(localX * localX + localY * localY);

      if (dist < CURSOR_INFLUENCE_RADIUS) {
        cursorRef.current.prevX = cursorRef.current.x;
        cursorRef.current.x = localX;
        cursorRef.current.y = localY;
        cursorRef.current.active = true;
      } else {
        cursorRef.current.active = false;
      }
    }

    heroEl.addEventListener("mousemove", onMouseMove);

    function tick() {
      rafRef.current = requestAnimationFrame(tick);

      if (!visibleRef.current) return;

      const s = stateRef.current;

      let force = 0;

      // PD controller
      force -= KP * s.theta;
      force -= KD * s.omega;
      force -= K_POSITION * s.x;
      force -= K_VELOCITY * s.vx;

      // Cursor disturbance — velocity-based, scaled by distance
      if (cursorRef.current.active) {
        const vel = (cursorRef.current.x - cursorRef.current.prevX) * 60;
        const rect = cvs.getBoundingClientRect();
        const localX = cursorRef.current.x;
        const dist = Math.abs(localX);
        const proximity = Math.max(0, 1 - dist / (rect.width / 2));
        force += vel * CURSOR_FORCE * (0.3 + 0.7 * proximity);
      }

      // Idle noise
      force += (Math.random() - 0.5) * NOISE_STRENGTH;

      stepPhysics(s, force);

      const rect = cvs.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      drawCreature(context, s, w, h);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      heroEl.removeEventListener("mousemove", onMouseMove);
      resizeObs.disconnect();
      viewObs.disconnect();
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
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
