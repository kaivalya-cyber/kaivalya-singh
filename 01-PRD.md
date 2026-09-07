# Product Requirements Document
## Kaivalya Singh — Personal Portfolio v2

---

### 1. Overview

**Subject:** Personal engineering portfolio for Kaivalya Singh, high school sophomore working across reinforcement learning, quantum computing, computer vision, and robotics — with published research, deployed hardware projects, and org leadership.

**Audience:**
- Research mentors / potential collaborators evaluating technical depth
- College admissions readers and coaches (STEM-focused programs) who click through from a resume/email
- Recruiters or founders (e.g. future internship contacts) scanning for real shipped work
- Peers in the RL/robotics community (FTC, Synthica) who might reference the site

**Primary job of the page:** Prove technical depth and range fast, then let each project earn a full page. Secondary job: show the person behind the work isn't just solo research — he leads teams, builds orgs, ships to real hardware.

**Explicitly NOT:** A resume replica. A generic "hire me" landing page. A copy of the Qbit team site (different visual identity, per requirement).

---

### 2. Site Structure

**Hybrid model:** scrolling homepage + dedicated project subpages.

```
/                       Homepage (scroll, all sections below)
/projects/[slug]        Dedicated page per major project
/projects                (optional) full project index/log if list grows past homepage feature set
```

#### Homepage sections (in order):
1. **Hero** — thesis statement, not a generic "Hi I'm X" hero
2. **Companies/Orgs strip** — Olostep, Open Source Vision Foundation, Synthica (click-to-expand)
3. **Project log** — commit-log/changelog-styled feed of major projects, reverse chronological or grouped by domain
4. **Skills** — technical skill map (grouped by domain: ML/RL, Quantum, Simulation/Robotics, Web, Systems)
5. **Strengths/impact strip** — key quantified achievements (research metrics, community numbers, competitive results)
6. **Contact/footer**

#### Dedicated project pages (`/projects/[slug]`):
Full case-study treatment for the flagship projects — minimum viable set:
- Reward Shaping / LSR research paper (Triple Inverted Pendulum)
- Adaptive Variational QEC Decoder
- PureGrad
- MAPPO Drone Swarm
- FTC Open Analytics Dataset

Remaining smaller projects (RL Car, MuJoCo Car RL, SignalDrive, etc.) live as compact entries in the homepage project log with GitHub links, no dedicated page required — this keeps the top-tier work from getting diluted. This can expand later.

---

### 3. Content Inventory

Content sourced directly from `Kaivalya_Singh_Portfolio.docx` (source of truth for project facts — do not invent metrics).

**Identity**
- Name: Kaivalya Singh
- Focus areas: Quantum Computing · Reinforcement Learning · Computer Vision
- Location: San Jose, CA
- Links: GitHub (kaivalya-cyber), LinkedIn, email

