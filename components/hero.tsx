"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSpring, animated } from "@react-spring/web";
import { animate, stagger } from "animejs";
import { site } from "@/content/site";
import { useScrollProgress } from "@/lib/use-scroll-progress";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";
import { HeroAmbient } from "@/components/hero-ambient";
import { AsciiArt } from "@/components/ui/asthetic";
import { PendulumCreature } from "@/components/pendulum-creature";

const DIFF_STYLES: Record<string, { marker: string; className: string }> = {
  add: { marker: "+", className: "text-accent-add" },
  remove: { marker: "-", className: "text-accent-remove" },
  ctx: { marker: " ", className: "text-text-muted" },
};

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { ref: scrollRef, progress } = useScrollProgress<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const animRef = useRef<ReturnType<typeof animate> | null>(null);

  const scrollSprings = useSpring({
    x: reduced ? 0 : progress * -180,
    bgY: reduced ? 0 : progress * 80,
    opacity: reduced ? 1 : 1 - progress * 0.6,
    config: { tension: 120, friction: 26 },
  });

  useEffect(() => {
    if (reduced || !containerRef.current) return;

    const lines = containerRef.current.querySelectorAll(".hero-reveal");
    animRef.current = animate(lines, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(90, { start: 150 }),
      duration: 700,
      ease: "outExpo",
    });

    return () => {
      animRef.current?.pause();
    };
  }, [reduced]);

  return (
    <section
      ref={containerRef}
      aria-label="Introduction"
      className="relative min-h-[92vh] overflow-hidden px-6 pb-24 pt-32 md:px-12 md:pt-40"
    >
      {/* Layer 1 — animated ASCII terminal video, tinted to the page palette.
          aria-hidden: decorative backdrop, the accessible content is the text. */}
      <animated.div
        aria-hidden="true"
        style={{ transform: scrollSprings.bgY.to((y) => `translate3d(0, ${y}px, 0)`) }}
        className="hero-ascii absolute inset-0"
      >
        <AsciiArt className="h-full w-full" />
        <div className="hero-ascii-tint" />
        <div className="hero-ascii-mask" />
        <div className="hero-ascii-glow" />
      </animated.div>

      {/* Layer 2 — the Euler-vs-RK4 line motif floats above the ASCII noise */}
      <animated.div
        aria-hidden="true"
        className="absolute inset-0"
      >
        <HeroAmbient />
      </animated.div>

      <div ref={scrollRef} className="hero-copy relative mx-auto max-w-4xl">
        {/* Terminal status line */}
        <p className="hero-reveal font-mono text-xs text-text-muted md:text-sm">
          <span className="text-accent-add">●</span> {site.status}
          <span className="mt-1 block">
            {site.location} · class of {site.classOf}
          </span>
        </p>

        <h1 className="hero-reveal mt-8 font-display text-4xl leading-tight md:text-6xl lg:text-7xl">
          {site.name}
        </h1>

        <p className="hero-reveal mt-4 font-mono text-sm text-accent-link md:text-base">
          {site.tagline}
        </p>

        {/* Verbose block: thesis as command output + real diff lines */}
        <animated.div
          style={{
            opacity: scrollSprings.opacity,
            transform: scrollSprings.x.to((x) => `translate3d(${x}px, 0, 0)`),
          }}
          className="hero-reveal mt-12 max-w-2xl"
        >
          <p className="font-mono text-xs text-text-muted" aria-hidden="true">
            $ hero --verbose
          </p>
          <p className="mt-2 text-lg leading-relaxed text-text-primary md:text-xl">
            {site.heroThesis}
          </p>
          <div className="mt-6 border-l-2 border-border bg-bg-raised/40 py-2 pl-0 font-mono text-xs md:text-sm">
            {site.diffLines.map((line, i) => {
              const style = DIFF_STYLES[line.op] ?? DIFF_STYLES.ctx;
              return (
                <p key={i} className={`${style.className} px-4 py-1`}>
                  <span className="mr-2 inline-block w-3 select-none opacity-70">
                    {style.marker}
                  </span>
                  {line.text}
                </p>
              );
            })}
          </div>
          {/* Lab link — the ASCII-effect playground lives on its own route */}
        <Link
          href="/lab"
          className="hero-reveal mt-6 inline-flex items-center gap-2 font-mono text-xs text-text-muted transition-colors hover:text-accent-add"
        >
          $ open <span className="text-accent-link">lab/ascii-effect</span>
          <span aria-hidden="true">→</span>
        </Link>
      </animated.div>
      </div>

      {/* Pendulum creature — inverted-pendulum control-systems demo */}
      <div className="pointer-events-auto absolute bottom-2 right-2 h-[300px] w-[400px] opacity-70 sm:bottom-6 sm:right-4 sm:h-[360px] sm:w-[500px] md:bottom-8 md:right-6 md:h-[400px] md:w-[560px] md:opacity-100 lg:bottom-10 lg:right-8">
        <PendulumCreature />
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-6 left-6 hidden font-mono text-xs text-text-muted md:left-12 md:block"
        aria-hidden="true"
      >
        <span className="inline-block animate-bounce">↓</span> scroll — every
        section moves on its own axis
      </div>
    </section>
  );
}
