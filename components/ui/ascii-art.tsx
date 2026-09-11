"use client";

/*
 * ascii-art.tsx — a from-scratch Canvas2D reimplementation of the 21st.dev
 * "ASCII / Spider-Man" effect (https://21st.dev/community/ascii).
 *
 * Pipeline, in order:
 *   1. background layer   — bgMode (blurred copy / flat color / photo / none),
 *                           blurred by bgBlur and faded by bgOpacity
 *   2. sample pass        — source photo drawn into an offscreen canvas with
 *                           brightness → contrast → tone curve → saturation →
 *                           grayscale applied; per-cell color + luminance +
 *                           Sobel edge energy are then averaged
 *   3. glyph pass         — one primitive per cell depending on renderMode,
 *                           gated by coverage/density/invert and weighted by
 *                           edgeEmphasis; colors come either from the photo or
 *                           the amber-phosphor palette
 *   4. lights             — additive radial glows at normalized points
 *   5. pfx                — scanLines, vignette, bloom, chromatic, filmGrain,
 *                           glitch, pixelate, halftone, filmDust
 *   6. mask               — cut holes back to the plain photo via dataUrl
 *   7. animation          — flicker / wave / pulse / shimmer / ripple driven by
 *                           animSpeed × animIntensity, re-rendered per frame
 *
 * The three lens-focus params of the original recipe (tiltFocus, progressive,
 * directionalBothSides) apply depth-of-field to the background plate; the
 * effect's identity lives in the glyph + pfx pipeline, so those are shipped
 * as uniform bg blur here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/motion-preferences";

/* ── types ──────────────────────────────────────────────────────────────── */

export type RenderMode =
  | "characters" | "dither" | "mosaic" | "pixel" | "dots" | "cross"
  | "diamond" | "voxel" | "lego" | "mixed" | "lines" | "diagonal"
  | "braille" | "disco" | "hexdump" | "matrix" | "rings" | "hearts"
  | "stars" | "hexagons" | "triangles" | "bubbles" | "hatch" | "contour"
  | "halfblocks";

export type BgMode = "blurred" | "flat" | "original" | "nothing";
export type BlurType = "off" | "gaussian" | "directional" | "zoom" | "radial";
export type AnimStyle = "wave" | "pulse" | "shimmer" | "ripple" | "flicker";
export type CharSetKey = "standard" | "blocks" | "binary" | "minimal" | "custom";
export type PfxKey =
  | "scanLines" | "vignette" | "bloom" | "chromatic" | "filmGrain"
  | "glitch" | "pixelate" | "halftone" | "filmDust";

export interface EffectFlags { enabled: boolean; intensity: number }
export interface CurvePoint { x: number; y: number }
export interface LightPoint { x: number; y: number; radius: number; intensity: number }

export interface AsciiArtSettings {
  renderMode: RenderMode;
  bgMode: BgMode;
  bgBlur: number;        // px
  bgOpacity: number;     // 0..100
  cellSize: number;      // px
  coverage: number;      // 0..100 — % of cells drawn at all
  invert: boolean;
  styleBlend: string;    // composite op used when the glyph layer is composited
  charSet: CharSetKey;
  customChars: string;
  brightness: number;    // %
  contrast: number;      // %
  edgeEmphasis: number;  // 0..100
  density: number;       // 0..100 — luminance gate: only top N% brightest draw
  toneCurve: CurvePoint[];
  tint: string;
  tintOpacity: number;   // 0..1
  overlayBlend: string;
  saturation: number;    // %
  grayscale: number;     // %
  blurType: BlurType;
  blurAmount: number;
  animated: boolean;
  animStyle: AnimStyle;
  animSpeed: { enabled: boolean; intensity: number };
  animIntensity: { enabled: boolean; intensity: number };
  pfx: Record<PfxKey, EffectFlags>;
  lights: { enabled: boolean; points: LightPoint[] };
  mask: { enabled: boolean; invert: boolean; dataUrl: string | null };
  fps: number;
}

/* ── glyph sets ─────────────────────────────────────────────────────────── */

const CHAR_SETS: Record<Exclude<CharSetKey, "custom">, string> = {
  standard: " .`'\":;-~+=*!?#%@$&",
  blocks: " ░▒▓█",
  binary: " 01",
  minimal: " .:*#",
};
const HEX_DIGITS = "0123456789ABCDEF";

/* ── the amber-phosphor palette (site theme) ────────────────────────────── */

const PALETTE = ["#14120d", "#3a3226", "#6b5b3a", "#a8843c", "#d29922", "#e8c06a", "#f5e9c8"];
const INK_PALE = "#f0e8d8";

/* ── deterministic per-cell hash (coverage / mixed / twinkle seeds) ─────── */

function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ── tone curve: monotone interpolation through control points ──────────── */

