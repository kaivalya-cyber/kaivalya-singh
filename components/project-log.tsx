"use client";

import { useMemo, useState } from "react";
import {
  domainLabels,
  projects,
  projectsByDomain,
  type Project,
} from "@/content/projects";
import { DiffReveal } from "@/components/diff-reveal";
import { ProjectLogEntry } from "@/components/project-log-entry";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";

/**
 * Cover art per flagship — each SVG is drawn from the project's real data
 * (syndrome lattice, pendulum trace, swarm arena, autograd DAG, season bars).
 */
const COVERS: Record<string, { src: string; alt: string; result: string; hue: string }> = {
  "variational-qec-decoder": {
    src: "/covers/qec-decoder.svg",
    alt: "Syndrome lattice with a bold logical-operator path and detected error cells",
    result: "LER ↓ 18.4% avg",
    hue: "#A48FD8",
  },
  "reward-shaping-lsr": {
    src: "/covers/reward-shaping-lsr.svg",
    alt: "Triple inverted pendulum poster with an LSR gauge at 0.515",
    result: "LSR 0.515 · 97% of LQR",
    hue: "#D29922",
  },
  "mappo-drone-swarm": {
    src: "/covers/mappo-drone-swarm.svg",
    alt: "Two teams of three drones converging on a shared objective in a hexagonal arena",
    result: "6 agents · CTDE",
    hue: "#6FB5AD",
  },
  puregrad: {
    src: "/covers/puregrad.svg",
    alt: "Autograd graph poster with forward pass and dashed backward gradient pass",
    result: "99.7% moons · 19/19 tests",
    hue: "#F47067",
  },
  "ftc-analytics-dataset": {
    src: "/covers/ftc-analytics.svg",
    alt: "Six seasons of match data as rising bars with the best model accuracy marked",
    result: "AUC 0.9412 · 1,762 matches",
    hue: "#A9B665",
  },
};

const featuredProjects = projects.filter((p) => p.flagship && COVERS[p.slug]);
const logProjects = projects.filter((p) => !(p.flagship && COVERS[p.slug]));

const featuredSlides: CoverflowSlide[] = featuredProjects.map((p) => ({
  src: COVERS[p.slug].src,
  alt: COVERS[p.slug].alt,
}));

interface DomainGroup {
  domain: (typeof projectsByDomain)[number];
  items: Project[];
  startIndex: number;
}

/** Frequency-ordered stack vocabulary across the logged projects */
function buildStackIndex(all: Project[]): string[] {
  const counts = new Map<string, number>();
  for (const p of all) {
    for (const s of p.stack) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([s]) => s)
    .slice(0, 14);
}

