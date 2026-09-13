"use client";

import Link from "next/link";

/**
 * Route-level error boundary for project detail pages. If any client-side
 * animation throws (the class of bug that used to blank these pages in
 * WebKit-family browsers), the rest of the site stays alive and the user
 * gets an honest, themed recovery panel instead of a dead tab.
 */

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
        <span className="text-accent-link">err</span> ·{" "}
        <span className="text-accent-remove">unhandled exception</span>
      </p>
      <h1 className="mt-4 max-w-xl font-display text-2xl text-text-primary md:text-3xl">
        This page hit an error while animating.
      </h1>
      <p className="mt-4 max-w-md font-mono text-sm text-text-muted">
        The writeup and data are all still there — the reveal just tripped.
        Retry, or read the repo directly on GitHub.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center gap-2 rounded border border-accent-add/50 bg-bg-raised px-5 font-mono text-sm text-accent-add transition-colors hover:bg-bg-raised/80"
        >
          retry
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded border border-border bg-bg-raised px-5 font-mono text-sm text-text-muted transition-colors hover:border-accent-link hover:text-accent-link"
        >
          ← project log
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 max-w-2xl overflow-auto whitespace-pre-wrap border border-border bg-bg-raised/50 p-4 text-left font-mono text-xs text-text-muted">
          {error.message}
        </pre>
      )}
    </main>
  );
}