function buildCurveLut(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const pts = [...points].sort((a, b) => a.x - b.x);
  if (pts.length < 2) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }
  // Fritsch–Carlson monotone cubic slopes
  const n = pts.length;
  const dx: number[] = [], dy: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = Math.max(pts[i + 1].x - pts[i].x, 1e-6);
    dy[i] = pts[i + 1].y - pts[i].y;
    m[i] = dy[i] / dx[i];
  }
  const c1 = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) c1[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
      c1[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
    }
  }
  c1[n - 1] = m[n - 2];
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    if (x <= pts[0].x) { lut[i] = Math.round(Math.min(1, Math.max(0, pts[0].y)) * 255); continue; }
    if (x >= pts[n - 1].x) { lut[i] = Math.round(Math.min(1, Math.max(0, pts[n - 1].y)) * 255); continue; }
    let s = 0;
    while (s < n - 2 && x > pts[s + 1].x) s++;
    const t = (x - pts[s].x) / dx[s];
    const h00 = (1 + 2 * t) * (1 - t) * (1 - t);
    const h10 = t * (1 - t) * (1 - t);
    const h01 = t * t * (3 - 2 * t);
    const h11 = t * t * (t - 1);
    const y = h00 * pts[s].y + h10 * dx[s] * c1[s] + h01 * pts[s + 1].y + h11 * dx[s] * c1[s + 1];
    lut[i] = Math.round(Math.min(1, Math.max(0, y)) * 255);
  }
  return lut;
}

/* ── pre-rendered film-grain tile ───────────────────────────────────────── */

let grainTile: HTMLCanvasElement | null = null;
function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d")!;
  const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  grainTile = c;
  return c;
}

/* ── module-level sample caches, keyed by size ──────────────────────────── */

interface SampleCache {
  w: number; h: number;
  img: ImageData;
  lum: Float32Array;
  edge: Float32Array;
  curveLut: Uint8ClampedArray;
  curveKey: string;
}
let cache: SampleCache | null = null;

/* ── cover-draw helper (object-fit: cover math) ─────────────────────────── */

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ══════════════════════════════════════════════════════════════════════════
 * renderAsciiArt — the whole pipeline in one call
 * ═════════════════════════════════════════════════════════════════════════ */

