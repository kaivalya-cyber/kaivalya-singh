"use client";

import { Fragment } from "react";
import { useInView } from "@react-spring/web";
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
 *
 * Pure CSS animations, not JS springs: each word carries one compositor-only
 * animation (opacity + translateY) with a per-word animation-delay for the
 * 14ms stagger. Paused holds the word at its from-state; flipping to
 * `running` when the paragraph enters view plays it once. No per-frame style
 * writes, no filters — ~600 JS springs on a page was exactly the kind of
 * main-thread load that helped kill WebKit content processes (Safari's
 * "This page couldn't load").
 */
export function ProseReveal({ text, delay = 0, dropCap = false }: ProseRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ rootMargin: "-10% 0px", once: true });
  const words = tokenize(text);
  const playing = inView && !reduced;

  return (
    <p ref={ref} className="leading-[1.85]">
      {words.map((word, i) => {
        const isFirst = i === 0;
        return (
          <Fragment key={i}>
            <span
              className={`prose-word ${
                word.bold ? "font-semibold text-accent-add" : ""
              }`}
              style={{
                animationDelay: `${delay + i * 14}ms`,
                animationPlayState: playing ? "running" : "paused",
                ...(reduced ? { animation: "none", opacity: 1, transform: "none" } : {}),
              }}
            >
              {dropCap && isFirst ? (
                <span className="float-left mr-2 mt-1 font-display text-3xl text-accent-add">
                  {word.text}
                </span>
              ) : (
                word.text
              )}
            </span>
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </p>
  );
}
