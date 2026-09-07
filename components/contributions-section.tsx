"use client";

import { useState } from "react";
import { animated, useSpring, useInView } from "@react-spring/web";
import { githubContributions as data } from "@/content/github-contributions";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import {
  TensorFlowIcon,
  PyTorchIcon,
  HuggingFaceIcon,
  KerasIcon,
} from "@/components/framework-icons";

/** Public, verifiable list of the user's PRs into a given upstream repo. */
function prSearchUrl(repo: string): string {
  return `https://github.com/search?q=author%3A${data.user}+type%3Apr+repo%3A${encodeURIComponent(repo)}&type=pullrequests`;
}

const FRAMEWORKS = [
  {
    key: "tensorflow",
    label: "TensorFlow",
    Icon: TensorFlowIcon,
    blurb:
      "Hardening tf.experimental.numpy — complex-dtype behavior for isinf / isneginf / isposinf, axis-bounds checks in roll and flip, and proper errors for degenerate np.average weights.",
  },
  {
    key: "pytorch",
    label: "PyTorch",
    Icon: PyTorchIcon,
    blurb:
      "Autograd and nn correctness fixes — inplace-op validation in threshold, LocalResponseNorm range checks, dtensor clip-grad across mixed meshes, and an autograd setup-context leak.",
  },
  {
    key: "transformers",
    label: "Hugging Face",
    Icon: HuggingFaceIcon,
    blurb:
      "Training guardrails in transformers — scheduler warmup/step sanity, GPT2Config dropout range, and weight-decay / adam-beta / adam-epsilon validation in TrainingArguments.",
  },
  {
    key: "keras",
    label: "Keras",
    Icon: KerasIcon,
    blurb:
      "Loss and callback correctness — Huber delta positivity, NumPy-scalar regularizer coefficients, EarlyStopping patience/reset semantics, and label-smoothing ranges.",
  },
] as const;

function UpstreamAccordion() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div>
      <div className="grid grid-cols-4 gap-px bg-border">
        {FRAMEWORKS.map(({ key, label, Icon }) => {
          const open = openKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenKey(open ? null : key)}
              aria-expanded={open}
              aria-controls={`upstream-detail-${key}`}
              className={`flex flex-col items-center gap-2 bg-bg-raised px-2 py-5 transition-colors ${
                open
                  ? "text-accent-add"
                  : "text-text-muted hover:bg-bg-raised/60 hover:text-text-primary"
              }`}
            >
              <Icon className="h-7 w-7" />
              <span className="font-mono text-[0.6rem] uppercase tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {FRAMEWORKS.map(({ key, label, blurb }) => {
        const open = openKey === key;
        const repo = data.upstream.find((u) => u.key === key);
        if (!repo) return null;
        return (
          <div
            key={key}
            id={`upstream-detail-${key}`}
            aria-hidden={!open}
            className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out motion-reduce:transition-none ${
              open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-border bg-bg-raised/50 px-5 py-4">
                <p className="font-mono text-[0.65rem] uppercase text-accent-add">
                  {label}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {blurb}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {repo.recent.slice(0, 3).map((pr) => (
                    <li key={pr.number}>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={open ? 0 : -1}
                        className="group flex gap-2 text-xs leading-snug"
                      >
                        <span className="shrink-0 font-mono text-text-muted transition-colors group-hover:text-accent-add">
                          #{pr.number}
                        </span>
                        <span className="text-text-muted transition-colors group-hover:text-text-primary">
                          {pr.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={prSearchUrl(repo.repo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                  className="mt-3 inline-block font-mono text-[0.65rem] text-accent-link transition-colors hover:text-text-primary"
                >
                  view the full PR list →
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ContributionsSection() {
  const reduced = usePrefersReducedMotion();
  const [inViewRef, inView] = useInView({ rootMargin: "-10% 0px", once: true });
  const springs = useSpring({
    from: { opacity: 0, y: 24 },
    to: { opacity: inView || reduced ? 1 : 0, y: inView || reduced ? 0 : 24 },
    config: { tension: 110, friction: 24 },
  });

  const { total, activeDays, bestDay } = data.calendar;

  return (
    <section
      id="contributions"
      ref={inViewRef as React.Ref<HTMLElement>}
      className="overflow-hidden bg-bg px-6 py-16 md:px-12 md:py-20"
      aria-labelledby="contributions-heading"
    >
      <animated.div
        style={{ opacity: springs.opacity, transform: springs.y.to((y) => `translate3d(0, ${y}px, 0)`) }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="font-mono text-xs uppercase text-accent-add">
              git shortlog
            </p>
            <h2
              id="contributions-heading"
              className="mt-2 font-display text-2xl md:text-3xl"
            >
              A year of commits, in three dimensions.
            </h2>
          </div>

          <dl className="flex gap-6 font-mono text-sm">
            <div>
              <dt className="text-[0.65rem] uppercase text-text-muted">total</dt>
              <dd className="mt-0.5 text-xl text-accent-add">{total}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase text-text-muted">active days</dt>
              <dd className="mt-0.5 text-xl text-text-primary">{activeDays}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase text-text-muted">best day</dt>
              <dd className="mt-0.5 text-xl text-text-primary">
                {bestDay?.count ?? 0}
                <span className="ml-1 text-[0.65rem] text-text-muted">
                  {bestDay?.date.slice(5)}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* One panel: the commit skyline and the upstream work side by side. */}
        <div className="grid gap-px border border-border bg-border lg:grid-cols-5">
          <figure className="bg-bg-raised/40 p-2 lg:col-span-3 md:p-3">
            {/* Generated by yoshi389111/github-profile-3d-contrib with the
                site's amber palette (scripts/3d-contrib-settings.json),
                language pie rethemed by scripts/theme-contrib-svg.mjs.
                Refresh: npm run fetch:contrib-svg */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from /public; next/image adds nothing and requires dangerouslyAllowSVG */}
            <img
              src="/github-3d-contrib.svg"
              alt={`3D isometric contribution calendar: ${total} contributions across ${activeDays} active days in the last 12 months`}
              className="h-auto w-full"
              loading="lazy"
            />
            <figcaption className="px-1 pb-1 pt-2 font-mono text-[0.65rem] text-text-muted">
              github-profile-3d-contrib · palette: amber phosphor v2
            </figcaption>
          </figure>

          <div className="flex flex-col bg-bg lg:col-span-2">
            <p className="px-5 py-5 font-mono text-xs uppercase text-accent-add">
              upstream — open source, upstream
            </p>
            <div className="flex-1">
              <UpstreamAccordion />
            </div>
            <p className="px-5 pb-4 pt-3 font-mono text-[0.65rem] text-text-muted">
              click a framework · links go to the real PRs · regenerated daily
            </p>
          </div>
        </div>
      </animated.div>
    </section>
  );
}
