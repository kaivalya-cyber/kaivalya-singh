"use client";

import { Mail, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { DiffReveal } from "@/components/diff-reveal";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ContactFooter() {
  return (
    <footer
      id="contact"
      aria-label="Contact information"
      className="border-t border-border bg-bg-raised/50 px-6 py-16 md:px-12"
    >
      <DiffReveal fromY={16}>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-xs uppercase text-accent-add">
              Contact
            </p>
            <h2
              id="contact-heading"
              className="mt-3 font-display text-2xl md:text-4xl"
            >
              Open to research conversations, technical mentorship, and hard
              problems.
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-muted">
              “{site.closingQuote.text}” — {site.closingQuote.attribution}
            </p>
            <p className="mt-8 font-mono text-xs text-border">
              last deploy: commit pushed · site: v2 · motion: react-spring +
              anime.js
            </p>
          </div>

          <div className="flex flex-col gap-1 font-mono text-sm">
            <p className="inline-flex items-center gap-2 py-1 text-text-muted">
              <MapPin className="h-4 w-4" aria-hidden />
              {site.location}
            </p>
            <a
              href={site.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2 text-accent-link hover:underline min-h-[44px]"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub — kaivalya-cyber
            </a>
            <a
              href={site.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2 text-accent-link hover:underline min-h-[44px]"
            >
              <LinkedinIcon className="h-4 w-4" aria-hidden />
              LinkedIn
            </a>
            <a
              href={site.links.email}
              className="inline-flex items-center gap-2 py-2 text-accent-link hover:underline min-h-[44px]"
            >
              <Mail className="h-4 w-4" aria-hidden />
              singh.kaivalya@gmail.com
            </a>
          </div>
        </div>
      </DiffReveal>
    </footer>
  );
}
