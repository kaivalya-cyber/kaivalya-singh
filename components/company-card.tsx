"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import Image from "next/image";
import { ExternalLink, CornerDownRight } from "lucide-react";
import type { Company } from "@/content/companies";

interface CompanyCardProps {
  company: Company;
  expanded: boolean;
  onToggle: () => void;
}

export function CompanyCard({ company, expanded, onToggle }: CompanyCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const springs = useSpring({
    height: expanded ? height : 0,
    opacity: expanded ? 1 : 0,
    config: { tension: 280, friction: 32 },
  });

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group flex w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-bg-raised/50 focus-visible:outline-accent-link md:px-6"
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded border transition-colors ${
            expanded
              ? "border-accent-add text-accent-add"
              : "border-border text-text-muted group-hover:border-accent-link group-hover:text-accent-link"
          }`}
        >
          <Image
            src={company.iconSrc}
            alt=""
            width={24}
            height={24}
            className="opacity-80"
            aria-hidden
          />
        </span>
        <span className="flex-1">
          <span className="block font-display text-base md:text-lg">
            {company.name}
          </span>
          <span className="mt-0.5 block font-mono text-xs text-text-muted">
            {company.role}
            {company.roleDetail && (
              <span className="text-accent-add"> · {company.roleDetail}</span>
            )}
          </span>
        </span>
        <span className="hidden font-mono text-xs text-text-muted sm:block">
          {company.period}
        </span>
        <span
          className={`font-mono text-lg transition-transform ${expanded ? "rotate-45 text-accent-add" : "text-text-muted"}`}
          aria-hidden
        >
          +
        </span>
      </button>

      <animated.div
        style={{ height: springs.height, opacity: springs.opacity }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="px-4 pb-5 pl-[4.5rem] md:px-6 md:pl-24">
          <p className="max-w-xl text-sm leading-relaxed text-text-primary">
            {company.description}
          </p>
          {company.points.length > 0 && (
            <ul className="mt-3 max-w-xl space-y-1.5 font-mono text-xs text-text-muted">
              {company.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <CornerDownRight
                    className="mt-0.5 h-3 w-3 shrink-0 text-accent-add"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {company.url && (
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 py-2 font-mono text-xs text-accent-link hover:underline min-h-[44px]"
            >
              Visit
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      </animated.div>
    </div>
  );
}
