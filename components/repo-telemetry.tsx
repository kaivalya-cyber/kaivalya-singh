"use client";

import { animated, useInView, useSpring } from "@react-spring/web";
import { GitCommitHorizontal, GitFork, Star, Users } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import {
  langColor,
  repoForSlug,
  type RepoTelemetry as RepoTelemetryData,
} from "@/content/github-repos";

/**
 * RepoTelemetry — live GitHub repo stats for a flagship project page:
 * an animated language-share bar, a 52-week commit histogram, and a
 * stat row (commits, stars, forks, contributors, last push). All numbers
 * come from content/github-repos.json, regenerated daily by the
 * refresh workflow + `npm run fetch:repos`.
 */
export function RepoTelemetry({ slug }: { slug: string }) {
  const repo = repoForSlug(slug);
  if (!repo) return null;
  return <RepoTelemetryPanel repo={repo} />;
}

function RepoTelemetryPanel({ repo }: { repo: RepoTelemetryData }) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ rootMargin: "-12% 0px", once: true });
  const shown = inView || reduced;

  // Wipe for the language bar — sweeps left→right when it enters view.
  const wipe = useSpring({
    clipPath: shown ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
    config: { tension: 90, friction: 24 },
  });

  const weeks = repo.weeklyCommits ?? [];
  const commits52w = repo.totalCommits52w ?? 0;
  const langEntries = Object.entries(repo.languages ?? {});
  const langTotal = langEntries.reduce((s, [, b]) => s + b, 0) || 1;

  return (
    <section
      ref={ref}
      aria-label="Live GitHub repository telemetry"
      className="my-12 border border-border bg-bg-raised/40"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-xs text-text-muted">
        <span>
          <span className="text-accent-add">$</span> git shortlog {repo.repo}
        </span>
        <span className="hidden sm:inline">
          {repo.pushedAt ? `last push ${repo.pushedAt}` : "\u00A0"}
        </span>
      </div>

      <div className="p-5 md:p-6">
        {/* ── language share bar ─────────────────────────────────────────── */}
        {langEntries.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
              language share — by byte
            </p>
            <animated.div
              className="flex h-3 w-full overflow-hidden rounded-sm bg-border/40"
              style={{ clipPath: wipe.clipPath }}
            >
              {langEntries.map(([name, bytes]) => (
                <div
                  key={name}
                  className="h-full"
                  style={{
                    width: `${(bytes / langTotal) * 100}%`,
                    backgroundColor: langColor(name),
                  }}
                />
              ))}
            </animated.div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {langEntries.map(([name, bytes]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: langColor(name) }}
                  />
                  {name}
                  <span className="tabular-nums text-text-primary">
                    {Math.round((bytes / langTotal) * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── 52-week commit histogram ───────────────────────────────────── */}
        {weeks.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
                commit activity — 52 weeks
              </p>
              <p className="font-mono text-xs tabular-nums text-text-muted">
                {commits52w} in the last year
              </p>
            </div>
            <CommitHistogram weeks={weeks} active={shown} />
          </div>
        )}

        {/* ── stat row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
          <StatCell
            icon={<GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden />}
            label="commits"
            value={repo.totalCommits}
            shown={shown}
          />
          <StatCell
            icon={<Star className="h-3.5 w-3.5" aria-hidden />}
            label="stars"
            value={repo.stars}
            shown={shown}
          />
          <StatCell
            icon={<GitFork className="h-3.5 w-3.5" aria-hidden />}
            label="forks"
            value={repo.forks}
            shown={shown}
          />
          <StatCell
            icon={<Users className="h-3.5 w-3.5" aria-hidden />}
            label="contributors"
            value={repo.contributors}
            shown={shown}
          />
        </div>

        {/* ── last commit ────────────────────────────────────────────────── */}
        {repo.lastCommit?.message && (
          <p className="mt-4 truncate border-l-2 border-border pl-3 font-mono text-xs text-text-muted">
            <span className="text-accent-add">HEAD</span>{" "}
            {repo.lastCommit.message}
            <span className="ml-2 text-border">·</span> {repo.lastCommit.date}
          </p>
        )}

        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-mono text-xs text-accent-link underline-offset-4 hover:underline"
        >
          full history on github →
        </a>
      </div>
    </section>
  );
}

/** Growing bars, left to right, drawn only once in view. */
function CommitHistogram({
  weeks,
  active,
}: {
  weeks: number[];
  active: boolean;
}) {
  const max = Math.max(...weeks, 1);
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className="flex h-24 items-end gap-[2px]"
      role="img"
      aria-label={`Commits per week over the last 52 weeks, total ${weeks.reduce(
        (s, n) => s + n,
        0,
      )}`}
    >
      {weeks.map((count, i) => {
        const heightPct = Math.max((count / max) * 100, count > 0 ? 6 : 2);
        return (
          <div
            key={i}
            className={`flex-1 rounded-t-[1px] ${
              count > 0 ? "bg-accent-add/70" : "bg-border"
            }`}
            title={`${count} commit${count === 1 ? "" : "s"}`}
            style={{
              height: `${heightPct}%`,
              transformOrigin: "bottom",
              transform: active ? "scaleY(1)" : "scaleY(0)",
              transition: reduced
                ? "none"
                : `transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 12}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  shown,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number | null;
  shown: boolean;
}) {
  const { n } = useSpring({
    n: shown ? (value ?? 0) : 0,
    config: { mass: 0.8, tension: 90, friction: 20 },
  });

  return (
    <div className="bg-bg-raised px-4 py-3">
      <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </p>
      {value == null ? (
        <p className="mt-0.5 font-mono text-xl text-text-muted">—</p>
      ) : (
        <animated.p className="mt-0.5 font-mono text-xl tabular-nums text-text-primary">
          {n.to((v) => Math.round(v).toLocaleString("en-US"))}
        </animated.p>
      )}
    </div>
  );
}
