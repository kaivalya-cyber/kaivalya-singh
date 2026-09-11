import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AsciiLab } from "@/components/ascii-lab";
import { ContactFooter } from "@/components/contact-footer";

export const metadata: Metadata = {
  title: "ASCII effect lab",
  description:
    "A Canvas2D recreation of the 21st.dev ASCII effect — 24 render modes, tone pipeline, post effects — re-keyed to the site's amber palette.",
};

export default function LabPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-t border-border">
        <AsciiLab />
      </main>
      <ContactFooter />
    </>
  );
}