function FeaturedWork() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = featuredProjects[activeIdx] ?? featuredProjects[0];
  const cover = COVERS[active.slug];

  return (
    <div className="relative">
      {/* Ambient wash — the page takes on the centered project's hue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -inset-x-6 md:-inset-x-12"
      >
        {featuredProjects.map((p, i) => (
          <div
            key={p.slug}
            className="absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none"
            style={{
              opacity: i === activeIdx ? 1 : 0,
              background: `radial-gradient(55% 42% at 50% 30%, ${COVERS[p.slug].hue}3D 0%, transparent 74%), radial-gradient(140% 110% at 50% 0%, ${COVERS[p.slug].hue}1F 0%, transparent 60%), linear-gradient(to top, ${COVERS[p.slug].hue}1A 0%, transparent 36%)`,
            }}
          />
        ))}
      </div>

      <div className="relative">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-xs">
          <span className="text-text-muted" aria-hidden="true">
            ${" "}
          </span>
          <span style={{ color: cover.hue }}>git log</span>
          <span className="text-text-muted"> --featured --oneline</span>
        </p>
        <p className="font-mono text-[0.65rem] text-text-muted">
          drag · arrow keys · click a dot
        </p>
      </div>

      <CoverflowCarousel
        slides={featuredSlides}
        cardWidth="clamp(210px, 26vw, 330px)"
        showNavigation
        showPagination
        accent={cover.hue}
        onSelect={setActiveIdx}
        label="Featured projects"
        cardClassName="border border-border"
      />

      {/* Detail card for whichever flagship is centered */}
      <div
        key={active.slug}
        style={{ borderColor: `${cover.hue}50` }}
        className="mx-auto mt-2 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500 border bg-bg-raised/40 px-6 py-6 text-center"
      >
        <p
          className="font-mono text-[0.65rem] uppercase tracking-wide"
          style={{ color: cover.hue }}
        >
          {domainLabels[active.domain]} · {cover.result}
        </p>
        <h3 className="mt-2 font-display text-xl md:text-2xl">{active.title}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
          {active.summary}
        </p>

        {active.metrics && active.metrics.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {active.metrics.slice(0, 4).map((m) => (
              <span
                key={m.label}
                title={m.label + (m.context ? ` (${m.context})` : "")}
                className="border border-border px-2.5 py-1 font-mono text-xs"
              >
                <span
                  style={{ color: cover.hue }}
                  className="font-medium"
                >
                  {m.value}
                  {m.suffix ?? ""}
                </span>{" "}
                <span className="text-text-muted">{m.label}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs">
          <a
            href={`/projects/${active.slug}`}
            className="text-accent-link transition-colors hover:text-text-primary"
          >
            read the writeup →
          </a>
          {active.githubUrl && (
            <a
              href={active.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              source ↗
            </a>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export function ProjectLog() {
  const [query, setQuery] = useState<string | null>(null);

  const stackOptions = useMemo(() => buildStackIndex(logProjects), []);

  const filtered = useMemo(
    () =>
      query
        ? logProjects.filter((p) =>
            p.stack.some((s) => s.toLowerCase() === query.toLowerCase()),
          )
        : logProjects,
    [query],
  );

  const domainGroups: DomainGroup[] = useMemo(() => {
    const groups: DomainGroup[] = [];
    projectsByDomain.forEach((domain) => {
      const items = filtered.filter((p) => p.domain === domain);
      if (items.length === 0) return;
      const prevEnd = groups.length > 0
        ? groups[groups.length - 1].startIndex + groups[groups.length - 1].items.length
        : 0;
      groups.push({ domain, items, startIndex: prevEnd });
    });
    return groups;
  }, [filtered]);

  const shown = filtered.length;

  return (
    <section id="project-log" className="bg-bg px-6 py-24 md:px-12" aria-labelledby="project-log-heading">
      <div className="mx-auto max-w-6xl">
        <DiffReveal>
          <div className="mb-10 max-w-3xl">
            <p className="font-mono text-xs uppercase text-accent-add">
              Project Log
            </p>
            <h2 id="project-log-heading" className="mt-3 font-display text-3xl md:text-5xl">
              Separate pieces of work, each with a stable trace.
            </h2>
            <p className="mt-5 text-text-muted">
              Five flagships front the section as covers; the full history runs
              below, grouped by domain.
            </p>
          </div>
        </DiffReveal>

        {/* Featured flagship work */}
        <DiffReveal>
          <FeaturedWork />
        </DiffReveal>

        {/* Divider into the full history */}
        <div className="relative my-16" aria-hidden="true">
          <div className="border-t border-dashed border-border" />
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-bg px-4 font-mono text-[0.65rem] uppercase tracking-wide text-text-muted">
            full log — {logProjects.length} entries
          </span>
        </div>

        {/* grep-style stack filter */}
        <DiffReveal>
          <div className="mb-10 border border-border bg-bg-raised/40">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 font-mono text-xs">
              <span className="select-none text-text-muted" aria-hidden="true">
                $ grep -r
              </span>
              <span className="text-accent-add">
                {query ? `"${query}"` : ".*"}
              </span>
              <span className="select-none text-text-muted" aria-hidden="true">
                ./stack
              </span>
              {query && (
                <>
                  <span className="text-text-muted">
                    → {shown} match{shown === 1 ? "" : "es"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuery(null)}
                    className="ml-1 rounded border border-border px-1.5 py-0.5 text-text-muted transition-colors hover:border-accent-remove hover:text-accent-remove"
                  >
                    clear ✕
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
              {stackOptions.map((stack) => {
                const active = query === stack;
                return (
                  <button
                    key={stack}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setQuery(active ? null : stack)}
                    className={`rounded border px-2 py-1 font-mono text-xs transition-colors ${
                      active
                        ? "border-accent-add bg-accent-add/10 text-accent-add"
                        : "border-border text-text-muted hover:border-accent-link hover:text-accent-link"
                    }`}
                  >
                    {stack}
                  </button>
                );
              })}
            </div>
          </div>
        </DiffReveal>

        <div>
          {domainGroups.map(({ domain, items, startIndex }) => (
            <div key={domain} className="relative md:grid md:grid-cols-[10rem_1fr] md:gap-8">
              <div className="top-8 h-max py-8 md:sticky">
                <h3 className="font-mono text-xs uppercase text-text-muted">
                  {domainLabels[domain]}
                  <span className="ml-1.5 text-border" aria-hidden>
                    {"//"}
                  </span>
                </h3>
              </div>
              <div className="border-t border-border">
                {items.map((project, localIdx) => (
                  <ProjectLogEntry
                    key={project.slug}
                    project={project}
                    index={startIndex + localIdx}
                  />
                ))}
              </div>
            </div>
          ))}
          {domainGroups.length === 0 && (
            <p className="border border-border bg-bg-raised/40 px-4 py-6 font-mono text-sm text-text-muted">
              no matches — try a broader stack term
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
