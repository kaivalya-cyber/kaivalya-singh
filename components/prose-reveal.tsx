"use client";

import { Fragment } from "react";
import { animated, useSprings, useInView } from "@react-spring/web";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

interface Word {
  text: string;
  bold: boolean;
}

/**
 * Tokenizes a paragraph into words, preserving the **bold** markers
 * used by the writeup prose.
 */
function tokenize(text: string): Word[] {
  const words: Word[] = [];
  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;
    const bold = part.startsWith("**") && part.endsWith("**");
    const body = bold ? part.slice(2, -2) : part;
    for (const w of body.split(/\s+/)) {
      if (w) words.push({ text: w, bold });
    }
  }
  return words;
}

interface ProseRevealProps {
  text: string;
  /** Global stagger offset so consecutive paragraphs cascade, not restart. */
  delay?: number;
  /** Drop-cap on the first word (first paragraph only). */
  dropCap?: boolean;
}

/**
 * ProseReveal — a paragraph whose words rise and settle as you scroll to it.
 * Springs fire per-word with a 14ms stagger; bold spans keep their accent.
 *
 * Deliberately NO blur() in the cascade: animated CSS filters each force
 * WebKit into an offscreen buffer per element, and ~600 blurred word spans
 * on a page jetsam-kills the WebContent process (Safari shows "This page
 * couldn't load"). Opacity + transform are composite-only and safe.
 */
export function ProseReveal({ text, delay = 0, dropCap = false }: ProseRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ rootMargin: "-10% 0px", once: true });
  const words = tokenize(text);
  const shown = inView || reduced;

  const springs = useSprings(
    words.length,
    words.map((_, i) => ({
      opacity: shown ? 1 : 0,
      y: shown ? 0 : 14,
      config: { tension: 210, friction: 26 },
      delay: shown ? delay + i * 14 : 0,
    })),
  );

  return (
    <p ref={ref} className="leading-[1.85]">
      {springs.map((s, i) => {
        const word = words[i];
        const isFirst = i === 0;
        return (
          <Fragment key={i}>
            <animated.span
              style={{
                opacity: s.opacity,
                y: s.y,
                display: "inline-block",
                transformOrigin: "50% 100%",
              }}
              className={
                word.bold
                  ? "font-semibold text-accent-add"
                  : undefined
              }
            >
              {dropCap && isFirst ? (
                <span className="float-left mr-2 mt-1 font-display text-3xl text-accent-add">
                  {word.text}
                </span>
              ) : (
                word.text
              )}
            </animated.span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </p>
  );
}
