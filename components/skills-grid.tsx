"use client";

import { useTrail, animated } from "@react-spring/web";
import { skillGroups } from "@/content/skills";
import { DiffReveal } from "@/components/diff-reveal";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

export function SkillsGrid() {
  const reduced = usePrefersReducedMotion();
  const trail = useTrail(skillGroups.length, {
    from: { opacity: 0, y: reduced ? 0 : 28, rotate: reduced ? 0 : -1.5, scale: 0.98 },
    to: { opacity: 1, y: 0, rotate: 0, scale: 1 },
    delay: reduced ? 0 : 120,
    config: { tension: 220, friction: 28 },
  });

  return (
    <section aria-labelledby="skills" className="border-y border-border bg-bg-raised/45 px-6 py-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <DiffReveal>
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs uppercase text-accent-add">
              Skill Map
            </p>
            <h2 id="skills" className="mt-3 font-display text-3xl md:text-5xl">
              Tools grouped by the systems they belong to.
            </h2>
          </div>
        </DiffReveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trail.map((style, index) => {
            const group = skillGroups[index];
            return (
              <animated.div
                key={group.label}
                style={{
                  opacity: style.opacity,
                  transform: style.y.to(
                    (y) =>
                      `translate3d(${index % 2 === 0 ? -y : y}px, ${y}px, 0)`,
                  ),
                }}
                className="border border-border bg-bg px-5 py-5"
              >
                <h3 className="font-display text-lg">{group.label}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded border border-border px-2 py-1 font-mono text-xs text-text-muted"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </animated.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
