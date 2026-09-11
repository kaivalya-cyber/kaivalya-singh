"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AsciiArtCanvas,
  PHOTO_PRESETS,
  type AsciiArtSettings,
} from "@/components/ui/ascii-art";

/* The 21st.dev recipe's exact parameters, re-keyed to the site palette.
 * bgMode "original" keeps the photo faintly behind the glyph pass. */
const RECIPE: AsciiArtSettings = {
  renderMode: "lines",
  bgMode: "original",
  bgBlur: 6,
  bgOpacity: 50,
  cellSize: 10,
  coverage: 50,
  invert: true,
  styleBlend: "color-dodge",
  charSet: "standard",
  customChars: "",
  brightness: 64,
  contrast: 115,
  edgeEmphasis: 72,
  density: 16,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 0.640732312907961, y: 0.3202480397974414 },
    { x: 1, y: 1 },
  ],
  tint: "#8b5a2b",
  tintOpacity: 0,
  overlayBlend: "soft-light",
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  blurAmount: 35,
  animated: true,
  animStyle: "flicker",
  animSpeed: { enabled: true, intensity: 163 },
  animIntensity: { enabled: true, intensity: 77 },
  pfx: {
    scanLines: { enabled: false, intensity: 40 },
    vignette: { enabled: true, intensity: 38 },
    bloom: { enabled: false, intensity: 25 },
    chromatic: { enabled: false, intensity: 15 },
    filmGrain: { enabled: true, intensity: 30 },
    glitch: { enabled: true, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    halftone: { enabled: false, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 },
  },
  lights: { enabled: false, points: [{ x: 0.3, y: 0.3, radius: 30, intensity: 60 }] },
  mask: { enabled: false, invert: false, dataUrl: null },
  fps: 30,
};

