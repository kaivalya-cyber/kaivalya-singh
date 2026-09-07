export interface Strength {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  context?: string;
  /** Extra stat lines from research/CV shown as small proof rows */
  extras?: { value: string; label: string }[];
}

/** Quantified achievements from 01-PRD.md §3 + CV_hs — selected for external credibility */
export const strengths: Strength[] = [
  {
    label: "Avg LER Improvement",
    value: 18.4,
    suffix: "%",
    context: "Variational QEC Decoder",
    extras: [
      { value: "27.2%", label: "peak" },
      { value: "94.2%", label: "classifier" },
    ],
  },
  {
    label: "Gap to LQR closed",
    value: 97,
    suffix: "%",
    context: "LSR reward-shaping study",
    extras: [
      { value: "0.515±0.016", label: "energy LSR" },
      { value: "845×", label: "variance gap" },
    ],
  },
  {
    label: "Students Reached",
    value: 400,
    suffix: "+",
    context: "Vantage Point Learning · 5 schools",
    extras: [
      { value: "200+", label: "tutoring hrs" },
      { value: "100+", label: "food bank hrs" },
    ],
  },
  {
    label: "FTC Matches Analyzed",
    value: 1762,
    context: "Open Analytics Dataset · 902 teams",
    extras: [
      { value: "88.69%", label: "best acc" },
      { value: "0.9412", label: "AUC-ROC" },
    ],
  },
  {
    label: "Hackathon Wins",
    value: 2,
    context: "1st SF · Silver Cove",
    extras: [
      { value: "Finalist", label: "FTC Dean's List" },
      { value: "3.88", label: "UW GPA" },
    ],
  },
  {
    label: "MARL Tests Passing",
    value: 23,
    context: "Opponent modeling · real drone deployment",
    extras: [{ value: "6", label: "drones, 2 teams" }],
  },
];
