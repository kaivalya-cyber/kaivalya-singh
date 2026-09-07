"use client";

import { type ReactNode } from "react";
import { useSpring, animated, useInView, to } from "@react-spring/web";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

interface DiffRevealProps {
  children: ReactNode;
  className?: string;
  fromY?: number;
  fromX?: number;
  delay?: number;
}

export function DiffReveal({
  children,
  className,
  fromY = 20,
  fromX = 0,
  delay = 0,
}: DiffRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ rootMargin: "-8% 0px", once: true });

  const springs = useSpring({
    opacity: reduced || inView ? 1 : 0,
    y: reduced || inView ? 0 : fromY,
    x: reduced || inView ? 0 : fromX,
    delay: reduced ? 0 : delay,
    config: { tension: 280, friction: 60 },
  });

  return (
    <animated.div
      ref={ref}
      className={className}
      style={{
        opacity: springs.opacity,
        transform: to(
          [springs.x, springs.y],
          (x, y) => `translate3d(${x}px, ${y}px, 0)`,
        ),
      }}
    >
      {children}
    </animated.div>
  );
}
