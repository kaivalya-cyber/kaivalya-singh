"use client";

import {
  AsciiArtCanvas,
  type AsciiArtSettings,
} from "@/components/ui/ascii-art";

/**
 * AsciiBackdrop — the 21st.dev "Spider-Man" ASCII-effect, rebuilt on Canvas2D
 * (engine: components/ui/ascii-art.tsx) and run with the recipe's exact
 * parameters — every color re-keyed from red to the site's amber-phosphor
 * palette. Fills its parent as an animated decorative background.
 */

const SETTINGS: AsciiArtSettings = {
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
  lights: { enabled: false, points: [] },
  mask: { enabled: false, invert: false, dataUrl: null },
  fps: 30,
};

/* The recipe ships without a recorded source photo — the reference frames a
 * light subject on a dark field (the emblem shows through the bg plate at
 * bgOpacity while invert:true animates the field around it). This plate is
 * authored in that composition, re-keyed red -> amber. */
const SOURCE = "/spider-emblem.svg";

export function AsciiBackdrop({ className }: { className?: string }) {
  return (
    <AsciiArtCanvas
      settings={SETTINGS}
      imageSrc={SOURCE}
      className={className}
      label="Animated ASCII-effect backdrop"
    />
  );
}
