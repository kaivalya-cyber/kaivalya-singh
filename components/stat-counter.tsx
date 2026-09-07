"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useSpring, animated, useInView } from "@react-spring/web";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import { formatMetricValue } from "@/lib/format-metric";

interface StatCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  context?: string;
  className?: string;
  size?: "sm" | "lg";
}

export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  label,
  context,
  className = "",
  size = "sm",
}: StatCounterProps) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ rootMargin: "-10% 0px", once: true });
  const [done, setDone] = useState(false);

  const { number } = useSpring({
    number: reduced || inView ? value : 0,
    config: { mass: 1, tension: 80, friction: 18 },
    onRest: () => setDone(true),
  });

  // Count-up completes → flash the "verified" tick, like a test runner.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2600);
    return () => clearTimeout(t);
  }, [done]);

  const sizeClass =
    size === "lg"
      ? "text-4xl md:text-5xl text-accent-add"
      : "text-xl md:text-2xl text-accent-add";

  return (
    <div ref={ref} className={className}>
      {label && (
        <p className="mb-1 font-mono text-xs uppercase tracking-wider text-text-muted">
          {label}
        </p>
      )}
      <span className="inline-flex items-baseline gap-1.5">
        <animated.span className={`font-mono tabular-nums ${sizeClass}`}>
          {number.to((n) => `${prefix}${formatMetricValue(n, value)}${suffix}`)}
        </animated.span>
        <span
          aria-hidden="true"
          className={`inline-block text-accent-add transition-all duration-300 ${
            done ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <Check className="h-3.5 w-3.5 self-center" strokeWidth={3} />
        </span>
        <span className="sr-only">{done ? " (verified)" : ""}</span>
      </span>
      {context && (
        <p className="mt-1 font-mono text-xs text-text-muted">{context}</p>
      )}
    </div>
  );
}
