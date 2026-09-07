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

interface DomainGroup {
  domain: (typeof projectsByDomain)[number];
  items: Project[];
  startIndex: number;
}

/** Frequency-ordered stack vocabulary across all projects */
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

export function ProjectLog() {
  const [query, setQuery] = useState<string | null>(null);

  const stackOptions = useMemo(() => buildStackIndex(projects), []);

  const filtered = useMemo(
    () =>
      query
        ? projects.filter((p) =>
            p.stack.some((s) => s.toLowerCase() === query.toLowerCase()),
          )
        : projects,
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
          <div className="mb-8 max-w-3xl">
            <p className="font-mono text-xs uppercase text-accent-add">
              Project Log
            </p>
            <h2 id="project-log-heading" className="mt-3 font-display text-3xl md:text-5xl">
              Separate pieces of work, each with a stable trace.
            </h2>
            <p className="mt-5 text-text-muted">
              Flagship work opens into dedicated writeups; smaller projects stay
              compact so the signal does not get diluted.
            </p>
          </div>
        </DiffReveal>

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
