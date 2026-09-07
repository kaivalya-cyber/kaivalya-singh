# Design Document
## Kaivalya Singh — Personal Portfolio v2

---

### 1. Creative Direction

**Aesthetic:** Dark, code-editor inspired — but grounded specifically in *version control / research log* conventions rather than generic terminal styling. The subject's real work (RL research iterations, LSR metric development, PureGrad's incremental test-passing) is fundamentally about measured iteration. The site should look like it's tracking that iteration, not just wearing a monospace font.

**What we're avoiding:** The default AI-generated dark portfolio — `#0d0d0d` background, neon green Courier-style monospace everywhere, blinking cursor gimmick, numbered `01 / 02 / 03` section markers with no real sequence behind them.

**Distinct from Qbit team site:** Qbit uses violet/pink (`#6421D6` / `#E84BA6`) on near-black with GSAP horizontal scroll. This site uses a cooler, diff-log-inspired palette (green/red/blue accents on blue-black) with vertical scroll and no GSAP — different enough that nobody would mistake one for the other.

---

### 2. Token System

**Color — v2 "amber phosphor" (matches the ASCII backdrop's warm tones)**
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0E0D0B` | Base background (warm charcoal, not pure black) |
| `--bg-raised` | `#16140F` | Cards, expanded panels |
| `--text-primary` | `#D8D2C4` | Body text, warm off-white |
| `--text-muted` | `#8F887A` | Metadata, timestamps, captions |
| `--accent-add` | `#D29922` | Diff-add marker — amber, positive metrics, success states, active/expanded indicators |
| `--accent-remove` | `#F47067` | Diff-remove marker — desaturated coral, used sparingly, e.g. "before" states, fatal messages |
| `--accent-link` | `#D8B478` | Links, primary interactive accent, focus rings |
| `--border` | `#2A261E` | Hairline dividers between log entries |

Green/blue were retired in the v2 swap so the diff markers share the amber family — red survives only where a real diff would have a `−`. Used sparingly means: amber and coral together should read like an actual diff (one line, not decoration everywhere). Don't tint large surfaces with the accents — they're markers, not backgrounds. Hero/404 sit on an animated ASCII terminal video (`components/ui/asthetic.tsx`) tinted to this palette via `.hero-ascii*` layers in `globals.css`.

Used sparingly means: red and green together should read like an actual diff (one line, not decoration everywhere). Don't tint large surfaces with the accents — they're markers, not backgrounds.

**Typography**
| Role | Face | Notes |
|---|---|---|
| Display (headlines) | **Berkeley Mono** (or **Fragment Mono** as a free fallback) | Characterful monospace, used at large sizes only — hero headline, project titles. Not the same face as the body/data mono, to avoid everything looking like one undifferentiated code block. |
| Body | **Inter** | Readable sans for paragraphs, bios, project descriptions |
| Data/caption/UI chrome | **JetBrains Mono** | Metrics, stat callouts, stack chips, timestamps, nav — small-size functional mono |

Type scale: establish a clear ratio (e.g. 1.25 modular scale) from a 16px body base. Display headline sizes should feel intentional and large (48–96px range on desktop hero), not default `text-6xl` Tailwind guesses — pick specific values in the Tailwind config.

**Layout**
- Homepage reads as a vertical **log/feed**: hero → companies strip → project log (primary content, most vertical space) → skills → strengths → contact
- Project log entries are NOT numbered 01/02/03. Instead, each entry gets a short hash-style ID (e.g. `#a3f9c2`, deterministically generated from the project slug) — visually referencing a commit hash, functionally just a stable anchor/visual marker. This is the structural device that "encodes something true" per the design brief: these are real, separate, addressable pieces of work, like commits.
- Dedicated project pages use a single-column reading layout (max-width ~720–800px for body text) with full-width breakout for stat callouts/figures — research-paper-adjacent but not academic-boring.

**Signature element**
The **axis-shifting scroll** (full spec in §4 Motion Spec): vertical scroll input drives horizontal, scale, and depth motion across sections, most visibly in the project log (entries alternate in from left/right) and the strengths strip (stat cards pan horizontally across the viewport as the user scrolls vertically past). Layered on top, each project log entry's summary animates in as if being typed/staged, and quantified metrics count up (e.g., `LSR 0.515`, `845× variance`, `88.69% accuracy`) like a test-runner reporting results. Unlike v1, this motion language runs throughout the page, not just in one hero moment — see §4 for the full section-by-section treatment.

---

### 3. Section-by-Section Spec

#### Hero
- NOT the "big number + label + gradient" template.
- Opens with a single, specific thesis line about what he builds (RL, quantum, CV — pull directly from the docx framing: *"I don't just learn technology, I build with it"* adapted, or a stronger original line in that spirit — copy should be rewritten in his voice, not copy-pasted verbatim from the resume doc).
- Background: extremely subtle ambient motion via anime.js — e.g., a faint animated diff/graph line moving in the background, low opacity, respects `prefers-reduced-motion`.
- No stock stat row under the hero — save stats for the strengths section further down.

#### Companies/Orgs Strip
- Row of 3 icons (Olostep, Open Source Vision Foundation, Synthica) — need simple monochrome/line-art icons or wordmark-letter avatars if no logo assets exist; ask owner for actual logo files if available, otherwise generate clean minimal glyphs consistent with the mono aesthetic.
- Click → accordion expand (react-spring `useSpring` height + opacity), pushes content below down smoothly rather than overlaying. Only one expanded at a time.
- Expanded card shows: org name, role, one-line description, relevant link if applicable (Synthica could link to research output, Olostep to olostep.com).
- Synthica's card should read distinctly ("Founded — Lead Researcher, 5-person team") vs. the other two ("Software Engineering Intern" / "ML Specialist, started as Intern") — the copy itself should carry the growth narrative described in the PRD.

#### Project Log
- The primary content section — most homepage real estate.
- Each entry: hash ID, title, domain tag (Quantum / RL / MARL / CV / Systems), 1–2 line summary, stack chips (styled as small mono tags), a single standout metric if the project has one.
- Flagship projects (the 5 listed in PRD §3) get a "Read the writeup →" link to their dedicated page; others link straight to GitHub with an external-link icon.
- Entries can be grouped by domain with a subtle sticky category label while scrolling, OR kept as one reverse-chronological feed — recommend grouped-by-domain since the range across quantum/RL/CV/systems is itself part of the story, and a flat chronological feed would bury that.

#### Skills
- Grouped exactly as in PRD (ML & RL / Quantum / Simulation & Robotics / Web / Systems & Tools).
- Present as tag clusters, not a progress-bar skill meter (progress bars for skills read as template/generic and are hard to justify objectively).

#### Strengths / Impact Strip
- This is where the counting-stat treatment gets reused: 18.4% LER improvement, 400+ students, 23 passing tests, etc.
- Keep to 4–6 stats max, pick the ones with the most external credibility (research metrics + community impact + competitive results), not every number in the doc.

#### Contact / Footer
- Email, GitHub, LinkedIn, location.
- Closing quote is a nice personal touch from the doc — fine to keep, styled small/muted, not a big pull-quote treatment (avoid over-dramatizing it).

#### Dedicated Project Pages
- Header: title, domain tag, hash ID, stack chips, GitHub link, (arXiv link if/when available for QEC decoder and LSR paper).
- Body: long-form write-up in prose — methodology, key finding, what made it hard. Written in first person, technical but not resume-bullet-compressed (bullets are fine for the homepage log; the dedicated page is where he gets to actually explain the work).
- Stat callouts: pull the 2–3 headline numbers out of the prose into visually distinct callout blocks (large JetBrains Mono numerals, small caption).
- Optional: embedded chart/figure if the project has one worth showing (e.g. LSR paper's variance comparison, FTC dataset's model accuracy comparison) — can be simple SVG/chart components, not required for v1 launch.

---

### 4. Motion Spec

**Direction change from v1:** this site is animation-forward by design. react-spring and anime.js should be used extensively and visibly — motion is not a garnish here, it's a structural part of how the page communicates. The restraint principle from the frontend-design skill still applies at the *micro* level (don't let individual effects fight each other, respect reduced-motion, keep 60fps) but not at the *quantity* level — nearly every section should have a dedicated, deliberate motion treatment rather than a plain fade-in.

