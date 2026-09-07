/**
 * First-person long-form writeups for flagship project pages (Phase 4).
 *
 * DRAFT — Kaivalya should review and edit all prose before go-live.
 * All technical facts sourced from 01-PRD.md §3; nothing invented.
 */
export const projectWriteups: Record<string, string[]> = {
  "variational-qec-decoder": [
    "Quantum error correction is only as good as the decoder sitting on the classical side. Most decoders treat every noise event identically — but real hardware doesn't fail uniformly. Depolarizing channels, bit-flip bursts, and phase errors all leave different fingerprints in the syndrome data, and a one-size-fits-down decoder leaves performance on the table.",

    "I built an adaptive pipeline that classifies the noise profile in real time using a CNN, then routes each syndrome measurement to a specialized variational quantum decoder tuned for that specific noise type. The architecture has three stages: syndrome extraction, classical noise classification, and decoder dispatch. Each variational decoder is a parameterized quantum circuit trained on a different noise regime — the CNN output determines which circuit sees the data.",

    "The variational circuits are trained with PennyLane, which handles the hybrid classical-quantum gradient computation cleanly. Syndrome simulation runs through stim, which can generate syndrome data at scale for any noise model I needed. pymatching serves as the baseline comparator — it's a well-optimized minimum-weight perfect matching decoder, so beating it is a meaningful signal.",

    "The headline result: **18.4% average logical error rate improvement** across the full noise spectrum, peaking at **27.2%** on the hardest noise regimes where specialized decoders have the most to gain. The classifier itself hits **94.2% accuracy** — it's learning to distinguish noise types from syndrome patterns reliably enough to route confidently. Overhead stays at just **3.8%**: the routing layer doesn't blow up the circuit budget, which was a real concern going in.",

    "What made this hard wasn't the ML model or the quantum circuits individually — it was the interface between them. Syndrome classification has to keep pace with the QEC cycle time, and each variational decoder needs to converge without dominating wall-clock time. I spent many iterations tuning the handoff: how many syndrome rounds feed into the classifier, what the confidence threshold is for routing versus falling back to the general decoder, and how to handle borderline cases where two noise profiles overlap.",

    "There's a subtlety I didn't expect: the optimal classifier boundary doesn't align with the noise model boundaries in parameter space. Real hardware noise is a mixture, and the CNN learns a decision surface that's shaped by the downstream decoder performance, not just by the noise physics. That coupling between classifier and decoder training was the hardest debugging loop in the project.",

    "The 3.8% overhead number matters because QEC overhead is multiplicative — every additional gate in the decoder pipeline adds to the error budget. If the routing layer added 15-20% overhead, the accuracy gains would be eaten by the extra errors the routing itself introduces. Keeping it under 5% while maintaining 94.2% classification accuracy was a hard constraint that shaped a lot of the architecture decisions.",

    "The PennyLane circuits use parameterized rotation gates and entangling layers, with gradient computation through the parameter-shift rule. Training is straightforward once the pipeline works end-to-end, but getting to that point required solving several integration issues between stim's syndrome format and PennyLane's circuit interface.",

    "Paper submission to arXiv is in progress. The code is on GitHub if you want to trace the full pipeline from syndrome generation through classification to decoder dispatch.",

    "If I were to push this further, the natural next step is adaptive decoding under time-varying noise — where the noise profile drifts during a computation and the classifier needs to track it. The current system classifies per-syndrome-batch, but real hardware noise can shift on longer timescales. That would require a temporal component to the classifier, which is a different architecture problem entirely.",
  ],

  "reward-shaping-lsr": [
    "Stabilizing a degree-5 underactuated triple inverted pendulum is the kind of problem that looks simple until you try to learn it. The system has five degrees of freedom and only two actuators — it's nonlinear, chaotic in parts of the state space, and the traditional model-based solution (LQR) requires full knowledge of the dynamics. The question I was after: can shaped rewards close the gap to model-based control without hand-designing the entire policy?",

    "I ran four different reward formulations across two algorithms — PPO and SAC — with N=5 seeds per configuration, totaling 40 runs. Every configuration is evaluated against an LQR baseline that has access to the full dynamics model. This is a fair comparison: LQR is the gold standard for linear-quadratic problems, and the triple pendulum is nonlinear enough that matching it with a learned policy is a real achievement.",

    "The core contribution is the **Lyapunov Satisfaction Rate (LSR)** metric. Traditional RL evaluation for continuous control often uses cumulative reward or survival time, neither of which captures whether the system is actually stabilizing versus merely surviving. LSR measures how often the learned policy keeps the system inside a Lyapunov-stable region — it directly quantifies stability quality, not just task completion.",

    "The energy-based reward achieved the highest LSR at **0.515 ± 0.016**, closing **97% of the gap** to LQR-optimal. That wasn't the reward I expected to win. My initial hypothesis was that a more complex shaped reward incorporating angular velocity terms would outperform a simpler energy-based formulation. The energy reward won because it provides a cleaner gradient signal — it maps directly to a physical quantity the policy can learn to regulate.",

    "Along the way I discovered what I call the **gradient completeness principle**: a condition on reward design that determines whether policy gradients carry enough information about stability. If the reward function doesn't create gradient signal in the regions of state space where stability transitions happen, the policy can't learn to avoid those transitions. This explained why some intuitively reasonable reward shapes failed — they were gradient-incomplete in the critical regions.",

    "One result that still bothers me: **Euler integration inflated variance 845× compared to RK4**. Same algorithm, same hyperparameters, different integrator — and the conclusions you'd draw from the Euler runs would be wrong. The Euler-integrated runs show unstable behavior that doesn't exist with RK4, meaning the instability is an artifact of the integrator, not the policy. This is the kind of implementation detail that doesn't show up in a README but changes everything in the results.",

    "The 845× variance inflation isn't just a numerical accuracy issue — it's a systematic bias. Euler's method introduces energy artifacts into the simulation that don't exist in the physical system. When the policy learns from Euler-simulated rollouts, it's learning to compensate for simulation errors that wouldn't occur on real hardware. That's a form of sim-to-real gap baked into the training loop itself, and it's invisible unless you compare integrators carefully.",

    "PPO and SAC behaved differently than I expected under the four reward formulations. PPO was more sensitive to reward scaling — it required careful normalization to avoid gradient explosion on the energy-based reward. SAC handled scaling better but converged more slowly on the sparser formulations. The algorithm-reward interaction was a significant confound that I had to control for before comparing reward shapes.",

    "The N=5 seed design was important because the variance across seeds is itself informative. The energy-based reward had the tightest confidence interval (±0.016), which suggests it's not just better on average — it's more reliably good. A reward that occasionally achieves high LSR but sometimes fails is less useful than one that consistently achieves moderate-to-high LSR.",

    "This is published research. The takeaway for anyone building RL on continuous control: your reward shape and your integrator both need to be treated as first-class experimental variables, not implementation details. The gradient completeness principle gives you a framework for evaluating reward shapes before you commit to training runs.",

    "If I were to extend this, the obvious next direction is transfer to the real triple pendulum hardware. The LSR metric gives you a way to evaluate sim-to-real transfer quality that cumulative reward doesn't — you can measure whether the stability properties survive the transfer, not just whether the task gets completed.",
  ],

  "mappo-drone-swarm": [
    "I wanted to see whether cooperative-competitive multi-agent reinforcement learning would produce role specialization without hand-coding roles. The setup: two teams of three drones each, running MAPPO (Multi-Agent PPO) with a CTDE architecture — centralized training, decentralized execution. The training environment runs in PyBullet with Gymnasium wrappers.",

    "CTDE means each drone runs its own policy at execution time — no communication, no shared state — but training uses a centralized critic that sees the full team state. This is the architectural sweet spot for real deployment: you get the benefit of coordinated learning without requiring real-time communication between agents. The challenge is designing the centralized critic's observation space so it captures enough team-level information to train useful policies.",

    "MAPPO handles the multi-agent credit assignment problem. In a six-drone environment with two competing teams, determining which agent's actions led to a reward is non-trivial. MAPPO uses parameter sharing across agents within a team — all three drones on a team share the same policy weights — which reduces the effective parameter count and helps with sample efficiency. At execution time, each drone observes only its own local state.",

    "The emergent behavior is what makes this project interesting. Drones spontaneously split into distinct roles — aggressor, support, and scout patterns — without any role label in the reward function. I didn't design those roles; the training environment and competitive pressure created them. One drone consistently took an aggressive forward position, another hung back in a support role, and the third covered the flanks. The role assignment wasn't fixed — it emerged from the training dynamics.",

    "The competitive layer — two teams opposing each other — pushes beyond pure cooperation benchmarks. Most MARL research tests cooperative scenarios where all agents share a reward. Adding competition creates a non-stationary environment: your policy has to adapt not just to the environment, but to an opposing team that's also learning. That's a harder problem and closer to real-world multi-agent scenarios.",

    "PyBullet as the physics engine was a practical choice — it's fast enough for the millions of environment steps MAPPO requires, and the Gymnasium wrapper makes it compatible with the standard RL tooling. The drone dynamics are simplified compared to real quadrotors, but the multi-agent interaction dynamics are where the interesting behavior emerges, and those transfer more readily to reality than the low-level motor physics.",

    "The sim-to-real gap is real here. Getting policies from PyBullet onto actual hardware means dealing with latency, motor response curves, and communication dropouts that the simulation doesn't model. The CTDE architecture helps with this — since execution is decentralized, there's no communication dependency to fail. But the policies themselves may not transfer cleanly if the real dynamics diverge significantly from PyBullet's simplified model.",

    "Training stability was a major challenge. With six agents and two competing teams, the learning dynamics are inherently non-stationary. I had to tune the MAPPO hyperparameters carefully — the clipping ratio, the entropy coefficient, and the learning rate all interact in ways that aren't obvious from single-agent PPO experience. Too much exploration and the policies oscillate; too little and they converge to a local equilibrium that isn't competitive.",

    "Code is on GitHub. If you're building MARL for aerial swarms, the environment setup and CTDE wiring are the parts worth looking at first — those architectural decisions constrain everything downstream.",

    "The next step is sim-to-real transfer with a small drone platform. The MAPPO training infrastructure is designed to be ported — the observation and action spaces are defined to match real sensor outputs and motor commands, not PyBullet's internal representation. That deliberate abstraction should make the transfer cleaner, though I expect the real work will be in the fine-tuning stage.",
  ],

  puregrad: [
    "I built a deep learning framework from scratch in pure Python and NumPy because I wanted to understand autograd at the level where bugs become visible. No PyTorch safety net — just a dynamic computation graph, reverse-mode autodiff, and a numerical gradient checker that catches my mistakes.",

    "The engine builds a DAG (directed acyclic graph) per forward pass. Each operation creates a node that stores the input tensors, the output tensor, and a backward function. When you call backward on the loss, the graph traverses in reverse, applying the chain rule at each node. The graph is dynamic — it's constructed fresh for every forward pass, which means you can use Python control flow (if statements, loops) to define different network architectures without special API wrappers.",

    "Custom layers, losses, and an SGD optimizer sit on top of the autodiff engine. The layers are thin wrappers around matrix operations with proper gradient definitions. The loss functions are standard (cross-entropy, MSE) but implemented from scratch so every gradient is verified. The optimizer is basic SGD with optional momentum — enough to train real networks, simple enough that you can trace exactly what's happening at each update step.",

    "The graph visualizer renders the computation graph as a structured diagram so you can watch the network structure change as you add layers. This was more useful for debugging than I expected — seeing the actual graph topology makes it obvious when a gradient path is broken or when an operation is creating an unexpected dependency.",

    "The numerical gradient checker compares analytical gradients (computed through the autodiff engine) against finite-difference approximations. This is the correctness contract for the whole system: if the analytical and numerical gradients don't match to within tolerance, something is wrong in the backward pass. I caught three bugs in my initial autodiff implementation using this checker — all of them would have been invisible in training because they produced small, consistent gradient errors that didn't prevent convergence but corrupted the learned parameters.",

    "On the moons dataset: **99.7% accuracy**. All **19/19 tests passing**, including the gradient checker. The moons dataset is a simple binary classification benchmark — two interleaving half-circles — but it's a genuine test of the framework's ability to learn non-linear decision boundaries. 99.7% is competitive with PyTorch on the same architecture.",

    "PureGrad isn't meant to compete with PyTorch on speed. It's meant to make every operation traceable. When I later debugged issues in my RL training code — vanishing gradients, NaN losses, learning rate sensitivity — the mental model I built here is what let me find them quickly. I could reason about exactly what the gradient computation was doing at each step because I'd implemented it myself.",

    "The built-in datasets module loads standard benchmarks (moons, spirals, circles) with proper train/test splits. This is a convenience feature, but it also means the framework is self-contained — you can train a network from import to evaluation without any external dependencies beyond NumPy.",

    "If you're learning autograd internals, start with the gradient checker tests — they encode the correctness contract for the whole system. The test suite runs the analytical gradient against finite differences for every operation type, at multiple input values, with tolerance checking. If all 19 tests pass, the autodiff engine is mathematically correct.",

    "The most instructive failure in this project was implementing the backward pass for matrix multiplication. The gradient of a matrix product involves transposing one of the operands in a specific way that's easy to get wrong. My first implementation transposed the wrong operand, producing gradients that had the right shape but wrong values. The gradient checker caught it immediately — the analytical and numerical gradients disagreed by a factor that matched the transpose pattern. That kind of debugging is only possible when you have the gradient checker as a ground truth.",
  ],

  "ftc-analytics-dataset": [
    "FIRST Tech Challenge has years of match data scattered across different formats, seasons, and scoring systems. I consolidated **6 seasons**, **53 events**, **1,762 matches**, and **902 teams** into a single public dataset with computed metrics: OPR (Offensive Power Rating), NP-OPR (Normalized Power OPR), CCWM (Contribution to Winning Margin), and ELO ratings.",

    "The goal wasn't just data collection — it was making the data useful for prediction. Raw match scores don't tell you much about individual team quality because FTC is an alliance-based game: your score depends on your two alliance partners as much as on your own performance. OPR and NP-OPR are the standard methods for decomposing alliance scores into individual team contributions, but computing them correctly requires solving a least-squares problem across all matches in an event.",

    "The ELO pipeline was the trickiest part. Standard ELO assumes pairwise matchups, but FTC matches are three-team alliances versus three-team alliances. I adapted the ELO formula to handle alliance-level comparisons, which required defining how team ratings combine to predict alliance performance. The CCWM metric provides a complementary view — it measures how much a team contributes to the winning margin, which captures defensive and consistency aspects that OPR misses.",

    "I ran ML benchmarks across the cleaned dataset to see how well different models predict match outcomes. The best model: **Logistic Regression at 88.69% accuracy** with **0.9412 AUC-ROC**. Sometimes the simple baseline wins, and that's useful information — it tells you where the signal actually lives in the feature space before you reach for XGBoost or gradient boosting. The fact that logistic regression performs this well suggests the computed metrics (OPR, NP-OPR, CCWM, ELO) capture the essential predictive features.",

    "Building the prediction models meant engineering features from the raw match data. Each team's features are a combination of their computed metrics (OPR, NP-OPR, CCWM, ELO) plus historical performance trends. The challenge is handling teams that appear in some seasons but not others, and events with different alliance selection procedures.",

    "The **20+ page Streamlit dashboard** is designed for interactive exploration. You can filter by season, event, and team, see how metrics change over time, compare teams head-to-head, and explore the ML predictions. The dashboard is the primary interface for FTC teams and scouts who want to use the data without writing code.",

    "A team's win rate alone doesn't tell you much. NP-OPR and CCWM capture contributions that box scores miss — a team might have a modest win rate but high CCWM because they consistently elevate their alliance partners. Conversely, a team with a high win rate might be riding strong partners rather than contributing. The metrics disentangle these effects.",

    "The data cleaning was more work than the analysis. FTC scoring systems change between seasons, alliance sizes vary, and match data from different event organizers comes in different formats. I wrote custom parsers for each season's data format and validated the cleaned output against official results. The validation step caught several parsing errors that would have corrupted the computed metrics.",

    "The dataset and dashboard are public on GitHub. If you're doing FTC analytics or teaching data science with real competitive data, this is the entry point. The dataset is structured to be easy to load in pandas, and the dashboard code is well-documented for anyone who wants to extend the analysis.",

    "One insight from this project that I didn't expect: the predictive accuracy plateaus around 88-89% regardless of model complexity. I tried logistic regression, random forests, gradient boosting, and neural networks — they all converge to roughly the same accuracy. This suggests there's an irreducible noise floor in FTC match prediction that comes from the inherent variability of alliance-based competition. The computed metrics capture the systematic signal; the remaining 11-12% is genuine unpredictability.",
  ],
};

export const projectWriteupIntro: Record<string, string> = {
  "variational-qec-decoder":
    "Real-time noise classification routing syndrome data to specialized variational quantum decoders — 18.4% average logical error rate improvement with 3.8% overhead.",
  "reward-shaping-lsr":
    "Empirical study of four reward formulations for stabilizing a triple inverted pendulum, introducing the Lyapunov Satisfaction Rate metric. Energy-based reward closes 97% of the gap to LQR-optimal.",
  "mappo-drone-swarm":
    "Cooperative-competitive multi-agent drone swarm with CTDE architecture and emergent role specialization across two three-drone teams.",
  puregrad:
    "A from-scratch autograd engine and deep learning framework in pure Python + NumPy — dynamic computation graph, reverse-mode autodiff, and a gradient checker that catches bugs at the mathematical level.",
  "ftc-analytics-dataset":
    "Public FTC analytics dataset spanning 6 seasons and 902 teams with computed metrics (OPR, NP-OPR, CCWM, ELO), ML benchmarks, and a 20+ page interactive Streamlit dashboard.",
};
