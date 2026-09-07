"use client";

import { useState } from "react";
import { companies } from "@/content/companies";
import { CompanyCard } from "@/components/company-card";
import { DiffReveal } from "@/components/diff-reveal";
import { ScrollShift } from "@/components/scroll-shift";

export function CompaniesStrip() {
  const [expandedId, setExpandedId] = useState<string | null>("synthica");

  return (
    <section aria-labelledby="companies" className="border-y border-border bg-bg px-6 py-20 md:px-12">
      <div className="mx-auto max-w-5xl">
        <DiffReveal>
          <div className="mb-8 max-w-2xl">
            <p className="font-mono text-xs uppercase text-accent-add">
              Orgs / Roles
            </p>
            <h2 id="companies" className="mt-3 font-display text-2xl md:text-4xl">
              Building inside teams, then building teams.
            </h2>
          </div>
        </DiffReveal>

        <div className="overflow-hidden rounded border border-border bg-bg/80">
          {companies.map((company, index) => (
            <ScrollShift
              key={company.id}
              direction={index % 2 === 0 ? "left" : "right"}
              distance={56}
              progressRange={[0, 0.35]}
            >
              <CompanyCard
                company={company}
                expanded={expandedId === company.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === company.id ? null : company.id,
                  )
                }
              />
            </ScrollShift>
          ))}
        </div>
      </div>
    </section>
  );
}
