export type ProjectDomain =
  | "quantum"
  | "rl"
  | "marl"
  | "cv"
  | "systems"
  | "web";

export interface ProjectMetric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  context?: string;
}

export interface Project {
  slug: string;
  title: string;
  domain: ProjectDomain;
  summary: string;
  body?: string;
  stack: string[];
  metrics?: ProjectMetric[];
  githubUrl?: string;
  externalUrl?: string;
  flagship: boolean;
}

/**
 * Project inventory from 01-PRD.md §3.
 */
export const projects: Project[] = [
  // ── Flagship ──────────────────────────────────────────────────────────────
  {
    slug: "variational-qec-decoder",
    title: "Adaptive Variational QEC Decoder",
    domain: "quantum",
    summary:
      "CNN-based real-time noise classification routing syndrome data to specialized variational quantum decoders. Paper submission to arXiv in progress.",
    stack: ["PennyLane", "PyTorch", "stim", "pymatching"],
    metrics: [
      { label: "Avg LER Improvement", value: 18.4, suffix: "%" },
      { label: "Peak LER Improvement", value: 27.2, suffix: "%" },
      { label: "Classifier Accuracy", value: 94.2, suffix: "%" },
      { label: "Overhead", value: 3.8, suffix: "%" },
    ],
    githubUrl: "https://github.com/kaivalya-cyber/variational-qec-decoder",
    flagship: true,
  },
  {
    slug: "reward-shaping-lsr",
    title: "Reward Shaping for Stability in Nonlinear Dynamical Systems",
    domain: "rl",
    summary:
      "Empirical study of 4 reward formulations for stabilizing a degree-5 underactuated triple inverted pendulum. Introduced the Lyapunov Satisfaction Rate (LSR) metric.",
    stack: [
      "PyTorch",
      "PPO",
      "SAC",
      "LQR",
      "Gymnasium",
      "RK4",
      "Lyapunov Theory",
    ],
    metrics: [
      {
        label: "Highest LSR (Energy-based)",
        value: 0.515,
        context: "± 0.016",
      },
      { label: "Gap to LQR-optimal closed", value: 97, suffix: "%" },
      {
        label: "Euler vs RK4 variance inflation",
        value: 845,
        suffix: "×",
      },
    ],
    githubUrl: "https://github.com/kaivalya-cyber/reward-shaping-paper",
    flagship: true,
  },
  {
    slug: "mappo-drone-swarm",
    title: "MAPPO Drone Swarm",
    domain: "marl",
    summary:
      "Cooperative-competitive swarm with CTDE architecture — two teams of three drones with emergent role specialization.",
    stack: ["PyTorch", "PyBullet", "Gymnasium"],
    githubUrl: "https://github.com/kaivalya-cyber/drone_swarm_marl",
    flagship: true,
  },
  {
    slug: "puregrad",
    title: "PureGrad — Deep Learning Framework from Scratch",
    domain: "systems",
    summary:
      "Pure Python + NumPy autograd engine with dynamic computation graph, reverse-mode autodiff, custom layers/losses/optimizer, built-in datasets, graph visualizer, and numerical gradient checker.",
    stack: ["Python", "NumPy", "Autodiff", "Backpropagation"],
    metrics: [
      { label: "Moons Dataset Accuracy", value: 99.7, suffix: "%" },
      { label: "Tests Passing", value: 19, suffix: "/19" },
    ],
    githubUrl: "https://github.com/kaivalya-cyber/puregrad",
    flagship: true,
  },
  {
    slug: "ftc-analytics-dataset",
    title: "FTC Open Analytics Dataset",
    domain: "systems",
    summary:
      "Public dataset spanning 6 seasons with computed metrics (OPR, NP-OPR, CCWM, ELO), ML benchmarks, and a 20+ page Streamlit dashboard.",
    stack: ["Python", "pandas", "scikit-learn", "Streamlit", "XGBoost"],
    metrics: [
      { label: "Seasons", value: 6 },
      { label: "Events", value: 53 },
      { label: "Matches", value: 1762 },
      { label: "Teams", value: 902 },
      {
        label: "Best Model Accuracy",
        value: 88.69,
        suffix: "%",
        context: "Logistic Regression",
      },
      { label: "AUC-ROC", value: 0.9412 },
    ],
    githubUrl: "https://github.com/kaivalya-cyber/ftc-analytics-dataset",
    flagship: true,
  },

  // ── Additional log entries ──────────────────────────────────────────────────
  {
    slug: "opponent-modeling-marl",
    title: "Opponent Modeling MARL",
    domain: "marl",
    summary: "Multi-agent reinforcement learning with opponent modeling.",
    stack: ["PyTorch", "Gymnasium"],
    metrics: [{ label: "Passing Tests", value: 23 }],
    githubUrl: "https://github.com/kaivalya-cyber/opponent-modeling-marl",
    flagship: false,
  },
  {
    slug: "drone-visual-tracking",
    title: "Drone Visual Tracking",
    domain: "cv",
    summary: "Computer vision pipeline for drone visual tracking.",
    stack: ["OpenCV", "Python"],
    githubUrl: "https://github.com/kaivalya-cyber/tracking_rl",
    flagship: false,
  },
  {
    slug: "drone-windy-navigation-ppo",
    title: "Drone Windy Navigation PPO",
    domain: "rl",
    summary: "PPO-based navigation for drones in windy conditions.",
    stack: ["PyTorch", "Gymnasium", "PyBullet"],
    githubUrl: "https://github.com/kaivalya-cyber/drone_rl",
    flagship: false,
  },
  {
    slug: "rl-car-ppo",
    title: "RL Car PPO",
    domain: "rl",
    summary: "PPO-trained autonomous car in simulation.",
    stack: ["PyTorch", "Gymnasium", "Stable-Baselines3"],
    githubUrl: "https://github.com/kaivalya-cyber/car_neural_diff_learning",
    flagship: false,
  },
  {
    slug: "mujoco-car-rl",
    title: "MuJoCo Car RL",
    domain: "rl",
    summary: "Reinforcement learning for car control in MuJoCo.",
    stack: ["MuJoCo", "PyTorch", "Gymnasium"],
    githubUrl: "https://github.com/kaivalya-cyber/RL-Mujoco-Learning-",
    flagship: false,
  },
  {
    slug: "rl-triple-inverted-pendulum",
    title: "RL Triple Inverted Pendulum",
    domain: "rl",
    summary:
      "Base triple inverted pendulum stabilization project — precursor to the LSR reward-shaping research.",
    stack: ["PyTorch", "Gymnasium", "PPO", "SAC"],
    flagship: false,
  },
  {
    slug: "ml-drone-racing",
    title: "ML Drone Racing",
    domain: "marl",
    summary: "Machine learning approach to drone racing.",
    stack: ["PyTorch", "Flightmare"],
    flagship: false,
  },
  {
    slug: "swim-vision",
    title: "Swim Vision",
    domain: "cv",
    summary: "Computer vision for swim analysis.",
    stack: ["OpenCV", "MediaPipe", "Python"],
    githubUrl: "https://github.com/kaivalya-cyber/Swim-Vision",
    flagship: false,
  },
  {
    slug: "signaldrive",
    title: "SignalDrive",
    domain: "systems",
    summary: "Gesture-controlled 3D car simulation — real-time two-hand control via MediaPipe, PyBullet, and OpenCV.",
    stack: ["Python", "MediaPipe", "PyBullet", "OpenCV"],
    githubUrl: "https://github.com/kaivalya-cyber/SignalDrive",
    flagship: false,
  },
  {
    slug: "self-balancing-two-wheel-robot",
    title: "Self-Balancing Two-Wheel Robot",
    domain: "systems",
    summary: "Hardware self-balancing robot with PID control.",
    stack: ["PID Control", "C++", "Python"],
    flagship: false,
  },
  {
    slug: "ftc-adaptive-voltage-compensator",
    title: "FTC Adaptive Voltage Compensator",
    domain: "systems",
    summary: "Adaptive voltage compensation for FTC robotics hardware.",
    stack: ["Java", "PID Control"],
    githubUrl: "https://github.com/kaivalya-cyber/ftc-voltage-compensator",
    flagship: false,
  },
  {
    slug: "gpu-parallelization-benchmarking",
    title: "GPU Parallelization Benchmarking",
    domain: "systems",
    summary: "CUDA parallelization benchmarks and analysis.",
    stack: ["CUDA", "C++", "Python"],
    flagship: false,
  },
  {
    slug: "openjarvis",
    title: "OpenJarvis",
    domain: "web",
    summary: "Open-source platform project.",
    stack: ["Python", "JavaScript"],
    flagship: false,
  },
  {
    slug: "vantage-point-learning",
    title: "Vantage Point Learning",
    domain: "web",
    summary:
      "STEM nonprofit platform reaching 400+ students — tutoring and educational outreach.",
    stack: ["React", "TypeScript", "Supabase"],
    metrics: [{ label: "Students Reached", value: 400, suffix: "+" }],
    githubUrl: "https://github.com/kaivalya-cyber/vantage-point-learning",
    flagship: false,
  },
  {
    slug: "fractal-dynamics-simulator",
    title: "Fractal Dynamics Simulator",
    domain: "systems",
    summary: "Interactive Java 17 simulation blending Julia sets, Multibrot sets, and an L-system layer with a temporal stability map.",
    stack: ["Java 17", "Julia Sets", "Multibrot", "L-Systems"],
    githubUrl: "https://github.com/kaivalya-cyber/fractal_java",
    flagship: false,
  },
];

/** Domain display labels for grouped project log */
export const domainLabels: Record<ProjectDomain, string> = {
  quantum: "Quantum",
  rl: "RL",
  marl: "MARL",
  cv: "CV",
  systems: "Systems",
  web: "Web",
};

/** Projects grouped by domain (recommended in Design Doc §3) */
export const projectsByDomain: ProjectDomain[] = [
  "quantum",
  "rl",
  "marl",
  "cv",
  "systems",
  "web",
];

export function getProjectsByDomain(domain: ProjectDomain): Project[] {
  return projects.filter((p) => p.domain === domain);
}
