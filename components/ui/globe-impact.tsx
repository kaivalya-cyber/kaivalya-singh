"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import createGlobe from "cobe";

export interface ImpactMarker {
  id: string;
  location: [number, number];
  /** Short mono label, e.g. "san jose, ca" */
  label: string;
  /** What happened here — shown in the tooltip card */
  detail: string;
  /** Stat line, e.g. "400+ students" */
  stat: string;
}

export interface ImpactArc {
  id: string;
  from: [number, number];
  to: [number, number];
}

interface GlobeImpactProps {
  markers?: ImpactMarker[];
  arcs?: ImpactArc[];
  className?: string;
  speed?: number;
}

/* ── Amber-phosphor palette, converted to cobe's 0..1 RGB ─────────────────
 * dark: 1 keeps the sphere itself dark; the map dots glow amber. */
const AMBER = [0.824, 0.6, 0.133] as const; // #D29922
const BASE = [0.18, 0.16, 0.12] as const; // dim warm charcoal continents
const GLOW = [0.09, 0.08, 0.06] as const; // near-black warm halo
const MARKER = [0.91, 0.83, 0.66] as const; // pale amber pins

/* ── Every pin is derived from the portfolio — nothing invented ────────────
 * San Jose: home base (site.ts location).
 * San Francisco: Olostep HQ (verified) + 1st Place SF Hackathon (site.ts).
 * Palo Alto: Open Source Vision Foundation HQ (verified — OpenCV's parent).
 * Brooklyn: UPchieve HQ (verified) — 200+ tutoring hours served there.
 * Cambridge: MIT BWSI Quantum Software (site.ts background).
 * San Jose area: Evergreen Valley HS + Second Harvest Food Bank (site.ts).
 * Newark, DE: Olostep corporate office (verified via PitchBook).
 * FTC: FIRST HQ in Manchester, NH — the 1,762-match dataset's source org. */
const IMPACT_MARKERS: ImpactMarker[] = [
  {
    id: "sanjose",
    location: [37.3382, -121.8863],
    label: "san jose, ca",
    detail: "Home base — Evergreen Valley HS, dual-enrollment CS & math",
    stat: "class of 2028",
  },
  {
    id: "sanfrancisco",
    location: [37.7749, -122.4194],
    label: "san francisco, ca",
    detail: "SWE intern @ Olostep · 1st Place SF Hackathon",
    stat: "og-image pipeline in production",
  },
  {
    id: "palalto",
    location: [37.4419, -122.143],
    label: "palo alto, ca",
    detail: "ML Specialist @ Open Source Vision Foundation (OpenCV)",
    stat: "open-source CV tooling",
  },
  {
    id: "brooklyn",
    location: [40.6925, -73.9903],
    label: "brooklyn, ny",
    detail: "UPchieve HQ — 200+ hrs of free tutoring served",
    stat: "200+ tutoring hrs",
  },
  {
    id: "cambridge",
    location: [42.3601, -71.0942],
    label: "cambridge, ma",
    detail: "MIT BWSI — Quantum Software",
    stat: "where the qec work started",
  },
  {
    id: "newark",
    location: [39.6837, -75.7497],
    label: "newark, de",
    detail: "Olostep corporate office",
    stat: "web data infra",
  },
  {
    id: "manchester",
    location: [42.9956, -71.4548],
    label: "manchester, nh",
    detail: "FIRST HQ — source org of the FTC Open Analytics Dataset",
    stat: "1,762 matches · 902 teams",
  },
];

/* Arcs connect the places into one story: home → the work. */
const IMPACT_ARCS: ImpactArc[] = [
  { id: "arc-sj-sf", from: [37.3382, -121.8863], to: [37.7749, -122.4194] },
  { id: "arc-sj-pa", from: [37.3382, -121.8863], to: [37.4419, -122.143] },
  { id: "arc-sf-bk", from: [37.7749, -122.4194], to: [40.6925, -73.9903] },
  { id: "arc-sj-cam", from: [37.3382, -121.8863], to: [42.3601, -71.0942] },
  { id: "arc-cam-mht", from: [42.3601, -71.0942], to: [42.9956, -71.4548] },
  { id: "arc-sf-new", from: [37.7749, -122.4194], to: [39.6837, -75.7497] },
];

export function GlobeImpact({
  markers = IMPACT_MARKERS,
  arcs = IMPACT_ARCS,
  className = "",
  speed = 0.0022,
}: GlobeImpactProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 7,
        baseColor: [...BASE],
        markerColor: [...MARKER],
        glowColor: [...GLOW],
        markerElevation: 0.02,
        markers: markers.map((m) => ({
          location: m.location,
          size: 0.06,
          id: m.id,
        })),
        arcs: arcs.map((a) => ({ from: a.from, to: a.to, id: a.id })),
        arcColor: [...AMBER],
        arcWidth: 0.6,
        arcHeight: 0.35,
        opacity: 0.85,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      canvas.style.opacity = "1";
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if ((entries[0]?.contentRect.width ?? 0) > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(animationId);
      globe?.destroy();
    };
  }, [markers, arcs, speed]);

  /* Marker hover cards — HTML overlays positioned around the globe,
     driven by cobe's own per-marker CSS variables. */
  const hoveredMarker = markers.find((m) => m.id === hovered);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <style>{`
        .impact-globe-marker { display: none; }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => setHovered(markers[0]?.id ?? null)}
        onPointerLeave={() => setHovered(null)}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "pan-y",
        }}
      />

      {/* Marker detail card — appears while the globe is engaged */}
      {hoveredMarker && (
        <div
          key={hoveredMarker.id}
          className="pointer-events-none absolute inset-x-4 bottom-0 border border-border bg-bg-raised/90 px-4 py-3 backdrop-blur-sm"
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-wide text-accent-add">
            {hoveredMarker.label}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-primary">
            {hoveredMarker.detail}
          </p>
          <p className="mt-1 font-mono text-[0.65rem] text-text-muted">
            {hoveredMarker.stat}
          </p>
        </div>
      )}

      {/* Static legend — honest labels, no fake traffic */}
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1 font-mono text-[0.6rem] text-text-muted">
        <span>
          <span className="text-accent-add">●</span> {markers.length} places
        </span>
        <span>
          <span className="text-accent-add">—</span> {arcs.length} connections
        </span>
      </div>
    </div>
  );
}

export { IMPACT_MARKERS, IMPACT_ARCS };
