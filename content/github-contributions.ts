import raw from "./github-contributions.json";

export interface CalendarDay {
  date: string;
  level: number;
  count: number;
}

export interface UpstreamPr {
  title: string;
  url: string;
  number: number;
  state: "open" | "merged" | "closed";
  date: string;
}

export interface UpstreamRepo {
  key: string;
  repo: string;
  label: string;
  url: string;
  total: number;
  open: number;
  merged: number;
  closedUnmerged: number;
  recent: UpstreamPr[];
}

export interface GitHubContributions {
  user: string;
  fetchedAt: string;
  calendar: {
    days: CalendarDay[];
    total: number;
    activeDays: number;
    bestDay: { date: string; count: number } | null;
  };
  upstream: UpstreamRepo[];
}

export const githubContributions = raw as unknown as GitHubContributions;
