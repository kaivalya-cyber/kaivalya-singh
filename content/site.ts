/** Site identity & contact — from 01-PRD.md §3 + Kaivalya_Singh_CV_hs.docx */
export const site = {
  name: "Kaivalya Singh",
  tagline: "Quantum Computing · Reinforcement Learning · Computer Vision",
  location: "San Jose, CA",
  classOf: "2028",
  status:
    "SWE intern @ Olostep · ML specialist @ Open Source Vision Foundation · founder @ Synthica",
  focusAreas: [
    "Quantum Computing",
    "Reinforcement Learning",
    "Computer Vision",
  ] as const,
  links: {
    github: "https://github.com/kaivalya-cyber",
    linkedin: "https://linkedin.com/in/kaivalya-singh-732190374",
    email: "mailto:singh.kaivalya@gmail.com",
  },
  /** Phone omitted — PRD flags as owner discretion */
  closingQuote: {
    text: "Sometimes the best way to solve your own problems is to help someone else.",
    attribution: "Uncle Iroh",
  },
  bio: {
    school: "Evergreen Valley High School",
    grade: "Junior",
    highlights: [
      "MARL drone swarms",
      "Variational QEC decoder (paper in progress)",
      "STEM nonprofit reaching 400+ students",
    ],
    background:
      "FTC Robotics (Team Qbit #23642, Dean's List Finalist) → ML/RL → dual-enrollment CS & math (through Differential Equations) → MIT BWSI Quantum Software",
    outsideCode: [
      "Varsity swimmer",
      "200+ hrs tutoring (Upchieve)",
      "Vantage Point Learning founder",
      "100+ hrs Second Harvest Food Bank",
    ],
    gpa: {
      unweighted: 3.88,
      weighted: 4.68,
    },
    honors: [
      "1st Place SF Hackathon",
      "Silver Medal Cove Hackathon",
      "FTC Dean's List Finalist",
      "NHS",
    ],
  },
  heroThesis:
    "I build learning systems that survive contact with physics — variational quantum decoders, multi-agent drone swarms, and a control-stability metric (LSR).",
  /** One-line entries for the hero diff card — + additions, ~ context, from CV_hs */
  diffLines: [
    { op: "add", text: "rewards that close 97% of the gap to LQR-optimal" },
    { op: "add", text: "a QEC decoder cutting logical error rate 18.4%" },
    { op: "add", text: "six drones that invent their own roles" },
    { op: "ctx", text: "two integrators, 845× apart in variance" },
  ],
} as const;
