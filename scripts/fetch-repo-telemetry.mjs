#!/usr/bin/env node
/**
 * Fetches per-repo telemetry for the flagship portfolio repos:
 *   - repo meta (stars, forks, size, language, pushed date)
 *   - language byte breakdown (/languages)
 *   - 52-week commit activity (/stats/commit_activity — retries on 202,
 *     GitHub computes the cache async on first hit)
 *   - contributor count
 *   - last commit message + date
 *
 * Writes content/github-repos.json. Run: npm run fetch:repos
 * Missing/private repos are recorded as `exists: false` rather than failing
 * the run — the site renders from whatever is real.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const USER = "kaivalya-cyber";
/** slug -> project slug on the site */
const REPOS = [
  { name: "variational-qec-decoder", slug: "variational-qec-decoder" },
  { name: "reward-shaping-paper", slug: "reward-shaping-lsr" },
  { name: "drone_swarm_marl", slug: "mappo-drone-swarm" },
  { name: "puregrad", slug: "puregrad" },
  { name: "ftc-analytics-dataset", slug: "ftc-analytics-dataset" },
];

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "content", "github-repos.json");

const UA = { "User-Agent": "portfolio-data-fetch (github.com/kaivalya-cyber)" };
const AUTH = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};

async function ghJson(url) {
  const res = await fetch(url, {
    headers: { ...UA, ...AUTH, Accept: "application/vnd.github+json" },
  });
  return { status: res.status, data: res.ok ? await res.json() : null, headers: res.headers };
}

/** Total commit count via the Link header on a 1-per-page commits listing. */
async function ghTotalCommits(repo) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?per_page=1&page=1`,
    { headers: { ...UA, ...AUTH, Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) return null;
  const last = res.headers.get("link")?.match(/[?&]page=(\d+)>; rel="last"/);
  return last ? parseInt(last[1], 10) : null;
}

/** commit_activity returns 202 while GitHub computes its cache; poll it. */
async function ghCommitActivity(repo) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const { status, data } = await ghJson(
      `https://api.github.com/repos/${repo}/stats/commit_activity`,
    );
    if (status === 200 && Array.isArray(data)) return data;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { user: USER, fetchedAt: new Date().toISOString(), repos: [] };

for (const { name, slug } of REPOS) {
  const base = `https://api.github.com/repos/${USER}/${name}`;
  const meta = await ghJson(base);

  if (meta.status !== 200 || !meta.data) {
    out.repos.push({ slug, repo: `${USER}/${name}`, exists: false });
    console.log(`${name}: not found (HTTP ${meta.status})`);
    continue;
  }

  const languages = await ghJson(`${base}/languages`);
  const activity = await ghCommitActivity(`${USER}/${name}`);
  const contributors = await ghJson(`${base}/contributors?per_page=100`);
  const commits = await ghJson(`${base}/commits?per_page=1`);
  const totalCommits = await ghTotalCommits(`${USER}/${name}`);

  // Keep every language with >=1% of bytes so tiny traces don't add noise.
  const langBytes = languages.data ?? {};
  const langTotal = Object.values(langBytes).reduce((s, b) => s + b, 0) || 1;
  const languages1 = Object.fromEntries(
    Object.entries(langBytes)
      .filter(([, b]) => b / langTotal >= 0.01)
      .sort((a, b) => b[1] - a[1]),
  );

  const weeks = activity ?? [];
  const recentWeeks = weeks.slice(-52).map((w) => w.total);
  const lastCommit = Array.isArray(commits.data) ? commits.data[0] : null;

  out.repos.push({
    slug,
    repo: meta.data.full_name,
    url: meta.data.html_url,
    description: meta.data.description,
    exists: true,
    stars: meta.data.stargazers_count,
    forks: meta.data.forks_count,
    sizeKb: meta.data.size,
    primaryLanguage: meta.data.language,
    pushedAt: (meta.data.pushed_at ?? "").slice(0, 10),
    openIssues: meta.data.open_issues_count,
    languages: languages1,
    totalCommits: totalCommits,
    totalCommits52w: recentWeeks.reduce((s, n) => s + n, 0),
    weeklyCommits: recentWeeks,
    contributors: Array.isArray(contributors.data) ? contributors.data.length : null,
    lastCommit: lastCommit
      ? {
          message: String(lastCommit.commit?.message ?? "").split("\n")[0].slice(0, 90),
          date: (lastCommit.commit?.author?.date ?? "").slice(0, 10),
        }
      : null,
  });

  console.log(
    `${name}: ${meta.data.stargazers_count}★ ${meta.data.forks_count} forks, ` +
      `${Object.keys(languages1).length} langs, ${totalCommits ?? "?"} commits total ` +
      `(${recentWeeks.reduce((s, n) => s + n, 0)} in 52w), ` +
      `${Array.isArray(contributors.data) ? contributors.data.length : "?"} contributors`,
  );
  await sleep(400); // stay friendly to the rate limit
}

await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${path.relative(ROOT, OUT)} (${out.repos.length} repos)`);
