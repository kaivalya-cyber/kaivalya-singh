#!/usr/bin/env node
/**
 * Rethemes the language pie chart inside the generated 3d-contrib SVG.
 * The tool hardcodes GitHub's linguist colors (Python #3572A5 blue,
 * TypeScript #3178c6 blue, C++ #f34b7d pink...) which clash with the
 * site's amber-phosphor palette. This remaps known linguist colors to
 * warm-family equivalents that stay distinguishable on the charcoal
 * panel. Unmapped colors pass through untouched.
 *
 * Usage: node scripts/theme-contrib-svg.mjs <path-to-svg>
 */
import { readFile, writeFile } from "node:fs/promises";

const MAP = {
  "#3572a5": "#D29922", // Python       -> amber (signature accent)
  "#3178c6": "#F47067", // TypeScript   -> coral (site's second accent)
  "#f34b7d": "#8F887A", // C++          -> weak warm gray
  "#444444": "#55503F", // other        -> dark warm gray
  "#f05138": "#C9825E", // Swift        -> terracotta
  "#f1e05a": "#E3B341", // JavaScript   -> light gold
  "#da5b0b": "#C07435", // Jupyter      -> burnt orange
  "#e34c26": "#C96A4A", // HTML         -> rust orange
  "#563d7c": "#A08FA8", // CSS          -> muted mauve
  "#00add8": "#86A697", // Go           -> muted sage
  "#dea584": "#D8A47F", // Rust         -> warm sand
  "#89e051": "#A9A26B", // Shell        -> olive
  "#555555": "#6E675A", // C            -> warm gray
  "#a97bff": "#B0899F", // PHP          -> dusty rose
  "#701516": "#A65E44", // Ruby         -> clay
  "#41b883": "#9AA86E", // Vue          -> dry sage
  "#e16737": "#C97947", // MATLAB       -> amber rust
  "#178600": "#7FA08A", // C#           -> muted green
  "#c22d40": "#C06A5A", // Scala        -> brick
  "#384d54": "#6E675A", // Dockerfile   -> warm gray
};

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/theme-contrib-svg.mjs <svg>");
  process.exit(1);
}

let svg = await readFile(file, "utf8");
let remapped = 0;
for (const [from, to] of Object.entries(MAP)) {
  const re = new RegExp(from.replace("#", "#"), "gi");
  svg = svg.replace(re, (match) => {
    if (match.toLowerCase() === from) remapped += 1;
    return to;
  });
}

await writeFile(file, svg);
console.log(`themed ${file}: ${remapped} language colors remapped`);
