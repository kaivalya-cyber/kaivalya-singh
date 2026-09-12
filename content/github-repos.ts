import raw from "./github-repos.json";

export interface RepoTelemetry {
  slug: string;
  repo: string;
  url: string;
  description: string | null;
  exists: boolean;
  stars?: number;
  forks?: number;
  sizeKb?: number;
  primaryLanguage?: string | null;
  pushedAt?: string;
  openIssues?: number;
  languages?: Record<string, number>;
  totalCommits?: number | null;
  totalCommits52w?: number;
  weeklyCommits?: number[];
  contributors?: number | null;
  lastCommit?: { message: string; date: string } | null;
}

export interface GitHubRepos {
  user: string;
  fetchedAt: string;
  repos: RepoTelemetry[];
}

export const githubRepos = raw as unknown as GitHubRepos;

export function repoForSlug(slug: string): RepoTelemetry | undefined {
  const repo = githubRepos.repos.find((r) => r.slug === slug);
  return repo?.exists ? repo : undefined;
}

/** Warm-theme palette for language chips — keyed by language name. */
export const LANG_COLORS: Record<string, string> = {
  Python: "#D29922",
  Shell: "#A9B665",
  "Jupyter Notebook": "#F47067",
  JavaScript: "#D8B478",
  TypeScript: "#58A6FF",
  "C++": "#A48FD8",
  Java: "#6FB5AD",
  CUDA: "#A48FD8",
};

export function langColor(name: string): string {
  return LANG_COLORS[name] ?? "#8F887A";
}
