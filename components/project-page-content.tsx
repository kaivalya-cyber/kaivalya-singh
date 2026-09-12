"use client";

import Link from "next/link";
import { ExternalLink, ArrowLeft, ArrowRight } from "lucide-react";
import { useTrail, animated, useSpring, useInView } from "@react-spring/web";
import type { Project } from "@/content/projects";
import { domainLabels } from "@/content/projects";
import { slugToHash } from "@/lib/hash";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import { StatCounter } from "@/components/stat-counter";
import { DiffReveal } from "@/components/diff-reveal";
import { ProjectFigure } from "@/components/project-figure";
import { RepoTelemetry } from "@/components/repo-telemetry";
import { ProseReveal } from "@/components/prose-reveal";
import { projectWriteups, projectWriteupIntro } from "@/content/writeups";

interface ProjectPageContentProps {
  project: Project;
  prevProject: Project | null;
  nextProject: Project | null;
}

export function ProjectPageContent({
  project,
  prevProject,
  nextProject,
}: ProjectPageContentProps) {
  const reduced = usePrefersReducedMotion();

  const writeup = projectWriteups[project.slug] ?? [];
  const intro = projectWriteupIntro[project.slug] ?? project.summary;
  const stats = project.metrics?.slice(0, 3) ?? [];

  const headerTrail = useTrail(5, {
    from: { opacity: 0, y: reduced ? 0 : 18 },
    to: { opacity: 1, y: 0 },
    delay: reduced ? 0 : 80,
    config: { tension: 260, friction: 30 },
  });

  const [statRef, statInView] = useInView({ rootMargin: "-5% 0px", once: true });
  const statSpring = useSpring({
    opacity: statInView || reduced ? 1 : 0,
    y: statInView || reduced ? 0 : 24,
    config: { tension: 180, friction: 24 },
  });

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <article className="mx-auto max-w-5xl px-6 py-10 md:px-12 md:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-2 font-mono text-sm text-text-muted transition-colors hover:text-accent-link min-h-[44px]"
        >
          <span aria-hidden>←</span>
          project log
        </Link>

        {/* Header */}
        <header className="mt-14 border-b border-border pb-12">
          <animated.div style={{ opacity: headerTrail[0].opacity }}>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider text-text-muted">
              <span className="text-accent-link">{slugToHash(project.slug)}</span>
              <span className="text-border">·</span>
              <span className="text-accent-add">{domainLabels[project.domain]}</span>
            </div>
          </animated.div>

          <animated.h1
            style={{ opacity: headerTrail[1].opacity }}
            className="mt-6 max-w-4xl font-display text-3xl leading-tight md:text-5xl lg:text-[3.4rem]"
          >
            {project.title}
          </animated.h1>

          <animated.p
            style={{ opacity: headerTrail[2].opacity }}
            className="mt-6 max-w-3xl text-lg leading-relaxed text-text-muted md:text-xl"
          >
            {intro}
          </animated.p>

          <animated.div
            style={{ opacity: headerTrail[3].opacity }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {project.stack.map((item) => (
              <span
                key={item}
                className="rounded border border-border bg-bg-raised/50 px-2.5 py-1 font-mono text-xs text-text-muted"
              >
                {item}
              </span>
            ))}
          </animated.div>

          <animated.div
            style={{ opacity: headerTrail[4].opacity }}
            className="mt-8 flex items-center gap-4"
          >
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-border bg-bg-raised px-4 py-3 font-mono text-sm text-accent-link transition-colors hover:border-accent-link hover:bg-bg-raised/80 min-h-[44px]"
              >
                GitHub
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </animated.div>
        </header>

        {/* Stat callouts — full-width breakout */}
        {stats.length > 0 && (
          <section
            ref={statRef}
            className="grid gap-4 border-b border-border py-12 md:grid-cols-3"
            aria-label="Key metrics"
          >
            {stats.map((metric, i) => (
              <animated.div
                key={metric.label}
                style={{
                  opacity: statSpring.opacity,
                  transform: statSpring.y.to(
                    (y) => `translate3d(0, ${y + i * 8}px, 0)`,
                  ),
                }}
                className="border border-border bg-bg-raised p-6 transition-colors hover:border-accent-add/30"
              >
                <StatCounter
                  value={metric.value}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  label={metric.label}
                  context={metric.context}
                  size="lg"
                />
              </animated.div>
            ))}
          </section>
        )}

        {/* Figure — real data from the project, drawn in on scroll */}
        <ProjectFigure slug={project.slug} />

        {/* Live repo telemetry — languages, commit graph, stats from GitHub */}
        <RepoTelemetry slug={project.slug} />

        {/* Long-form prose — word-cascade reveal, research-paper width */}
        <section aria-label="Writeup" className="mx-auto max-w-3xl py-14">
          <div className="space-y-7 text-base text-text-primary md:text-lg">
            {writeup.map((paragraph, i) => (
              <ProseReveal
                key={i}
                text={paragraph}
                dropCap={i === 0}
                delay={i === 0 ? 0 : 60}
              />
            ))}
          </div>
        </section>

        {/* Prev / Next navigation */}
        <nav
          className="border-t border-border py-10"
          aria-label="Project navigation"
        >
          <div className="grid gap-6 md:grid-cols-2">
            {prevProject ? (
              <DiffReveal fromX={-20}>
                <Link
                  href={`/projects/${prevProject.slug}`}
                  className="group flex items-start gap-3 rounded border border-border bg-bg-raised/40 p-5 transition-colors hover:border-accent-link/40 hover:bg-bg-raised/70 min-h-[44px]"
                >
                  <ArrowLeft className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-accent-link" aria-hidden />
                  <div>
                    <span className="font-mono text-xs uppercase text-text-muted">
                      Previous
                    </span>
                    <p className="mt-1 font-display text-base text-text-primary transition-colors group-hover:text-accent-link">
                      {prevProject.title}
                    </p>
                  </div>
                </Link>
              </DiffReveal>
            ) : (
              <div />
            )}
            {nextProject && (
              <DiffReveal fromX={20}>
                <Link
                  href={`/projects/${nextProject.slug}`}
                  className="group flex items-start justify-end gap-3 rounded border border-border bg-bg-raised/40 p-5 text-right transition-colors hover:border-accent-link/40 hover:bg-bg-raised/70 min-h-[44px]"
                >
                  <div>
                    <span className="font-mono text-xs uppercase text-text-muted">
                      Next
                    </span>
                    <p className="mt-1 font-display text-base text-text-primary transition-colors group-hover:text-accent-link">
                      {nextProject.title}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-accent-link" aria-hidden />
                </Link>
              </DiffReveal>
            )}
          </div>
        </nav>
      </article>
    </main>
  );
}