const RENDER_MODES: { id: AsciiArtSettings["renderMode"]; label: string }[] = [
  { id: "lines", label: "lines" },
  { id: "characters", label: "chars" },
  { id: "dither", label: "dither" },
  { id: "halfblocks", label: "halfblk" },
  { id: "braille", label: "braille" },
  { id: "dots", label: "dots" },
  { id: "cross", label: "cross" },
  { id: "diamond", label: "diamnd" },
  { id: "voxel", label: "voxel" },
  { id: "lego", label: "lego" },
  { id: "mixed", label: "mixed" },
  { id: "diagonal", label: "diag" },
  { id: "disco", label: "disco" },
  { id: "hexdump", label: "hexdump" },
  { id: "matrix", label: "matrix" },
  { id: "rings", label: "rings" },
  { id: "hearts", label: "hearts" },
  { id: "stars", label: "stars" },
  { id: "hexagons", label: "hexagon" },
  { id: "triangles", label: "triang" },
  { id: "bubbles", label: "bubble" },
  { id: "hatch", label: "hatch" },
  { id: "contour", label: "contour" },
  { id: "mosaic", label: "mosaic" },
  { id: "pixel", label: "pixel" },
];

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between font-mono text-[11px] text-text-muted">
        {label}
        <span className="text-accent-add">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--accent-add)]"
      />
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
        on
          ? "bg-bg-raised text-accent-add"
          : "text-text-muted hover:text-text-primary"
      }`}
    >
      {on ? "◉" : "○"} {label}
    </button>
  );
}

export function AsciiLab() {
  const [settings, setSettings] = useState<AsciiArtSettings>(RECIPE);
  const [photo, setPhoto] = useState<{ id: string; label: string; src: string }>(
    PHOTO_PRESETS[0],
  );
  const [showPanel, setShowPanel] = useState(true);

  const patch = (p: Partial<AsciiArtSettings>) =>
    setSettings((prev) => ({ ...prev, ...p }));
  const patchPfx = (key: keyof AsciiArtSettings["pfx"], p: Partial<{ enabled: boolean; intensity: number }>) =>
    setSettings((prev) => ({
      ...prev,
      pfx: { ...prev.pfx, [key]: { ...prev.pfx[key], ...p } },
    }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 md:px-12">
      <p className="font-mono text-xs text-text-muted">
        <Link href="/" className="hover:text-accent-link">
          ← cd ~/portfolio
        </Link>
      </p>
      <p className="mt-6 font-mono text-xs uppercase text-accent-add">
        $ node lab/ascii-effect --recipe spiderman --theme amber
      </p>
      <h1 className="mt-3 font-display text-2xl md:text-4xl">
        ASCII effect lab
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
        A Canvas2D recreation of the 21st.dev ASCII recipe — cell sampling,
        24 render modes, tone curve, post effects, and the flicker animation —
        re-keyed from the original red/white to this site&apos;s amber-phosphor
        palette. Everything below renders live; drag the sliders.
      </p>

      {/* ── canvas ── */}
      <div className="relative mt-8 overflow-hidden rounded-lg border border-border bg-black/40">
        <AsciiArtCanvas
          settings={settings}
          imageSrc={photo.src}
          className="aspect-[4/3] w-full"
          label={`21st.dev ASCII effect (${photo.label})`}
        />
        <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-accent-link/80">
          mode: {settings.renderMode} · cell {settings.cellSize}px · {photo.label}
        </div>
      </div>

      {/* ── photos ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-text-muted">source:</span>
        {PHOTO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPhoto(p)}
            aria-pressed={photo.id === p.id}
            className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
              photo.id === p.id
                ? "bg-bg-raised text-accent-add"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── controls ── */}
      <div className="mt-6 rounded-lg border border-border bg-bg-raised/40 p-4 md:p-6">
        <button
          type="button"
          onClick={() => setShowPanel((v) => !v)}
          className="font-mono text-xs text-text-muted hover:text-text-primary"
        >
          {showPanel ? "▾" : "▸"} controls
        </button>

        {showPanel && (
          <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] uppercase text-accent-link">
                render
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {RENDER_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => patch({ renderMode: m.id })}
                    aria-pressed={settings.renderMode === m.id}
                    className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                      settings.renderMode === m.id
                        ? "bg-bg-raised text-accent-add"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {(
                  [
                    ["blurred", "bg: blurred"],
                    ["original", "bg: photo"],
                    ["flat", "bg: flat"],
                    ["nothing", "bg: none"],
                  ] as const
                ).map(([mode, label]) => (
                  <Toggle
                    key={mode}
                    label={label}
                    on={settings.bgMode === mode}
                    onChange={() => patch({ bgMode: mode })}
                  />
                ))}
              </div>
              <Slider label="cell size" value={settings.cellSize} min={4} max={40} onChange={(v) => patch({ cellSize: v })} suffix="px" />
              <Slider label="coverage" value={settings.coverage} min={0} max={100} onChange={(v) => patch({ coverage: v })} suffix="%" />
              <Slider label="edge emphasis" value={settings.edgeEmphasis} min={0} max={100} onChange={(v) => patch({ edgeEmphasis: v })} suffix="%" />
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase text-accent-link">
                tone
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Toggle label="invert" on={settings.invert} onChange={(v) => patch({ invert: v })} />
                <Toggle label="bg blur" on={settings.bgBlur > 0} onChange={(v) => patch({ bgBlur: v ? 6 : 0 })} />
              </div>
              <Slider label="bg opacity" value={settings.bgOpacity} min={0} max={100} onChange={(v) => patch({ bgOpacity: v })} suffix="%" />
              <Slider label="brightness" value={settings.brightness} min={0} max={200} onChange={(v) => patch({ brightness: v })} suffix="%" />
              <Slider label="contrast" value={settings.contrast} min={0} max={200} onChange={(v) => patch({ contrast: v })} suffix="%" />
              <Slider label="saturation" value={settings.saturation} min={0} max={200} onChange={(v) => patch({ saturation: v })} suffix="%" />
              <Slider label="grayscale" value={settings.grayscale} min={0} max={100} onChange={(v) => patch({ grayscale: v })} suffix="%" />
              <Slider label="density gate" value={settings.density} min={0} max={100} onChange={(v) => patch({ density: v })} suffix="%" />
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase text-accent-link">
                motion + film
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(["flicker", "wave", "pulse", "shimmer", "ripple"] as const).map((style) => (
                  <Toggle
                    key={style}
                    label={style}
                    on={settings.animStyle === style}
                    onChange={() => patch({ animStyle: style })}
                  />
                ))}
              </div>
              <Slider label="anim speed" value={settings.animSpeed.intensity} min={0} max={300} onChange={(v) => patch({ animSpeed: { enabled: true, intensity: v } })} />
              <Slider label="anim intensity" value={settings.animIntensity.intensity} min={0} max={100} onChange={(v) => patch({ animIntensity: { enabled: true, intensity: v } })} suffix="%" />
              <div className="mt-2 flex flex-wrap gap-1">
                {(Object.keys(settings.pfx) as (keyof AsciiArtSettings["pfx"])[]).map((key) => (
                  <Toggle
                    key={key}
                    label={key}
                    on={settings.pfx[key].enabled}
                    onChange={(v) => patchPfx(key, { enabled: v })}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <Toggle
                  label="glow (lights)"
                  on={settings.lights.enabled}
                  onChange={(v) => patch({ lights: { enabled: v, points: settings.lights.points } })}
                />
                <button
                  type="button"
                  onClick={() => setSettings(RECIPE)}
                  className="rounded px-2 py-1 font-mono text-[11px] text-accent-remove hover:underline"
                >
                  reset recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 font-mono text-[11px] text-text-muted">
        engine: components/ui/ascii-art.tsx · zero effect dependencies · photos
        via unsplash (free to use) · original recipe: 21st.dev/community/ascii
      </p>
    </div>
  );
}
