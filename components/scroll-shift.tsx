"use client";

import { type ReactNode } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import {
  useScrollProgress,
  clampProgress,
} from "@/lib/use-scroll-progress";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

interface ScrollShiftProps {
  children: ReactNode;
  direction?: "left" | "right";
  distance?: number;
  scaleFrom?: number;
  className?: string;
  progressRange?: [number, number];
}

export function ScrollShift({
  children,
  direction = "left",
  distance = 120,
  scaleFrom = 1,
  className,
  progressRange = [0, 0.45],
}: ScrollShiftProps) {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const sign = direction === "left" ? -1 : 1;

  const mapped = clampProgress(progress, progressRange);
  const settle = 1 - mapped;

  const springs = useSpring({
    x: reduced ? 0 : settle * sign * distance,
    scale: reduced ? 1 : scaleFrom + (1 - scaleFrom) * mapped,
    config: { tension: 120, friction: 26 },
  });

  return (
    <div ref={ref} className={className}>
      <animated.div
        style={{
          transform: to(
            [springs.x, springs.scale],
            (x, s) => `translate3d(${x}px, 0, 0) scale(${s})`,
          ),
        }}
      >
        {children}
      </animated.div>
    </div>
  );
}