**The scroll axis itself changes.** This is the site's signature interaction, replacing the single "one orchestrated moment" idea from v1. The page is a single continuous vertical scroll *input*, but that scroll progress drives different motion per section — some sections translate their content horizontally as the user scrolls vertically past them (classic scrollytelling), some sections zoom/scale, some do a straightforward vertical parallax. The scrollbar and scroll wheel always behave normally (vertical scroll = vertical page progress); what changes is how *content* responds to that progress, not the scroll mechanism itself. This avoids the disorientation of true scroll-jacking while still delivering the "shifting directions" effect.

**How this is implemented (react-spring, no GSAP):** each direction-shifting section is wrapped in a container with a defined scroll range (start px / end px, or start/end viewport-intersection ratio). A scroll-progress value (0→1) is derived for that range — via `react-spring`'s `useScroll` hook (available in `@react-spring/web`) or a lightweight `IntersectionObserver` + scroll-listener hook if finer control is needed — and that progress value is interpolated into `x`, `y`, `scale`, or `rotate` transforms via `useSpring`'s `to()` interpolation. This is the react-spring-native way to get GSAP-ScrollTrigger-like behavior without adding GSAP.

| Section | Scroll behavior | Library |
|---|---|---|
| **Hero** | Page-load stagger (word/line reveal) via anime.js, THEN as user scrolls past, hero content translates horizontally off-screen while an ambient background layer moves vertically at a different rate (parallax depth) | anime.js (load) + react-spring (scroll-out) |
| **Companies strip** | Icons scroll-drive in horizontally from alternating left/right as the section enters; accordion expand/collapse on click is a separate, independent height+opacity spring | react-spring |
| **Project log** | This is the primary scrollytelling section. As the user scrolls through it, entries translate in from alternating directions (odd entries slide in from the left, even from the right) mapped to scroll progress — not a simple fade. Domain-group headers can pin briefly and shift horizontally while their child entries scroll past vertically underneath, echoing a diff/log viewer's sticky file-header behavior. Metric counters animate on entry. | react-spring (scroll-mapped transforms) |
| **Skills** | Tag clusters stagger in with a slight rotate+scale settle per group, groups alternating entrance direction | react-spring |
| **Strengths strip** | Horizontal scroll-drive: as the user scrolls vertically through this section, the stat cards themselves translate horizontally across the viewport (the strip "pans" left-to-right or right-to-left tied to vertical scroll progress) — the clearest instance of the axis-shift signature | react-spring |
| **Contact/footer** | Simple upward settle + fade, no axis shift (page is ending, motion should resolve/calm down here) | react-spring |
| **Hover states (cards, links)** | Fast (~150ms) spring, border/color shift or slight lift | react-spring |
| **Project page navigation** | Crossfade, ~250ms | react-spring |
| **Project page ambient elements** | Any SVG diagrams/figures get anime.js draw-in treatment on scroll-into-view | anime.js |

