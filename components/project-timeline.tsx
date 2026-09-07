"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

/** SSR-safe layout effect (same shim the coverflow uses). */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * One entry on the snake timeline. Appears when it scrolls into view and
 * dissolves when it leaves — both directions, no `once`. The node sitting
 * on the snake in the gap above the card is a button that toggles the
 * domain filter.
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
      {/* node on the snake, in the band above the card — click to filter */}
      <div
        className={`absolute left-4 top-0 z-10 -translate-x-1/2 ${
          side === "left" ? "md:left-[25%]" : "md:left-[75%]"
        }`}
      >
        <button
          type="button"
          aria-pressed={activeDomain === project.domain}
          aria-label={`${
            activeDomain === project.domain ? "Clear" : "Filter timeline by"
          } ${domainLabels[project.domain]} projects`}
          title={`filter by ${domainLabels[project.domain]}`}
          onClick={() => onToggleDomain(project.domain)}
          className="grid size-8 cursor-pointer place-items-center rounded-full outline-none transition-transform hover:scale-125 focus-visible:ring-2 focus-visible:ring-accent-link motion-reduce:transition-none"
        >
          <span
            data-node
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
 * The full project history as a snake timeline: a single winding path that
 * serpentes between the alternating cards — swinging out to each node in the
 * open band above a card, then crossing the center channel beside the next
 * one. The amber glow charges along the path with scroll progress.
 */
export function ProjectTimeline({ projects }: { projects: Project[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const [domain, setDomain] = useState<ProjectDomain | null>(null);
  const [pathD, setPathD] = useState("");

  const toggleDomain = (next: ProjectDomain) =>
    setDomain((current) => (current === next ? null : next));

  /** Domain filter composes with the stack filter passed in from above. */
  const shown = domain
    ? projects.filter((p) => p.domain === domain)
    : projects;
  const shownKey = shown.map((p) => p.slug).join("|");

  /**
   * Measure the node dots and build one smooth path through them: vertical
   * tangents at every node, so the curve leaves each dot head-on and swings
   * across the middle channel on the way to the next.
   */
  const rebuildPath = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wRect = wrap.getBoundingClientRect();
    const dots = Array.from(wrap.querySelectorAll<HTMLElement>("[data-node]"));
    if (dots.length === 0) {
      setPathD("");
      return;
    }
    const pts = dots.map((dot) => {
      const r = dot.getBoundingClientRect();
      return {
        x: r.left - wRect.left + r.width / 2,
        y: r.top - wRect.top + r.height / 2,
      };
    });
    // Tail: run the last segment down to the bottom of the section.
    const all = [...pts, { x: pts[pts.length - 1].x, y: wRect.height }];

    let d = `M ${all[0].x.toFixed(1)} ${all[0].y.toFixed(1)}`;
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i];
      const b = all[i + 1];
      const dy = (b.y - a.y) / 2;
      d += ` C ${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)}, ${b.x.toFixed(1)} ${(
        b.y - dy
      ).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    setPathD(d);
  }, []);

  // Re-measure on layout changes and whenever the filtered set re-forms.
  useEffect(() => {
    rebuildPath();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(rebuildPath);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [rebuildPath, shownKey]);

  /** Charge the glow along the path with scroll progress. */
  const updateFill = useCallback(() => {
    const wrap = wrapRef.current;
    const fill = fillRef.current;
    if (!wrap || !fill || !lenRef.current) return;
    const r = wrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height + vh * 0.25;
    const passed = Math.min(1, Math.max(0, (vh * 0.65 - r.top) / total));
    fill.style.strokeDashoffset = `${lenRef.current * (1 - passed)}`;
  }, []);

  // Size the dash to the path before first paint so nothing flashes full.
  useIsoLayoutEffect(() => {
    const fill = fillRef.current;
    if (!fill || !pathD) {
      lenRef.current = 0;
      return;
    }
    const len = fill.getTotalLength();
    lenRef.current = len;
    fill.style.strokeDasharray = String(len);
    updateFill();
  }, [pathD, updateFill]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateFill);
    };
    updateFill();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateFill]);

  return (
    <div ref={wrapRef} className="relative">
      {/* grep-style status row for the domain filter */}
      <div
        className="relative mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 pl-10 font-mono text-xs md:pl-0"
        aria-live="polite"
      >
        <span className="select-none text-text-muted" aria-hidden="true">
          $ timeline
        </span>
        <span className="text-accent-add">
          {domain
            ? `--domain ${domainLabels[domain].toLowerCase()}`
            : "--all"}
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
          <span className="text-text-muted/70">
            · click a node to filter by domain
          </span>
        )}
      </div>

      {/* the snake: one winding path, base rail + scroll-charged glow */}
      {pathD && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d={pathD}
            fill="none"
            className="stroke-border"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <path
            ref={fillRef}
            d={pathD}
            fill="none"
            className="stroke-accent-add"
            strokeWidth={2}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(210,153,34,0.7))",
            }}
          />
        </svg>
      )}

      {/* positioned above the svg so the snake weaves behind the cards */}
      <div className="relative">
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