export function renderAsciiArt(
  canvas: HTMLCanvasElement,
  settings: AsciiArtSettings,
  time: number,
  img: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  if (!W || !H) return;

  const s = settings;
  const cell = Math.max(4, Math.round(s.cellSize));
  const cols = Math.ceil(W / cell);
  const rows = Math.ceil(H / cell);

  /* ── 1. background plate ─────────────────────────────────────────────── */
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  if (s.bgMode === "flat" || s.bgMode === "nothing") {
    ctx.fillStyle = s.bgMode === "flat" ? "#0e0d0b" : "#000000";
    ctx.fillRect(0, 0, W, H);
  } else if (img && img.complete) {
    ctx.fillStyle = "#0e0d0b";
    ctx.fillRect(0, 0, W, H);
    const blur = s.bgMode === "original" ? s.bgBlur : s.bgMode === "blurred" ? Math.max(s.bgBlur, 8) : 0;
    ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
    ctx.globalAlpha = s.bgMode === "original" ? s.bgOpacity / 100 : 1;
    drawCover(ctx, img, W, H);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#0e0d0b";
    ctx.fillRect(0, 0, W, H);
  }

  if (!img || !img.complete) return;

  /* ── 2. sample pass ────────────────────────────────────────────────────
   * Photo → offscreen with CSS filters (brightness/contrast/saturation/
   * grayscale), then per-pixel tone-curve + luminance + Sobel edges.      */
  const sw = Math.ceil(W / 2), sh = Math.ceil(H / 2); // half-res sampling
  const sc = document.createElement("canvas");
  sc.width = sw; sc.height = sh;
  const sg = sc.getContext("2d", { willReadFrequently: true })!;
  const filters: string[] = [
    `brightness(${s.brightness}%)`,
    `contrast(${s.contrast}%)`,
    `saturate(${s.saturation}%)`,
    `grayscale(${s.grayscale}%)`,
  ];
  sg.filter = filters.join(" ");
  drawCover(sg, img, sw, sh);
  sg.filter = "none";

  const imageData = sg.getImageData(0, 0, sw, sh);
  const px = imageData.data;

  // tone curve on rgb channels
  const curveKey = JSON.stringify(s.toneCurve);
  if (!cache || cache.w !== sw || cache.h !== sh || cache.curveKey !== curveKey) {
    cache = {
      w: sw, h: sh, img: imageData,
      lum: new Float32Array(sw * sh),
      edge: new Float32Array(sw * sh),
      curveLut: buildCurveLut(s.toneCurve),
      curveKey,
    };
  } else {
    cache.img = imageData;
  }
  const lut = cache.curveLut;
  for (let i = 0; i < px.length; i += 4) {
    px[i] = lut[px[i]];
    px[i + 1] = lut[px[i + 1]];
    px[i + 2] = lut[px[i + 2]];
  }

  // optional tint via overlay blend (per-pixel overlay approximation)
  if (s.tintOpacity > 0) {
    const [tr] = hexToRgb(s.tint);
    const a = s.tintOpacity;
    for (let i = 0; i < px.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const b = px[i + ch] / 255;
        const ovr = b < 0.5 ? 2 * b * (tr / 255) : 1 - 2 * (1 - b) * (1 - tr / 255);
        px[i + ch] = (b * (1 - a) + ovr * a) * 255;
      }
    }
  }

  // luminance + Sobel edge energy
  const lum = cache.lum, edge = cache.edge;
  for (let i = 0, j = 0; j < sw * sh; i += 4, j++) {
    lum[j] = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
  }
  edge.fill(0);
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const j = y * sw + x;
      const gx =
        -lum[j - sw - 1] - 2 * lum[j - 1] - lum[j + sw - 1] +
        lum[j - sw + 1] + 2 * lum[j + 1] + lum[j + sw + 1];
      const gy =
        -lum[j - sw - 1] - 2 * lum[j - sw] - lum[j - sw + 1] +
        lum[j + sw - 1] + 2 * lum[j + sw] + lum[j + sw + 1];
      edge[j] = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 2);
    }
  }

  /* ── 3. glyph pass ─────────────────────────────────────────────────────
   * Drawn on a separate layer so styleBlend composites it as a unit.      */
  const gl = document.createElement("canvas");
  gl.width = W; gl.height = H;
  const g = gl.getContext("2d")!;
  g.textAlign = "center";
  g.textBaseline = "middle";

  const isMono = s.renderMode === "lines" || s.renderMode === "matrix" ||
    s.renderMode === "characters" || s.renderMode === "hexdump";
  const blendT = s.styleBlend !== "source-over";
  g.globalCompositeOperation = blendT && isMono ? (s.styleBlend as GlobalCompositeOperation) : "source-over";

  // animation phase helpers
  const speedK = s.animSpeed.enabled ? s.animSpeed.intensity / 100 : 0;
  const ampK = s.animIntensity.enabled ? s.animIntensity.intensity / 100 : 0;
  const phase = time * speedK * Math.PI * 2 * 0.7;
  const animMod = (cx: number, cy: number): number => {
    if (!s.animated || ampK === 0) return 1;
    switch (s.animStyle) {
      case "wave": return 1 - ampK * 0.5 * (1 + Math.sin(phase + cx * 0.55));
      case "pulse": return 1 - ampK * 0.45 * (1 + Math.sin(phase));
      case "shimmer": {
        const tw = hash2(cx, cy) * 97;
        return 1 - ampK * 0.75 * (Math.sin(time * 9 * (0.4 + speedK) + tw) > 0.55 ? 1 : 0.06);
      }
      case "ripple": {
        const dx = cx - cols / 2, dy = cy - rows / 2;
        return 1 - ampK * 0.55 * (1 + Math.sin(phase - Math.sqrt(dx * dx + dy * dy) * 0.7));
      }
      case "flicker":
      default: return 1 - ampK * 0.6 * (0.5 + 0.5 * Math.sin(time * (7 + speedK * 10) + hash2(cx, cy) * 31));
    }
  };

  // matrix rain column heads (self-animated, independent of luminance waves)
  const rainHeads: number[] = [];
  if (s.renderMode === "matrix") {
    for (let c = 0; c < cols; c++) {
      rainHeads.push((time * (3 + speedK * 9) * (0.6 + hash2(c, 7) * 0.8) + hash2(c, 13) * rows) % (rows + 12));
    }
  }

  const chars = s.charSet === "custom" && s.customChars
    ? s.customChars
    : CHAR_SETS[(s.charSet === "custom" ? "standard" : s.charSet) as Exclude<CharSetKey, "custom">];
  const fontSize = cell * 1.05;
  g.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;

  const densityGate = 1 - s.density / 100; // cells below this tone are skipped
  const edgeK = s.edgeEmphasis / 100;

  // pre-compute per-cell tone/rgb; also gather pixels for subcell modes
  const sampleAt = (fx: number, fy: number): number => {
    const x = Math.min(sw - 1, Math.max(0, Math.round(fx * sw)));
    const y = Math.min(sh - 1, Math.max(0, Math.round(fy * sh)));
    return lum[y * sw + x];
  };

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const hash = hash2(cx, cy);
      // coverage gate — deterministic, so the pattern is stable frame to frame
      if (hash > s.coverage / 100) continue;

      const x0 = cx * cell, y0 = cy * cell;
      const x1 = Math.min(W, x0 + cell), y1 = Math.min(H, y0 + cell);
      if (x1 <= x0 || y1 <= y0) continue;

      // average cell color + luminance from half-res pixels
      let r = 0, gg = 0, b = 0, n = 0, lSum = 0, eSum = 0;
      for (let y = (y0 / H * sh) | 0; y < Math.ceil(y1 / H * sh); y++) {
        const rowOff = y * sw;
        for (let x = (x0 / W * sw) | 0; x < Math.ceil(x1 / W * sw); x++) {
          const j = (rowOff + x) * 4;
          r += px[j]; gg += px[j + 1]; b += px[j + 2];
          lSum += lum[rowOff + x]; eSum += edge[rowOff + x];
          n++;
        }
      }
      if (!n) continue;
      r /= n; gg /= n; b /= n;
      const t = lSum / n;
      const eRaw = eSum / n;
      const e = t * (1 - edgeK) + Math.min(1, eRaw * 1.6) * edgeK;
      const tone = s.invert ? 1 - t : e;

      if (tone < densityGate) continue;

      const cxp = (x0 + x1) / 2, cyp = (y0 + y1) / 2;
      const mod = animMod(cx, cy);
      if (mod <= 0.02) continue;
      const d = Math.min(1, Math.max(0.06, (s.invert ? 1 - t : e) * mod));

      const rgb = `rgb(${r | 0},${gg | 0},${b | 0})`;

      switch (s.renderMode) {
        case "characters": {
          const idx = Math.min(chars.length - 1, Math.floor((s.invert ? 1 - t : t) * chars.length));
          const ch = chars[idx];
          if (!ch.trim()) break;
          g.globalAlpha = Math.min(1, 0.25 + d * 0.9);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.fillText(ch, cxp, cyp);
          break;
        }
        case "dither": {
          // ordered dithering: 2×2 sub-cells, ink dots where subcell passes threshold
          for (let sy = 0; sy < 2; sy++) {
            for (let sx = 0; sx < 2; sx++) {
              const sub = sampleAt((x0 + (sx + 0.5) * cell / 2) / W, (y0 + (sy + 0.5) * cell / 2) / H);
              if ((s.invert ? 1 - sub : sub) < densityGate + (sx + sy * 2) * 0.12) continue;
              g.globalAlpha = 0.8;
              g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
              g.fillRect(x0 + sx * cell / 2 + cell * 0.3, y0 + sy * cell / 2 + cell * 0.3, cell * 0.16, cell * 0.16);
            }
          }
          break;
        }
        case "mosaic":
        case "pixel": {
          g.globalAlpha = Math.min(1, 0.35 + d * 0.75);
          g.fillStyle = rgb;
          const pad = s.renderMode === "mosaic" ? cell * 0.06 : 0;
          g.fillRect(x0 + pad, y0 + pad, cell - pad * 2, cell - pad * 2);
          break;
        }
        case "dots": {
          g.globalAlpha = Math.min(1, 0.3 + d);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.beginPath();
          g.arc(cxp, cyp, (cell / 2) * d * 0.9, 0, Math.PI * 2);
          g.fill();
          break;
        }
        case "cross": {
          g.globalAlpha = Math.min(1, 0.35 + d * 0.8);
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.1);
          const a = cell * 0.42 * d;
          g.beginPath();
          g.moveTo(cxp - a, cyp - a); g.lineTo(cxp + a, cyp + a);
          g.moveTo(cxp + a, cyp - a); g.lineTo(cxp - a, cyp + a);
          g.stroke();
          break;
        }
        case "diamond": {
          g.globalAlpha = Math.min(1, 0.3 + d * 0.8);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          const a = cell * 0.48 * d;
          g.beginPath();
          g.moveTo(cxp, cyp - a); g.lineTo(cxp + a, cyp); g.lineTo(cxp, cyp + a); g.lineTo(cxp - a, cyp);
          g.closePath(); g.fill();
          break;
        }
        case "voxel": {
          // isometric cube — top/left/right faces from the cell color
          const w2 = cell / 2, h4 = cell / 4;
          const base = `rgb(${(r * 0.9) | 0},${(gg * 0.9) | 0},${(b * 0.9) | 0})`;
          g.globalAlpha = Math.min(1, 0.4 + d * 0.7);
          g.fillStyle = rgb;
          g.beginPath();
          g.moveTo(cxp, cyp - h4 * 2 * d); g.lineTo(cxp + w2 * d, cyp - h4 * d);
          g.lineTo(cxp, cyp); g.lineTo(cxp - w2 * d, cyp - h4 * d);
          g.closePath(); g.fill();
          g.fillStyle = base;
          g.beginPath();
          g.moveTo(cxp - w2 * d, cyp - h4 * d); g.lineTo(cxp, cyp); g.lineTo(cxp, cyp + h4 * 2 * d); g.lineTo(cxp - w2 * d, cyp + h4 * d);
          g.closePath(); g.fill();
          g.fillStyle = `rgb(${(r * 0.6) | 0},${(gg * 0.6) | 0},${(b * 0.6) | 0})`;
          g.beginPath();
          g.moveTo(cxp + w2 * d, cyp - h4 * d); g.lineTo(cxp, cyp); g.lineTo(cxp, cyp + h4 * 2 * d); g.lineTo(cxp + w2 * d, cyp + h4 * d);
          g.closePath(); g.fill();
          break;
        }
        case "lego": {
          g.globalAlpha = Math.min(1, 0.45 + d * 0.6);
          const rr = cell * 0.16;
          g.fillStyle = rgb;
          g.beginPath();
          g.roundRect(x0 + 0.5, y0 + cell * 0.18, cell - 1, cell * 0.72, rr);
          g.fill();
          g.fillStyle = `rgba(255,255,255,0.28)`;
          g.beginPath();
          g.arc(cxp, y0 + cell * 0.3, cell * 0.14, 0, Math.PI * 2);
          g.fill();
          break;
        }
        case "mixed": {
          const pick = hash * 4 | 0;
          g.globalAlpha = Math.min(1, 0.3 + d * 0.85);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.strokeStyle = g.fillStyle;
          g.lineWidth = Math.max(1, cell * 0.09);
          if (pick === 0) {
            g.beginPath(); g.arc(cxp, cyp, cell * 0.32 * d, 0, Math.PI * 2); g.fill();
          } else if (pick === 1) {
            g.beginPath(); g.moveTo(x0, y1); g.lineTo(x1, y0); g.stroke();
          } else if (pick === 2) {
            const a = cell * 0.4 * d;
            g.beginPath(); g.moveTo(cxp, cyp - a); g.lineTo(cxp + a, cyp); g.lineTo(cxp, cyp + a); g.lineTo(cxp - a, cyp); g.closePath(); g.fill();
          } else {
            g.fillRect(x0 + cell * 0.2, y0 + cell * 0.2, cell * 0.25, cell * 0.25);
          }
          break;
        }
        case "lines": {
          // the signature look: horizontal luminance-scanned lines with a
          // traveling phase, mostly mono — bright cell → bright full line
          const lineY = y0 + cell * 0.5;
          const wave = 0.5 + 0.5 * Math.sin(phase * 0.8 + cx * 0.35 + hash * 6);
          const strength = Math.min(1, (0.25 + d) * (0.55 + 0.45 * wave));
          g.globalAlpha = Math.min(1, strength);
          g.strokeStyle = isMono ? (t > 0.55 ? INK_PALE : PALETTE[4]) : rgb;
          g.lineWidth = Math.max(1, cell * (0.12 + d * 0.55));
          g.beginPath();
          g.moveTo(x0 + cell * 0.1, lineY);
          g.lineTo(x1 - cell * 0.1, lineY);
          g.stroke();
          // occasional bright "scan" segment — the recipe's hot streak
          if (hash > 0.86 && t > 0.4) {
            g.globalAlpha = Math.min(1, strength * 0.9);
            g.strokeStyle = INK_PALE;
            g.lineWidth = Math.max(1, cell * 0.18);
            const sx0 = x0 + hash * cell * 0.4;
            g.beginPath(); g.moveTo(sx0, lineY); g.lineTo(sx0 + cell * 0.5, lineY); g.stroke();
          }
          break;
        }
        case "diagonal": {
          g.globalAlpha = Math.min(1, 0.3 + d * 0.85);
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.12);
          const count = 1 + Math.floor(d * 3);
          for (let k = 0; k < count; k++) {
            const off = (k - (count - 1) / 2) * cell * 0.34;
            g.beginPath();
            g.moveTo(x0 + cell * 0.08, y1 + off - cell * 0.4);
            g.lineTo(x1 - cell * 0.08, y0 + off + cell * 0.4);
            g.stroke();
          }
          break;
        }
        case "braille": {
          // U+2800 + 8 bits from 2×4 sub-cell sampling — real braille dithering
          const bits = [0x01, 0x02, 0x04, 0x40, 0x08, 0x10, 0x20, 0x80];
          let code = 0x2800;
          for (let i = 0; i < 8; i++) {
            const sx2 = i % 2, sy2 = (i / 2) | 0;
            const sub = sampleAt((x0 + (sx2 + 0.5) * cell / 2) / W, (y0 + (sy2 + 0.5) * cell / 2) / H);
            if ((s.invert ? 1 - sub : sub) > 0.45) code |= bits[i];
          }
          if (code === 0x2800) break;
          g.globalAlpha = Math.min(1, 0.4 + d * 0.8);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.fillText(String.fromCharCode(code), cxp, cyp);
          break;
        }
        case "disco": {
          const hue = (hash * 360 + time * 60 * (0.3 + speedK)) % 360;
          g.globalAlpha = Math.min(1, 0.4 + d * 0.7);
          g.fillStyle = `hsl(${hue} 75% ${25 + t * 45}%)`;
          g.beginPath();
          g.arc(cxp, cyp, cell * 0.46 * d, 0, Math.PI * 2);
          g.fill();
          break;
        }
        case "hexdump": {
          // the actual hex nibble of the red channel — pixels as a hexdump
          const ch = HEX_DIGITS[(r / 16) | 0];
          g.globalAlpha = Math.min(1, 0.3 + d * 0.75);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.font = `${fontSize * 0.8}px "JetBrains Mono", ui-monospace, monospace`;
          g.fillText(ch, cxp, cyp);
          g.font = `${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
          break;
        }
        case "matrix": {
          const head = rainHeads[cx] ?? 0;
          const dist = (head - cy + rows + 12) % (rows + 12);
          if (dist > 9) break;
          const fade = 1 - dist / 10;
          g.globalAlpha = Math.min(1, fade * (0.35 + t * 0.9));
          g.fillStyle = dist < 1.2 ? "#d8ffe0" : `rgba(70,${160 + ((hash * 60) | 0)},90,1)`;
          const mchars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﬀ01";
          g.fillText(mchars[(hash2(cx * 7 + cy, 3) * mchars.length) | 0], cxp, cyp);
          break;
        }
        case "rings": {
          g.globalAlpha = Math.min(1, 0.3 + d * 0.8);
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.08);
          g.beginPath(); g.arc(cxp, cyp, cell * 0.45 * d, 0, Math.PI * 2); g.stroke();
          if (t > 0.6) {
            g.beginPath(); g.arc(cxp, cyp, cell * 0.24, 0, Math.PI * 2); g.stroke();
          }
          break;
        }
        case "hearts": {
          const sz = cell * 0.44 * d;
          g.globalAlpha = Math.min(1, 0.35 + d * 0.8);
          g.fillStyle = t > 0.5 ? "#e0705f" : isMonoOrPhoto(s, r, gg, b, t);
          g.beginPath();
          g.moveTo(cxp, cyp + sz * 0.7);
          g.bezierCurveTo(cxp - sz * 1.2, cyp - sz * 0.3, cxp - sz * 0.5, cyp - sz, cxp, cyp - sz * 0.35);
          g.bezierCurveTo(cxp + sz * 0.5, cyp - sz, cxp + sz * 1.2, cyp - sz * 0.3, cxp, cyp + sz * 0.7);
          g.fill();
          break;
        }
        case "stars": {
          const sz = cell * 0.5 * d;
          g.globalAlpha = Math.min(1, 0.3 + d * 0.85);
          g.fillStyle = t > 0.72 ? INK_PALE : isMonoOrPhoto(s, r, gg, b, t);
          g.beginPath();
          g.moveTo(cxp, cyp - sz); g.lineTo(cxp + sz * 0.22, cyp - sz * 0.22);
          g.lineTo(cxp + sz, cyp); g.lineTo(cxp + sz * 0.22, cyp + sz * 0.22);
          g.lineTo(cxp, cyp + sz); g.lineTo(cxp - sz * 0.22, cyp + sz * 0.22);
          g.lineTo(cxp - sz, cyp); g.lineTo(cxp - sz * 0.22, cyp - sz * 0.22);
          g.closePath(); g.fill();
          break;
        }
        case "hexagons": {
          // honeycomb: odd columns sit half a cell lower
          const hy = cyp + (cx % 2) * cell * 0.5;
          const rad = cell * 0.5 * (0.4 + d * 0.6);
          g.globalAlpha = Math.min(1, 0.35 + d * 0.75);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            const hx2 = cxp + Math.cos(a) * rad, hy2 = hy + Math.sin(a) * rad;
            if (k === 0) g.moveTo(hx2, hy2); else g.lineTo(hx2, hy2);
          }
          g.closePath(); g.fill();
          break;
        }
        case "triangles": {
          // low-poly: split the cell diagonally, two facets from half-averages
          let r1 = 0, g1 = 0, r2 = 0, g2 = 0, n1 = 0, n2 = 0;
          for (let y = (y0 / H * sh) | 0; y < Math.ceil(y1 / H * sh); y++) {
            for (let x = (x0 / W * sw) | 0; x < Math.ceil(x1 / W * sw); x++) {
              const j = (y * sw + x) * 4;
              const fxw = x / sw, fyh = y / sh;
              if (fyh * H - y0 < (fxw * W - x0) * (cell / cell)) { r1 += px[j]; g1 += px[j + 1]; n1++; }
              else { r2 += px[j]; g2 += px[j + 1]; n2++; }
            }
          }
          g.globalAlpha = Math.min(1, 0.4 + d * 0.7);
          g.fillStyle = n1 ? `rgb(${(r1 / n1) | 0},${(g1 / n1) | 0},${((b * 0.8) | 0)})` : rgb;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x0, y1); g.closePath(); g.fill();
          g.fillStyle = n2 ? `rgb(${(r2 / n2) | 0},${(g2 / n2) | 0},${((b * 0.8) | 0)})` : rgb;
          g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); g.closePath(); g.fill();
          break;
        }
        case "bubbles": {
          const rad = cell * 0.44 * d;
          g.globalAlpha = Math.min(1, 0.3 + d * 0.7);
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.07);
          g.beginPath(); g.arc(cxp, cyp, rad, 0, Math.PI * 2); g.stroke();
          g.globalAlpha *= 0.8;
          g.beginPath(); g.arc(cxp - rad * 0.3, cyp - rad * 0.3, rad * 0.25, 0, Math.PI * 2); g.stroke();
          break;
        }
        case "hatch": {
          // pencil cross-hatch: stroke count falls with tone
          g.globalAlpha = Math.min(1, 0.25 + d * 0.7);
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.08);
          const strokes = 1 + Math.floor((s.invert ? 1 - t : t) * 4);
          g.beginPath();
          for (let k = 0; k < strokes; k++) {
            const off = (k / 4 - 0.375) * cell;
            g.moveTo(x0 + cell * 0.05, y0 + off + cell * 0.5);
            g.lineTo(x1 - cell * 0.05, y0 + off);
          }
          if (strokes >= 4) {
            g.moveTo(x0 + cell * 0.05, y0 + cell * 0.1);
            g.lineTo(x1 - cell * 0.05, y1 - cell * 0.1);
          }
          g.stroke();
          break;
        }
        case "contour": {
          // topographic iso-lines: draw a tangent segment where tone crosses
          // one of the (animated) iso levels
          const isoCount = 6;
          const drift = (time * speedK * 0.25) % (1 / isoCount);
          const lev = (Math.floor((t + drift) * isoCount) + drift * isoCount) / isoCount;
          const proximity = Math.abs(t - lev) * isoCount; // 0 at the iso line
          if (proximity > 0.35) break;
          const jy = Math.min(sh - 1, Math.max(0, Math.round((cyp / H) * sh)));
          const jx1 = Math.min(sw - 1, Math.max(0, Math.round((cxp / W) * sw) + 1));
          const jx0 = Math.max(0, jx1 - 2);
          const slope = (lum[jy * sw + jx1] - lum[jy * sw + jx0]) * 40; // gradient → tangent tilt
          g.globalAlpha = Math.min(1, (1 - proximity / 0.35) * (0.4 + d * 0.7));
          g.strokeStyle = isMonoOrPhoto(s, r, gg, b, t);
          g.lineWidth = Math.max(1, cell * 0.1);
          g.beginPath();
          g.moveTo(x0 + cell * 0.08, cyp + slope * cell * 0.4);
          g.lineTo(x1 - cell * 0.08, cyp - slope * cell * 0.4);
          g.stroke();
          break;
        }
        case "halfblocks": {
          // ▀-style: two vertical halves, each its own sampled tone
          const top = sampleAt((x0 + cell * 0.5) / W, (y0 + cell * 0.25) / H);
          const bot = sampleAt((x0 + cell * 0.5) / W, (y0 + cell * 0.75) / H);
          g.fillStyle = isMonoOrPhoto(s, r, gg, b, t);
          const tTop = s.invert ? 1 - top : top;
          if (tTop >= densityGate) {
            g.globalAlpha = Math.min(1, 0.3 + tTop);
            g.fillRect(x0 + cell * 0.08, y0 + cell * 0.04, cell * 0.84, cell * 0.42);
          }
          const tBot = s.invert ? 1 - bot : bot;
          if (tBot >= densityGate) {
            g.globalAlpha = Math.min(1, 0.3 + tBot);
            g.fillRect(x0 + cell * 0.08, y0 + cell * 0.54, cell * 0.84, cell * 0.42);
          }
          break;
        }
      }
    }
  }

  // composite glyph layer with the recipe's styleBlend
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.filter = "none";
  ctx.drawImage(gl, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  /* ── 4. lights ───────────────────────────────────────────────────────── */
  if (s.lights.enabled) {
    ctx.globalCompositeOperation = "screen";
    for (const p of s.lights.points) {
      const r = Math.max(8, (p.radius / 100) * Math.max(W, H));
      const grad = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, r);
      grad.addColorStop(0, `rgba(232,192,106,${(p.intensity / 100) * 0.85})`);
      grad.addColorStop(1, "rgba(232,192,106,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ── 5. post effects ─────────────────────────────────────────────────── */
  const pfx = s.pfx;

  if (pfx.bloom?.enabled) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = (pfx.bloom.intensity / 100) * 0.7;
    ctx.filter = `blur(${6 + (pfx.bloom.intensity / 100) * 8}px) brightness(1.25)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  if (pfx.chromatic?.enabled) {
    const k = pfx.chromatic.intensity / 100;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.28 * k;
    ctx.filter = "blur(1px) hue-rotate(60deg) saturate(2)";
    ctx.drawImage(canvas, 3 * k + 1, 0);
    ctx.filter = "blur(1px) hue-rotate(-60deg) saturate(2)";
    ctx.drawImage(canvas, -3 * k - 1, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  if (pfx.pixelate?.enabled) {
    const f = Math.max(2, 2 + (pfx.pixelate.intensity / 100) * 22);
    const pw = Math.max(2, Math.round(W / f)), ph = Math.max(2, Math.round(H / f));
    const pc = document.createElement("canvas");
    pc.width = pw; pc.height = ph;
    const pg = pc.getContext("2d")!;
    pg.drawImage(canvas, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pc, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }

  if (pfx.glitch?.enabled && s.animated) {
    const k = pfx.glitch.intensity / 100;
    const bands = 1 + Math.floor(k * 5);
    for (let bIdx = 0; bIdx < bands; bIdx++) {
      if (Math.random() > 0.35 + k * 0.4) continue;
      const gy = Math.random() * H;
      const gh = 4 + Math.random() * H * 0.06 * (0.4 + k);
      const dx = (Math.random() - 0.5) * W * 0.08 * k;
      ctx.drawImage(canvas, 0, gy, W, gh, dx, gy, W, gh);
    }
  }

  if (pfx.scanLines?.enabled) {
    ctx.globalAlpha = (pfx.scanLines.intensity / 100) * 0.5;
    ctx.fillStyle = "#000";
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
  }

  if (pfx.halftone?.enabled) {
    const step = Math.max(6, cell);
    ctx.fillStyle = "rgba(10,9,7,0.85)";
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        const l = sampleAt(x / W, y / H);
        const rad = (step / 2) * l * (pfx.halftone.intensity / 100) * 1.4;
        if (rad <= 0.4) continue;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (pfx.filmGrain?.enabled) {
    const tile = getGrainTile();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = (pfx.filmGrain.intensity / 100) * 0.55;
    const ox = s.animated ? (Math.random() * 128) | 0 : 0;
    const oy = s.animated ? (Math.random() * 128) | 0 : 0;
    for (let y = -oy; y < H; y += 128) for (let x = -ox; x < W; x += 128) ctx.drawImage(tile, x, y);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  if (pfx.filmDust?.enabled) {
    const k = pfx.filmDust.intensity / 100;
    const n = Math.floor(k * 26);
    ctx.fillStyle = "rgba(240,232,216,0.5)";
    for (let i = 0; i < n; i++) {
      if (!s.animated && i % 2) continue;
      const dx = Math.random() * W, dy = Math.random() * H;
      ctx.fillRect(dx, dy, 1 + Math.random() * 1.6, 1 + Math.random() * 1.2);
    }
  }

  if (pfx.vignette?.enabled) {
    const k = pfx.vignette.intensity / 100;
    const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(8,7,5,${k})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── 6. mask — holes back to the plain photo ─────────────────────────── */
  if (s.mask.enabled && s.mask.dataUrl && maskImage?.complete) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.filter = s.mask.invert ? "invert(1)" : "none";
    drawCover(ctx, maskImage, W, H);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}

/* helpers shared by the render + component */

let maskImage: HTMLImageElement | null = null;
export function setMaskImage(dataUrl: string | null) {
  if (!dataUrl) { maskImage = null; return; }
  const im = new Image();
  im.src = dataUrl;
  maskImage = im;
}

/** mono palette for structural modes, photo color otherwise */
const COLOR_MODES = new Set(["dots", "cross", "diamond", "hexagons", "triangles", "bubbles", "hatch", "contour", "voxel", "lego", "hearts", "stars"]);
function isMonoOrPhoto(s: AsciiArtSettings, r: number, g: number, b: number, t: number): string {
  if (COLOR_MODES.has(s.renderMode)) return `rgb(${r | 0},${g | 0},${b | 0})`;
  return t > 0.55 ? INK_PALE : PALETTE[t > 0.3 ? 4 : 3];
}

/* ══════════════════════════════════════════════════════════════════════════
 * AsciiArtCanvas — React wrapper: sizing, image loading, the rAF loop
 * ═════════════════════════════════════════════════════════════════════════ */

export const PHOTO_PRESETS = [
  { id: "portrait", label: "portrait", src: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=1200&q=80&auto=format&fit=crop" },
  { id: "city", label: "city", src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80&auto=format&fit=crop" },
  { id: "city2", label: "crosswalk", src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80&auto=format&fit=crop" },
  { id: "forest", label: "forest", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&auto=format&fit=crop" },
  { id: "ridge", label: "ridge", src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80&auto=format&fit=crop" },
  { id: "stars", label: "stars", src: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1200&q=80&auto=format&fit=crop" },
  { id: "peak", label: "peak", src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80&auto=format&fit=crop" },
] as const;

export function AsciiArtCanvas({
  settings,
  imageSrc,
  className,
  label = "ASCII effect canvas",
}: {
  settings: AsciiArtSettings;
  imageSrc: string;
  className?: string;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const ready = loadedSrc !== null && loadedSrc === imageSrc;

  // load (or swap) the source photo
  useEffect(() => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.src = imageSrc;
    im.onload = () => {
      imgRef.current = im;
      setLoadedSrc(imageSrc);
    };
    im.onerror = () => setLoadedSrc(null);
    return () => { im.onload = null; im.onerror = null; };
  }, [imageSrc]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let last = performance.now();
    let frames = 0, fpsT = last;
    let disposed = false;

    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.min(Math.round(parent.clientWidth * dpr), 1280);
      const h = Math.round(w * (parent.clientHeight / Math.max(parent.clientWidth, 1)));
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    fit();

    const start = performance.now();
    const frame = (now: number) => {
      if (disposed) return;
      const s = settingsRef.current;
      const interval = 1000 / Math.max(4, s.fps);
      if (now - last >= interval) {
        last = now - ((now - last) % interval);
        fit();
        const t = s.animated && !reducedMotion ? (now - start) / 1000 : 0;
        renderAsciiArt(canvas, s, t, imgRef.current);
        frames++;
        if (now - fpsT > 1000) {
          setFps(Math.round((frames * 1000) / (now - fpsT)));
          frames = 0; fpsT = now;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(fit);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ready, reducedMotion]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${label} — ${settings.renderMode} render of the source photo`}
        className="block h-full w-full"
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-text-muted">
          loading source photo…
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-text-muted/70">
        {fps > 0 ? `${fps} fps` : ""}
      </div>
    </div>
  );
}

/* convenience hook for building controls — stable setter pair */
export function useAsciiSettings(initial: AsciiArtSettings) {
  const [settings, setSettings] = useState(initial);
  const patch = useCallback(
    (p: Partial<AsciiArtSettings>) => setSettings((prev) => ({ ...prev, ...p })),
    [],
  );
  return { settings, patch };
}
