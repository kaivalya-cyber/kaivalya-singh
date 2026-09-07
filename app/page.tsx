import { SiteHeader } from "@/components/site-header";
import { CompaniesStrip } from "@/components/companies-strip";
import { ContactFooter } from "@/components/contact-footer";
import { Hero } from "@/components/hero";
import { ProjectLog } from "@/components/project-log";
import { SkillsGrid } from "@/components/skills-grid";
import { ContributionsSection } from "@/components/contributions-section";
import { StrengthsStrip } from "@/components/strengths-strip";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <CompaniesStrip />
        <ProjectLog />
        <SkillsGrid />
        <ContributionsSection />
        <StrengthsStrip />
        <ContactFooter />
      </main>
    </>
  );
}
