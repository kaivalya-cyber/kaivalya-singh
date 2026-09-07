"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

export function HeroAmbient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !svgRef.current) return;

    const paths = svgRef.current.querySelectorAll("path");
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.setAttribute("stroke-dasharray", String(length));
      path.setAttribute("stroke-dashoffset", String(length));
    });

    const animations = Array.from(paths).map((path, i) =>
      animate(path, {
        strokeDashoffset: [path.getTotalLength(), 0],
        duration: 4000 + i * 800,
        ease: "inOutSine",
        loop: true,
        alternate: true,
      }),
    );

    return () => animations.forEach((a) => a.pause());
  }, [reduced]);

  if (reduced) return null;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path
        d="M0 300 Q300 100 600 300 T1200 300"
        fill="none"
        stroke="#D29922"
        strokeWidth="1.5"
      />
      <path
        d="M0 350 Q400 500 800 350 T1200 350"
        fill="none"
        stroke="#A8A29E"
        strokeWidth="1"
      />
      <path
        d="M100 200 L400 400 L700 250 L1100 380"
        fill="none"
        stroke="#F47067"
        strokeWidth="0.75"
        strokeDasharray="4 6"
      />
      {/* Euler vs RK4 divergence — 845× variance motif */}
      <path
        d="M0 480 L100 468 L200 490 L300 440 L400 510 L500 420 L600 530 L700 400 L800 550 L900 380 L1000 570 L1100 360 L1200 590"
        fill="none"
        stroke="#F47067"
        strokeWidth="0.75"
      />
      <path
        d="M0 480 C300 470 600 465 1200 460"
        fill="none"
        stroke="#D29922"
        strokeWidth="0.75"
      />
    </svg>
  );
}
