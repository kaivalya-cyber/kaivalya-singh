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
 * dissolves when it leaves — both directions, no `once`. The node on the
 * spine is a button that toggles the domain filter.
 */
function TimelineEntry({
  project,
  index,
  activeDomain,
  onToggleDomain,
}: {
  project: Project;
  index: number;
  activeDomain: ProjectDomain | null;
  onToggleDomain: (domain: ProjectDomain) => void;
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
      {/* node on the line — click to filter the snake by this domain */}
      <div className="absolute left-4 top-8 z-10 md:left-1/2 md:top-10 md:-translate-x-1/2">
        <button
          type="button"
          aria-pressed={activeDomain === project.domain}
          aria-label={`${
            activeDomain === project.domain ? "Clear" : "Filter timeline by"
          } ${domainLabels[project.domain]} projects`}
          title={`filter by ${domainLabels[project.domain]}`}
          onClick={() => onToggleDomain(project.domain)}
          className="-m-2 grid size-8 cursor-pointer place-items-center rounded-full outline-none transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-accent-link motion-reduce:transition-none"
        >
          <span
            className="block size-3.5 rounded-full border-2 bg-bg transition-all duration-700 motion-reduce:transition-none"
            style={{
              borderColor: hue,
              backgroundColor:
                activeDomain === project.domain ? hue : undefined,
              boxShadow:
                activeDomain === project.domain
                  ? `0 0 18px ${hue}`
                  : visible
                    ? `0 0 14px ${hue}90`
                    : "none",
            }}
          />
        </button>
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
  const [domain, setDomain] = useState<ProjectDomain | null>(null);

  const toggleDomain = (next: ProjectDomain) =>
    setDomain((current) => (current === next ? null : next));

  /** Domain filter composes with the stack filter passed in from above. */
  const shown = domain
    ? projects.filter((p) => p.domain === domain)
    : projects;

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
      {/* grep-style status row for the domain filter */}
      <div className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 pl-10 font-mono text-xs md:pl-0" aria-live="polite">
        <span className="select-none text-text-muted" aria-hidden="true">
          $ timeline
        </span>
        <span className="text-accent-add">
          {domain ? `--domain ${domainLabels[domain].toLowerCase()}` : "--all"}
        </span>
        {domain && (
          <>
            <span className="text-text-muted">
              → {shown.length} entr{shown.length === 1 ? "y" : "ies"}
            </span>
            <button
              type="button"
              onClick={() => setDomain(null)}
              className="ml-1 rounded border border-border px-1.5 py-0.5 text-text-muted transition-colors hover:border-accent-remove hover:text-accent-remove"
            >
              clear ✕
            </button>
          </>
        )}
        {!domain && (
          <span className="text-text-muted/70">· click a node to filter by domain</span>
        )}
      </div>

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
        {shown.map((project, i) => (
          <TimelineEntry
            key={project.slug}
            project={project}
            index={i}
            activeDomain={domain}
            onToggleDomain={toggleDomain}
          />
        ))}
      </div>
    </div>
  );
}
