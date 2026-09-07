import Link from "next/link";
import { AsciiArt } from "@/components/ui/asthetic";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center"
    >
      {/* Same ASCII terminal backdrop as the hero — the void is consistent */}
      <div className="hero-ascii absolute inset-0" aria-hidden="true">
        <AsciiArt className="h-full w-full" />
        <div className="hero-ascii-tint" />
        <div className="hero-ascii-glow" />
      </div>

      <div className="relative">
        <p className="font-mono text-sm text-text-muted">
          <span className="text-accent-remove">fatal:</span> not found — path
          outside repo history
        </p>
        <p className="mt-6 max-w-md font-mono text-xs leading-relaxed text-text-muted opacity-60">
          $ git log --all --follow ./this-page
          <br />
          no commits found
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex min-h-[44px] items-center gap-2 rounded border border-border bg-bg-raised px-5 py-3 font-mono text-sm text-accent-link transition-colors hover:border-accent-link"
        >
          <span aria-hidden>←</span> back to the log
        </Link>
      </div>
    </main>
  );
}
