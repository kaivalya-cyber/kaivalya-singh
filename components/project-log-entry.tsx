"use client";

import Link from "next/link";
import { ExternalLink, CornerDownRight } from "lucide-react";
import type { Project } from "@/content/projects";
import { domainLabels } from "@/content/projects";
import { slugToHash } from "@/lib/hash";
import { ScrollShift } from "@/components/scroll-shift";
import { StatCounter } from "@/components/stat-counter";

interface ProjectLogEntryProps {
  project: Project;
  index: number;
}

export function ProjectLogEntry({ project, index }: ProjectLogEntryProps) {
  const metric = project.metrics?.[0];
  const direction = index % 2 === 0 ? "left" : "right";

  return (
    <ScrollShift
      direction={direction}
      distance={96}
      scaleFrom={0.985}
      progressRange={[0.05, 0.42]}
      className="overflow-hidden"
    >
      <article
        id={project.slug}
        className="group relative border-b border-border py-8 md:grid md:grid-cols-[8rem_1fr] md:gap-8 md:py-10"
      >
        {/* Hover gutter accent */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 bg-accent-add/60 transition-transform duration-300 group-hover:scale-y-100"
        />

        <div className="mb-4 font-mono text-xs text-text-muted md:mb-0">
          <a href={`#${project.slug}`} className="text-accent-link">
            {slugToHash(project.slug)}
          </a>
          <p className="mt-2 uppercase">{domainLabels[project.domain]}</p>
        </div>

        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <h3 className="font-display text-xl leading-tight md:text-2xl">
              {project.title}
            </h3>
            {metric && (
              <StatCounter
                value={metric.value}
                prefix={metric.prefix}
                suffix={metric.suffix}
                label={metric.label}
                context={metric.context}
                className="shrink-0"
              />
            )}
          </div>

          <p className="mt-4 max-w-3xl leading-relaxed text-text-primary">
            {project.summary}
          </p>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Project stack">
            {project.stack.map((item) => (
              <li
                key={item}
                className="rounded border border-border px-2 py-1 font-mono text-xs text-text-muted transition-colors group-hover:border-border/80 group-hover:text-text-primary"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 font-mono text-sm">
            {project.flagship && (
              <Link
                href={`/projects/${project.slug}`}
                className="inline-flex items-center gap-2 py-2 text-accent-link hover:underline min-h-[44px]"
              >
                <CornerDownRight className="h-3.5 w-3.5" aria-hidden />
                Read the writeup
                <span
                  className="rounded border border-accent-add/40 px-1.5 py-0.5 text-[0.65rem] uppercase text-accent-add"
                  aria-label="Full writeup available"
                >
                  writeup
                </span>
              </Link>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2 text-accent-link hover:underline min-h-[44px]"
              >
                GitHub
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            {!project.flagship && !project.githubUrl && (
              <span className="py-2 text-text-muted">repo private — ask me about it</span>
            )}
          </div>
        </div>
      </article>
    </ScrollShift>
  );
}
