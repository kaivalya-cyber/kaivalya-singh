"use client";

import { site } from "@/content/site";
import { DiffReveal } from "@/components/diff-reveal";
import { GlobeImpact } from "@/components/ui/globe-impact";

/**
 * Impact globe — every pin is a real place from the portfolio: home, the
 * companies (verified HQs), the program that started the quantum work, and
 * the nonprofits. Derived entirely from content/site.ts + content/companies.ts.
 */
export function ImpactGlobeSection() {
  return (
    <section
      id="reach"
      className="overflow-hidden bg-bg px-6 py-24 md:px-12"
      aria-labelledby="reach-heading"
    >
      <div className="mx-auto max-w-6xl">
        <DiffReveal>
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs uppercase text-accent-add">
              Reach
            </p>
            <h2
              id="reach-heading"
              className="mt-3 font-display text-3xl md:text-5xl"
            >
              Where the work landed.
            </h2>
            <p className="mt-5 text-text-muted">
              Home is {site.location}. The rest are the places the work touched
              — an internship HQ, an open-source foundation, a summer program,
              the nonprofits, and a team mentored overseas. Drag the globe.
            </p>
          </div>
        </DiffReveal>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <DiffReveal>
            <div className="mx-auto w-full max-w-md">
              <GlobeImpact />
            </div>
          </DiffReveal>

          <div className="space-y-4">
            {[
              {
                label: "san jose, ca",
                detail:
                  "Home base — Evergreen Valley HS, dual-enrollment CS & math",
                stat: "class of 2028",
              },
              {
                label: "san francisco, ca",
                detail: "SWE intern @ Olostep · 1st Place SF Hackathon",
                stat: "og-image pipeline in production",
              },
              {
                label: "palo alto, ca",
                detail:
                  "ML Specialist @ Open Source Vision Foundation (OpenCV)",
                stat: "open-source CV tooling",
              },
              {
                label: "brooklyn, ny",
                detail: "UPchieve HQ — 200+ hrs of free tutoring served",
                stat: "200+ tutoring hrs",
              },
              {
                label: "cambridge, ma",
                detail: "MIT BWSI — Quantum Software",
                stat: "where the qec work started",
              },
              {
                label: "manchester, nh",
                detail: "FIRST HQ — source org of the FTC Open Analytics Dataset",
                stat: "1,762 matches · 902 teams",
              },
              {
                label: "newark, de",
                detail: "Olostep corporate office",
                stat: "web data infra",
              },
              {
                label: "berlin, germany",
                detail: "Olostep — Europe presence",
                stat: "eu side",
              },
              {
                label: "hanoi, vietnam",
                detail: "Mentored an FTC team — build, strategy, autonomous programming",
                stat: "first tech challenge",
              },
            ].map((pin) => (
              <div
                key={pin.label}
                className="border border-border bg-bg-raised/60 px-4 py-3"
              >
                <p className="font-mono text-[0.65rem] uppercase tracking-wide text-accent-add">
                  {pin.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-primary">
                  {pin.detail}
                </p>
                <p className="mt-0.5 font-mono text-[0.65rem] text-text-muted">
                  {pin.stat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
