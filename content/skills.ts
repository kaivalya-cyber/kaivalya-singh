export interface SkillGroup {
  label: string;
  skills: string[];
}

/** Merged from 01-PRD.md §3 + CV_hs technical skills */
export const skillGroups: SkillGroup[] = [
  {
    label: "ML & RL",
    skills: [
      "PyTorch",
      "PPO",
      "MAPPO",
      "SAC",
      "Stable-Baselines3",
      "Gymnasium",
      "Control Theory",
      "OpenCV",
      "YOLOv8",
      "MediaPipe",
    ],
  },
  {
    label: "Quantum",
    skills: ["PennyLane", "stim", "pymatching", "Rigetti/pyQuil"],
  },
  {
    label: "Simulation & Robotics",
    skills: [
      "PyBullet",
      "MuJoCo",
      "Flightmare",
      "MAVSDK/PX4",
      "PID Control",
      "Sensor Integration",
      "CadQuery",
    ],
  },
  {
    label: "Web / Platform",
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "Supabase",
      "Node.js",
    ],
  },
  {
    label: "Systems & Languages",
    skills: [
      "Python",
      "C++",
      "Java",
      "CUDA",
      "NumPy",
      "pandas",
      "scikit-learn",
      "Git",
      "pytest",
      "tmux",
    ],
  },
];
