"use client";

import { animated, useSpring } from "@react-spring/web";
import { strengths } from "@/content/strengths";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import { StatCounter } from "@/components/stat-counter";

export function StrengthsStrip() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const spring = useSpring({
    x: reduced ? 0 : (progress - 0.5) * -360,
    config: { tension: 95, friction: 24 },
  });

  return (
    <section
      id="impact"
      ref={ref}
      className="overflow-hidden bg-bg px-6 py-24 md:px-12"
      aria-labelledby="impact-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="font-mono text-xs uppercase text-accent-add">Impact</p>
          <h2 id="impact-heading" className="mt-3 font-display text-3xl md:text-5xl">
            Results that survived contact with tests, readers, and teams.
          </h2>
        </div>

        <animated.div
          style={{ transform: spring.x.to((x) => `translate3d(${x}px, 0, 0)`) }}
          className="flex w-max gap-4"
        >
          {strengths.map((strength) => (
            <div
              key={`${strength.label}-${strength.context}`}
              className="flex w-[18rem] shrink-0 flex-col border border-border bg-bg-raised p-5 md:w-[22rem]"
            >
              <div className="flex-1">
                <StatCounter
                  value={strength.value}
                  prefix={strength.prefix}
                  suffix={strength.suffix}
                  label={strength.label}
                  context={strength.context}
                  size="lg"
                />
              </div>
              {strength.extras && strength.extras.length > 0 && (
                <ul className="mt-4 space-y-1 border-t border-border pt-3 font-mono text-xs text-text-muted">
                  {strength.extras.map((extra) => (
                    <li key={extra.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-text-primary">{extra.value}</span>
                      <span className="text-right">{extra.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </animated.div>
      </div>
    </section>
  );
}
