"use client";

import { useTrail, animated } from "@react-spring/web";
import { skillGroups } from "@/content/skills";
import { githubContributions } from "@/content/github-contributions";
import { DiffReveal } from "@/components/diff-reveal";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import {
  TensorFlowIcon,
  PyTorchIcon,
  HuggingFaceIcon,
  KerasIcon,
} from "@/components/framework-icons";

/** The upstream frameworks, keyed to the contribution data. */
const UPSTREAM = [
  { key: "tensorflow", label: "TensorFlow", Icon: TensorFlowIcon },
  { key: "pytorch", label: "PyTorch", Icon: PyTorchIcon },
  { key: "transformers", label: "Hugging Face", Icon: HuggingFaceIcon },
  { key: "keras", label: "Keras", Icon: KerasIcon },
] as const;

/** Public, verifiable list of the user's PRs into a given upstream repo. */
function prSearchUrl(repo: string): string {
  return `https://github.com/search?q=author%3A${githubContributions.user}+type%3Apr+repo%3A${encodeURIComponent(repo)}&type=pullrequests`;
}

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

        {/* Upstream strip — the same logos as the contributions panel,
            tying the skill map to the real open-source work */}
        <DiffReveal>
          <div className="mt-10 border border-border bg-bg">
            <div className="flex flex-wrap items-center gap-x-2 px-4 py-3 font-mono text-xs">
              <span className="select-none text-text-muted" aria-hidden="true">
                ${" "}
              </span>
              <span className="text-accent-add">ls ./upstream</span>
              <span className="text-text-muted">
                — where this stack gets exercised
              </span>
              <a
                href="#contributions"
                className="ml-auto font-mono text-[0.65rem] text-accent-link transition-colors hover:text-text-primary"
              >
                full story in git shortlog ↓
              </a>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
              {UPSTREAM.map(({ key, label, Icon }) => {
                const repo = githubContributions.upstream.find(
                  (u) => u.key === key,
                );
                if (!repo) return null;
                return (
                  <a
                    key={key}
                    href={prSearchUrl(repo.repo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${label} — PR history on GitHub`}
                    className="group flex flex-col items-center gap-2 bg-bg px-3 py-5 transition-colors hover:bg-bg-raised"
                  >
                    <Icon className="h-7 w-7 text-text-muted transition-colors group-hover:text-accent-add" />
                    <span className="font-mono text-[0.6rem] uppercase tracking-wide text-text-muted transition-colors group-hover:text-text-primary">
                      {label}
                    </span>
                  </a>
                );
              })}
            </div>
            <p className="border-t border-border px-4 py-2.5 font-mono text-[0.65rem] text-text-muted">
              click a logo → its PR history on GitHub · details in git shortlog
            </p>
          </div>
        </DiffReveal>
      </div>
    </section>
  );
}
