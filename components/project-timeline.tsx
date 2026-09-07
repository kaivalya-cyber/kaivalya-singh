"use client";

import { useEffect, useRef, useState } from "react";
import {
  domainLabels,
  type Project,
  type ProjectDomain,
} from "@/content/projects";

/** Domain hues — the same system the featured posters use. */
const DOMAIN_HUES: Record<ProjectDomain, string> = {
  quantum: "#A48FD8",
  rl: "#D29922",
  marl: "#6FB5AD",
  cv: "#F47067",
  systems: "#A9B665",
  web: "#D8B478",
};

/**
 * One entry on the snake timeline. Appears when it scrolls into view and
 * dissolves when it leaves — both directions, no `once`.
 */
function TimelineEntry({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const side = index % 2 === 0 ? "left" : "right";
  const hue = DOMAIN_HUES[project.domain];

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "-12% 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative py-6 md:grid md:grid-cols-[1fr_5rem_1fr] md:py-10"
    >
      {/* node on the line */}
      <div className="absolute left-4 top-8 md:left-1/2 md:top-10 md:-translate-x-1/2">
        <span
          className="block size-3.5 rounded-full border-2 bg-bg transition-all duration-700"
          style={{
            borderColor: hue,
            boxShadow: visible ? `0 0 14px ${hue}90` : "none",
          }}
        />
      </div>

      {/* card — left, right, or full width on mobile */}
      <div
        className={`ml-10 md:ml-0 ${
          side === "left" ? "md:col-start-1 md:pr-4" : "md:col-start-3 md:pl-4"
        } transition-all duration-700 ease-out motion-reduce:transition-none ${
          visible
            ? "translate-y-0 scale-100 opacity-100 blur-0"
            : "translate-y-10 scale-[0.97] opacity-0 blur-[2px]"
        }`}
      >
        <article className="group border border-border bg-bg-raised/60 p-5 transition-colors hover:border-text-muted md:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide"
                style={{ color: hue, borderColor: `${hue}55` }}
              >
                {domainLabels[project.domain]}
              </span>
            </div>
            {project.metrics && project.metrics[0] && (
              <span className="hidden font-mono text-xs text-text-muted sm:block">
                <span className="font-medium" style={{ color: hue }}>
                  {project.metrics[0].value}
                  {project.metrics[0].suffix ?? ""}
                </span>{" "}
                {project.metrics[0].label}
              </span>
            )}
          </div>

          <h3 className="mt-3 font-display text-lg md:text-xl">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors group-hover:text-accent-link"
              >
                {project.title} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              project.title
            )}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {project.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span
                key={s}
                className="border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

/**
 * The full project history as a snake timeline: a center line that fills
 * with scroll progress, cards alternating sides, each entry dissolving in
 * and out as it crosses the viewport.
 */
export function ProjectTimeline({ projects }: { projects: Project[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const fill = fillRef.current;
    if (!wrap || !fill) return;

    let raf = 0;
    const update = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh * 0.25;
      const passed = Math.min(1, Math.max(0, (vh * 0.65 - r.top) / total));
      fill.style.height = `${passed * 100}%`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {/* the snake's spine: base rail + scroll-charged fill */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-4 top-0 w-px bg-border md:left-1/2 md:-translate-x-1/2"
      />
      <div
        ref={fillRef}
        aria-hidden="true"
        className="absolute left-4 top-0 w-px bg-accent-add shadow-[0_0_14px_rgba(210,153,34,0.7)] md:left-1/2 md:-translate-x-1/2"
        style={{ height: "0%" }}
      />

      <div>
        {projects.map((project, i) => (
          <TimelineEntry key={project.slug} project={project} index={i} />
        ))}
      </div>
    </div>
  );
}