**About / Bio**
- Sophomore, Evergreen Valley High School
- Shipped: MARL drone swarms, variational QEC decoder (published paper), STEM nonprofit reaching 400+ students
- Background: FTC Robotics (Team Qbit #23642, Dean's List Finalist) → ML/RL → college-level CS at Evergreen Valley College → MIT BWSI certifications (Quantum Software, Python)
- Outside code: varsity swimmer, 200+ hrs tutoring (Upchieve), Vantage Point Learning founder

**Companies / Orgs (new section)**
| Org | Role | Notes |
|---|---|---|
| Olostep | Software Engineering Intern | Web scraping infra; backend/API work, site infrastructure |
| Open Source Vision Foundation | ML Specialist (started as Intern) | Progression story — intern → specialist |
| Synthica | Founder & Lead Researcher | His own org — 5-person research team |

**Key Strengths (quantified, for impact strip)**
- 18.4% avg LER improvement (QEC), 94.2% classifier accuracy
- 23 passing tests (MARL opponent modeling), real drone deployment
- 400+ students reached (Vantage Point Learning), 200+ tutoring hours, 100+ hrs Second Harvest Food Bank
- 1st Place SF Hackathon, Silver Medal Cove Hackathon, FTC Dean's List Finalist, NHS, 3.85 UW / 4.6 W GPA

**Technical Skills (grouped)**
- ML & RL: PyTorch, Stable-Baselines3, Gymnasium, PennyLane, OpenCV, YOLOv8, MediaPipe
- Quantum Computing: PennyLane, stim, pymatching, Rigetti/pyQuil
- Simulation & Robotics: PyBullet, MuJoCo, Flightmare, MAVSDK/PX4, PID Control
- Web/Platform: React, TypeScript, Tailwind CSS, shadcn/ui, Vite, Supabase, Node.js, Firebase
- Systems & Tools: CUDA, C++, Python, Java, JavaScript, Git, tmux, conda, pytest, MLX

**Flagship Projects (full detail — see Design Doc for card/page treatment)**

1. **Adaptive Variational QEC Decoder** (Quantum Computing)
   CNN-based real-time noise classification routing syndrome data to specialized variational quantum decoders. 18.4% avg / 27.2% peak logical error rate improvement, 94.2% classifier accuracy, 3.8% overhead. Paper submission to arXiv in progress.
   Stack: PennyLane, PyTorch, stim, pymatching
   GitHub: github.com/kaivalya-cyber/variational-qec-decoder

2. **Reward Shaping for Stability in Nonlinear Dynamical Systems** (Published Research)
   Empirical study of 4 reward formulations for stabilizing a degree-5 underactuated triple inverted pendulum. PPO + SAC, N=5 seeds, 40 total runs, evaluated vs. LQR baseline. Introduced the Lyapunov Satisfaction Rate (LSR) metric. Energy-based reward achieved highest LSR (0.515 ± 0.016), closing 97% of the gap to LQR-optimal. Discovered the "gradient completeness principle." Euler integration inflated variance 845× vs RK4.
   Stack: PyTorch, PPO, SAC, LQR, Gymnasium, RK4, Lyapunov Theory

3. **MAPPO Drone Swarm** (Multi-Agent RL)
   Cooperative-competitive swarm, CTDE architecture, two teams of three drones, emergent role specialization.
   Stack: PyTorch, PyBullet, Gymnasium
   GitHub: github.com/kaivalya-cyber/drone_swarm_marl

4. **PureGrad — Deep Learning Framework from Scratch** (Systems)
   Pure Python + NumPy autograd engine. Dynamic computation graph (DAG), reverse-mode autodiff, custom layers/losses/optimizer, built-in datasets, graph visualizer, numerical gradient checker. 99.7% accuracy on moons dataset, 19/19 tests passing.
   Stack: Python, NumPy, Autodiff, Backpropagation

5. **FTC Open Analytics Dataset** (Systems/Data)
   Public dataset: 6 seasons, 53 events, 1,762 matches, 902 teams. Computed metrics (OPR, NP-OPR, CCWM, ELO), ML benchmarks, 20+ page Streamlit dashboard. Best model: Logistic Regression, 88.69% accuracy, 0.9412 AUC-ROC.
   Stack: Python, pandas, scikit-learn, Streamlit, XGBoost
   GitHub: github.com/kaivalya-cyber/ftc-analytics-dataset

**Additional projects (homepage log entries, no dedicated page):**
Opponent Modeling MARL, Drone Visual Tracking, Drone Windy Navigation PPO, RL Car PPO, MuJoCo Car RL, RL Triple Inverted Pendulum (base project), ML Drone Racing, Swim Vision, SignalDrive, Self-Balancing Two-Wheel Robot, FTC Adaptive Voltage Compensator, GPU Parallelization Benchmarking, OpenJarvis, Vantage Point Learning (platform), Fractal Dynamics Simulator.

**Contact**
Email, phone (owner discretion whether phone is public), location, closing quote (Uncle Iroh).

---

### 4. Functional Requirements

| # | Requirement | Priority |
|---|---|---|
| F1 | Homepage renders all 6 sections in a single scroll, no page reload | Must |
| F2 | Companies strip: click an icon → expands accordion-style card with role + description; only one open at a time | Must |
| F3 | Project log: each entry shows title, domain tag, 1–2 line summary, stack chips, metric highlight if applicable | Must |
| F4 | Flagship projects link to a dedicated `/projects/[slug]` page; non-flagship entries link straight to GitHub | Must |
| F5 | Dedicated project pages support long-form write-up, stat callouts, and (where applicable) embedded charts/figures | Must |
| F6 | react-spring powers all state-driven and scroll-driven transitions — accordion expand, hover states, page-load stagger, AND scroll-axis-shift motion (sections translate/scale/shift direction as the user scrolls vertically past them; see Design Doc §4) | Must |
| F7 | anime.js powers standalone flourishes (SVG draw-in for diagrams/icons, text reveal on hero, ambient looping background) | Must |
| F6a | The site should use motion extensively — nearly every homepage section has a distinct, deliberate scroll or interaction treatment, not just the hero. This is a deliberate departure from a "restrained, one signature moment" approach: animation is core to the site's identity here | Must |
| F8 | Fully responsive down to mobile (375px) | Must |
| F9 | Keyboard navigable, visible focus states, reduced-motion respected (`prefers-reduced-motion`) | Must |
| F10 | Dark theme only for v1 (no light mode toggle required) | Should |
| F11 | Fast load — animations should not block first contentful paint | Should |

---

### 5. Out of Scope (v1)

- CMS/admin panel for editing content (content is hardcoded/config-driven in repo)
- Blog functionality
- Light mode
- Multi-language support
- Comments/analytics dashboards beyond basic page-view tracking (optional, owner discretion)

---

### 6. Success Criteria

- A technical reader (research mentor, admissions reader who digs in) can understand the LSR paper's core finding and the QEC decoder's result within 30 seconds of landing on their project pages
- Site feels distinct from generic "developer portfolio template" — no numbered 01/02/03 markers unless order is meaningful, no stock gradient hero
- Companies section clearly communicates growth (intern → ML Specialist at OSVF; founder role at Synthica) without needing a resume
- Site works and looks intentional on mobile, not just "doesn't break"
