# Technical Architecture Document
## Kaivalya Singh — Personal Portfolio v2

---

### 1. Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS, using the token system from `02-DESIGN.md` mapped into `tailwind.config.ts` (custom colors, font families, type scale) — do not use default Tailwind palette/scale values
- **Animation:**
  - `@react-spring/web` — all state-driven transitions (accordion, hover, scroll-reveal, counting stats)
  - `animejs` — standalone flourishes (hero ambient background, SVG draw-in, text stagger reveal)
  - No GSAP (explicitly excluded per requirements)
- **Fonts:** self-hosted via `next/font/local` (Berkeley Mono or Fragment Mono for display, Inter for body, JetBrains Mono for data/UI — Inter and JetBrains Mono available via `next/font/google` if not self-hosting)
- **Deployment target:** Vercel (matches existing portfolio URL pattern from the docx: `kaivalyasinghportfolio.vercel.app`)
- **Icons:** `lucide-react` for UI chrome (external-link, chevron, etc.); custom SVG for company glyphs if no logo assets provided

---

### 2. Project Structure

```
/app
  /layout.tsx                 Root layout — fonts, theme, metadata
  /page.tsx                   Homepage — composes all sections
  /projects
    /[slug]/page.tsx           Dynamic flagship project page
    /[slug]/opengraph-image.tsx (optional, later)
/components
  /hero.tsx
  /companies-strip.tsx
  /company-card.tsx
  /project-log.tsx
  /project-log-entry.tsx
  /skills-grid.tsx
  /strengths-strip.tsx
  /stat-counter.tsx            Shared react-spring counting number component
  /contact-footer.tsx
  /diff-reveal.tsx             Shared scroll-reveal wrapper (react-spring + useInView)
  /scroll-shift.tsx            Shared scroll-axis-shift wrapper (translate/scale driven by scroll progress)
/content
  /projects.ts                 Typed project data (flagship + log-only entries)
  /companies.ts                 Typed org data
  /skills.ts
  /strengths.ts
/lib
  /hash.ts                      Deterministic slug → short hash generator for log IDs
  /motion-preferences.ts        prefers-reduced-motion hook
  /use-scroll-progress.ts       0→1 scroll-progress hook powering all axis-shift sections
/public
  /fonts                        Self-hosted font files if applicable
  /icons                        Company glyphs / logos
```

Content lives in typed `/content` files, not hardcoded inline in components — keeps the door open for a CMS later without a rewrite, and makes it trivial to add new projects.

---

### 3. Data Model

```typescript
// content/projects.ts

export type ProjectDomain =
  | "quantum"
  | "rl"
  | "marl"
  | "cv"
  | "systems"
  | "web";

export interface ProjectMetric {
  label: string;       // e.g. "Avg LER Improvement"
  value: number;        // e.g. 18.4
  suffix?: string;      // e.g. "%"
  prefix?: string;
}

export interface Project {
  slug: string;                  // used for /projects/[slug] if flagship
  title: string;
  domain: ProjectDomain;
  summary: string;                // 1-2 lines, homepage log
  body?: string;                  // long-form writeup, flagship only (markdown or MDX)
  stack: string[];
  metrics?: ProjectMetric[];      // headline stats, used in both log entry + page
  githubUrl?: string;
  externalUrl?: string;           // e.g. live deploy, arXiv link
  flagship: boolean;              // true = has dedicated page
  date: string;                   // ISO date, for ordering
}

// content/companies.ts

export interface Company {
  id: string;
  name: string;
  role: string;
  roleDetail?: string;            // e.g. "Started as Intern"
  description: string;            // 1-3 sentences, shown when expanded
  url?: string;
  iconSrc: string;                // path in /public/icons
}

// content/skills.ts

export interface SkillGroup {
  label: string;                  // e.g. "ML & Reinforcement Learning"
  skills: string[];
}

// content/strengths.ts

export interface Strength {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  context?: string;               // short supporting text, e.g. "QEC decoder"
}
```

Populate these files directly from the content inventory in `01-PRD.md §3` — treat the PRD as the source of truth for values; do not paraphrase metrics.

---

### 4. Key Implementation Notes

**Hash ID generation (`lib/hash.ts`):**
Deterministic short hash from the project slug (e.g. simple string hash → hex slice, or a small dependency like a truncated SHA-1 of the slug at build time) so each project gets a stable-looking `#a3f9c2`-style identifier without needing to hand-assign one. Must be deterministic (same slug always produces same hash) — do not use `Math.random()`.

