export interface Company {
  id: string;
  name: string;
  role: string;
  roleDetail?: string;
  period: string;
  description: string;
  /** Proof-of-work bullets, shown when expanded */
  points: string[];
  url?: string;
  iconSrc: string;
}

export const companies: Company[] = [
  {
    id: "olostep",
    name: "Olostep",
    role: "Software Engineering Intern",
    period: "2025 —",
    description:
      "Production web infrastructure work — shipping Next.js tooling that runs in production, not tutorials.",
    points: [
      "Built a dynamic Open Graph image-generation pipeline in Next.js for production use",
      "Developed a Webflow-to-Next.js batch publishing tool for content deployment",
    ],
    url: "https://olostep.com",
    iconSrc: "/icons/olostep.svg",
  },
  {
    id: "osvf",
    name: "Open Source Vision Foundation",
    role: "ML Specialist",
    roleDetail: "started as intern",
    period: "2025 —",
    description:
      "Intern → specialist progression. Contributing to open-source computer vision research and tooling.",
    points: [
      "Contribute to open-source computer vision research and tooling",
    ],
    iconSrc: "/icons/osvf.svg",
  },
  {
    id: "synthica",
    name: "Synthica",
    role: "Founder & Lead Researcher",
    period: "2025 —",
    description:
      "Founded and lead a five-member, student-run international ML/RL research organization — scoping, methodology, and paper-writing.",
    points: [
      "Direct research scoping, methodology, and paper-writing across ongoing RL projects",
      "Leading the proposed LSR extension: generalizing across Lorenz, Duffing, Acrobot, CartPole and PPO / SAC / TD3 — targeting arXiv and an ICLR/NeurIPS workshop",
    ],
    iconSrc: "/icons/synthica.svg",
  },
];
