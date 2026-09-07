"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { id: "project-log", label: "log" },
  { id: "companies", label: "orgs" },
  { id: "skills", label: "skills" },
  { id: "contributions", label: "graph" },
  { id: "impact", label: "impact" },
  { id: "contact", label: "contact" },
] as const;

export function SiteHeader() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > 8);

      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);

      // Active section = last heading whose top has crossed 40% of viewport
      let current: string | null = null;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) {
          current = item.id;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b transition-colors duration-300 ${
        scrolled
          ? "border-border bg-bg/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Site sections"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 md:px-12"
      >
        <Link
          href="/"
          className="font-mono text-sm text-text-primary transition-colors hover:text-accent-link"
        >
          kaivalya<span className="text-accent-add">@</span>sj
          <span className="text-text-muted"> ~ $</span>
        </Link>

        <ul className="flex items-center gap-1 md:gap-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={activeId === item.id ? "true" : undefined}
                className={`rounded px-2 py-1.5 font-mono text-xs transition-colors md:px-3 ${
                  activeId === item.id
                    ? "bg-bg-raised text-accent-add"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {activeId === item.id ? `#${item.label}` : item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Scroll progress hairline */}
      <div className="relative h-px w-full bg-transparent">
        <div
          className="absolute left-0 top-0 h-px bg-gradient-to-r from-accent-add via-accent-link to-accent-add transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}
