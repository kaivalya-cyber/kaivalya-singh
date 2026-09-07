#!/usr/bin/env node
/**
 * Fetches real GitHub contribution data for the portfolio:
 *   1. The 12-month contribution calendar (scraped from the public profile
 *      page — the API doesn't expose it without auth). Tooltips carry exact
 *      counts ("5 contributions on August 12th."), cells carry data-level.
 *   2. Upstream PRs authored by kaivalya-cyber in tensorflow, keras,
 *      pytorch, and huggingface/transformers (search API, unauthenticated).
 *
 * Writes content/github-contributions.json. Run: npm run fetch:github
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const USER = "kaivalya-cyber";
const UPSTREAM = [
  { key: "tensorflow", repo: "tensorflow/tensorflow", label: "TensorFlow" },
  { key: "pytorch", repo: "pytorch/pytorch", label: "PyTorch" },
  { key: "transformers", repo: "huggingface/transformers", label: "Transformers" },
  { key: "keras", repo: "keras-team/keras", label: "Keras" },
];

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "content", "github-contributions.json");

const UA = { "User-Agent": "portfolio-data-fetch (github.com/kaivalya-cyber)" };

// Optional auth — raised rate limits for the search API (CI sets GITHUB_TOKEN;
// local runs fall back to unauthenticated, which is fine for this volume).
const AUTH = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};

async function fetchText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { ...UA, ...AUTH, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/* ── 1. Contribution calendar ──────────────────────────────────────────── */

function parseCalendar(html) {
  const counts = new Map(); // date -> contributions
  // Exact counts live in the sr-only tooltips:
  // "12 contributions on August 5th." / "No contributions on August 6th."
  const tipRe = />(\d+|No) contributions? on [A-Za-z]+ \d+(?:st|nd|rd|th)\.?</g;
  for (const m of html.matchAll(tipRe)) {
    // Order in the document matches the day cells; fall back to 0 for "No".
    counts.set(counts.size, m[1] === "No" ? 0 : parseInt(m[1], 10));
  }

  const days = [];
  const cellRe = /<td[^>]*class="ContributionCalendar-day"[^>]*>/g;
  const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  for (const m of html.matchAll(cellRe)) {
    const tag = m[0];
    const date = attr(tag, "data-date");
    const level = parseInt(attr(tag, "data-level") ?? "0", 10);
    days.push({ date, level, count: 0 });
  }

  // Tooltips appear interleaved right after their cell in document order.
  const tips = [...counts.values()];
  if (tips.length !== days.length) {
    throw new Error(
      `calendar parse mismatch: ${days.length} cells vs ${tips.length} tooltips`,
    );
  }
  days.forEach((d, i) => (d.count = tips[i]));
  return days;
}

/* ── 2. Upstream PRs ───────────────────────────────────────────────────── */

async function fetchUpstreamPrs() {
  const out = [];
  for (const { key, repo, label } of UPSTREAM) {
    const q = encodeURIComponent(
      `author:${USER} type:pr repo:${repo}`,
    );
    const per = 100;
    let page = 1;
    let total = null;
    const items = [];
    for (;;) {
      const data = await fetchJson(
        `https://api.github.com/search/issues?q=${q}&per_page=${per}&page=${page}&sort=created&order=desc`,
      );
      total = data.total_count;
      items.push(...data.items);
      if (items.length >= total || data.items.length < per) break;
      page += 1;
    }
    out.push({
      key,
      repo,
      label,
      url: `https://github.com/${repo}`,
      total: items.length,
      open: items.filter((i) => i.state === "open").length,
      merged: items.filter((i) => i.pull_request?.merged_at).length,
      // "closed" here means merged or closed-unmerged; surface both honestly.
      closedUnmerged: items.filter(
        (i) => i.state === "closed" && !i.pull_request?.merged_at,
      ).length,
      recent: items.slice(0, 5).map((i) => ({
        title: i.title,
        url: i.html_url,
        number: i.number,
        state: i.pull_request?.merged_at
          ? "merged"
          : i.state === "open"
            ? "open"
            : "closed",
        date: (i.pull_request?.merged_at ?? i.created_at).slice(0, 10),
      })),
    });
  }
  return out;
}

/* ── main ──────────────────────────────────────────────────────────────── */

const html = await fetchText(`https://github.com/users/${USER}/contributions`);
const days = parseCalendar(html);
const totalContributions = days.reduce((s, d) => s + d.count, 0);
const activeDays = days.filter((d) => d.count > 0).length;
const best = days.reduce((a, b) => (b.count > (a?.count ?? 0) ? b : a), null);

const upstream = await fetchUpstreamPrs();

const payload = {
  user: USER,
  fetchedAt: new Date().toISOString(),
  calendar: {
    days,
    total: totalContributions,
    activeDays,
    bestDay: best ? { date: best.date, count: best.count } : null,
  },
  upstream,
};

await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
console.log(
  `wrote ${path.relative(ROOT, OUT)}: ${totalContributions} contributions ` +
    `across ${activeDays} active days (best ${best?.count} on ${best?.date}); ` +
    upstream.map((u) => `${u.label} ${u.total} PRs (${u.merged} merged)`).join(", "),
);