**Rule of thumb for library split (unchanged in principle, expanded in usage):** react-spring owns anything tied to component/scroll state — which, in this design, is most of the page. anime.js owns standalone, non-state-driven flourishes — the hero's initial load sequence, ambient background loops, and SVG path draw-ins on project pages. Use both liberally within their lanes; just don't have both libraries animating the same element's transform simultaneously.

No true scroll-jacking (we don't hijack the wheel/trackpad input or forcibly change scroll speed), and no pinned-and-held sections that trap the user (that specific mechanic is what GSAP ScrollTrigger is built for and we're deliberately not using it) — but per-section content absolutely shifts axis and direction as it scrolls past. Performance guardrail: all scroll-driven interpolations should be transform/opacity only (never top/left or layout-triggering properties) so they stay on the compositor thread and don't jank on lower-end devices.

---

### 5. Accessibility & Quality Floor

- All interactive elements keyboard reachable, visible focus ring using `--accent-link`
- `prefers-reduced-motion: reduce` disables ambient hero animation and counting-stat animation (values just appear at final state)
- Color contrast: verify `--text-muted` on `--bg` meets at least WCAG AA for caption-sized text; if not, lighten muted token
- Responsive breakpoints: mobile (375px), tablet (768px), desktop (1280px+) — companies strip stacks vertically on mobile, project log stack single-column throughout
- No animation blocks first contentful paint — hero text should be in the DOM and readable even before JS/animation libraries hydrate