**Scroll-reveal (`components/diff-reveal.tsx`):**
Wrap project log entries in a shared component using `react-spring`'s `useInView` (from `@react-spring/web`) combined with `useSpring` for the fade/translate. Trigger once (`once: true` equivalent — don't re-animate on scroll-up/down repeatedly, that reads as janky). Respect reduced motion by checking `lib/motion-preferences.ts` and short-circuiting to the end state immediately.

**Counting stat (`components/stat-counter.tsx`):**
`useSpring` interpolating from 0 to the target numeric value, formatted with the metric's prefix/suffix. Trigger on scroll-into-view via the same `useInView` pattern. Round appropriately per value (e.g. don't show `18.399999` — format to the same decimal precision as the source data, e.g. `18.4`).

**Companies accordion (`components/companies-strip.tsx`):**
Single `expandedId` state (or `null`). Clicking a company sets/toggles it. Each `CompanyCard` animates height via `useSpring({ height: expanded ? contentHeight : 0 })` — measure `contentHeight` via a ref + `ResizeObserver` or a fixed max-height approach if content length is predictable/short (likely fine here given short descriptions).

**Hero ambient background (anime.js):**
Simple inline SVG (a faint line/path suggesting a diff or waveform) animated via `anime()` targeting the SVG path's `strokeDashoffset` or similar, looping, low-opacity, contained in its own component so it can be trivially skipped when `prefers-reduced-motion` is set.

**Scroll-driven axis shifts (`lib/use-scroll-progress.ts`, `components/scroll-shift.tsx`):**
This is the site's signature interaction (design doc §4) and needs its own shared primitive rather than one-off implementations per section.

```typescript
// lib/use-scroll-progress.ts
// Returns a 0→1 progress value representing how far a target element
// has moved through a defined scroll range (default: through the viewport).
import { useRef, useState, useEffect } from "react";

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.min(1, Math.max(0, raw)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
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

  return { ref, progress };
}
```

Each direction-shifting section then feeds `progress` into a `useSpring`'s `to()` interpolation to derive its transform:

```typescript
const { ref, progress } = useScrollProgress<HTMLDivElement>();
const springs = useSpring({
  x: progress * -400,
  config: { tension: 120, friction: 26 },
});

return (
  <div ref={ref}>
    <animated.div style={{ transform: springs.x.to((x) => `translateX(${x}px)`) }}>
      {/* stat cards */}
    </animated.div>
  </div>
);
```

For alternating left/right entry in the project log, apply the same pattern per entry with the sign of the x-offset alternating by index (`index % 2 === 0 ? -1 : 1`), and clamp so the entry settles at `x: 0` once fully in view rather than continuing to translate indefinitely — interpolate only over the entry portion of `progress` (e.g. 0→0.4) and hold flat afterward.

**Do not** use `top`/`left`/`margin` for these interpolations — always `transform: translate/scale/rotate` so the browser can composite on the GPU thread instead of triggering layout/reflow on every scroll tick. `requestAnimationFrame`-throttled scroll listeners (as above) are required for any section using this pattern; do not attach unthrottled scroll handlers.

**Reduced motion (`lib/motion-preferences.ts`):**
```typescript
import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}
```
Every animated component should consume this and either skip the animation or jump straight to end state.

**Fonts:**
If Berkeley Mono isn't licensed/available, fall back to Fragment Mono or JetBrains Mono at a heavier weight for display use — load via `next/font` to avoid layout shift (`display: "swap"` or preload as appropriate).

---

### 5. Performance Notes

- Animation libraries (`animejs`, `@react-spring/web`) should not block hydration — hero text must be present and readable in server-rendered HTML before any JS runs.
- Lazy-load below-the-fold heavier components (e.g. any embedded chart on project pages) via `next/dynamic` with `ssr: false` only where the component genuinely requires browser APIs.
- Keep bundle lean: this is a two-library animation stack (react-spring + anime.js) by design — don't introduce a third without revisiting the design doc.

---

### 6. Open Items for Cursor / Implementation

- [ ] Confirm font licensing for Berkeley Mono, or commit to Fragment Mono/JetBrains Mono fallback
- [ ] Source or design company icons/glyphs for Olostep, Open Source Vision Foundation, Synthica
- [ ] Decide whether phone number is public in contact/footer (PRD flags as owner discretion)
- [ ] Confirm arXiv links for QEC decoder and LSR paper once submissions are live (currently "in progress" per source doc — don't publish a placeholder link)
- [ ] Decide project log grouping: by domain (recommended in design doc) vs. flat reverse-chronological — confirm before building `project-log.tsx`
