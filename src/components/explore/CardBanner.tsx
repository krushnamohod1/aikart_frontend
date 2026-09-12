"use client";

import { useEffect, useRef, useState } from "react";

export const fallbackGradients = [
  "linear-gradient(135deg, #7986cb 0%, #3f51b5 100%)",
  "linear-gradient(135deg, #ba68c8 0%, #8e24aa 100%)",
  "linear-gradient(135deg, #4db6ac 0%, #00897b 100%)",
  "linear-gradient(135deg, #d98a73 0%, #a85443 100%)",
  "linear-gradient(135deg, #4dd0e1 0%, #00acc1 100%)",
  "linear-gradient(135deg, #ff8a65 0%, #f4511e 100%)",
  "linear-gradient(135deg, #90a4ae 0%, #607d8b 100%)",
  "linear-gradient(135deg, #f06292 0%, #d81b60 100%)",
];

/** Convert RGB to hex string */
function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Convert RGB (0–255) to HSL ({h: 0–360, s: 0–1, l: 0–1}) */
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** Convert HSL ({h: 0–360, s: 0–1, l: 0–1}) to a hex color string */
function hslToHex(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/**
 * Sample the dominant colour of an <img> element by drawing it on a canvas
 * and averaging pixel values (ignoring near-white/near-black pixels).
 */
function extractDominantColor(
  img: HTMLImageElement
): { r: number; g: number; b: number } | null {
  try {
    const canvas = document.createElement("canvas");
    const SIZE = 64; // downsample for speed
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

    let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue; // skip transparent

      const brightness = (r + g + b) / 3;
      // skip near-white (> 230) and near-black (< 25)
      if (brightness > 230 || brightness < 25) continue;

      // Weight saturated (colorful) pixels more heavily than gray ones, so a
      // logo's accent color wins out over grayscale/anti-aliased edges —
      // otherwise averaging tends to collapse everything into muddy brown-gray.
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const saturation = maxc === 0 ? 0 : (maxc - minc) / maxc;
      const weight = 0.2 + saturation;

      rSum += r * weight; gSum += g * weight; bSum += b * weight; weightSum += weight;
    }

    if (weightSum === 0) return null;
    return {
      r: Math.round(rSum / weightSum),
      g: Math.round(gSum / weightSum),
      b: Math.round(bSum / weightSum),
    };
  } catch {
    return null; // cross-origin or other canvas error
  }
}

export function CardBanner({
  logoUrl,
  fallbackGrad,
  className,
  style,
  index = 0,
}: {
  logoUrl?: string | null;
  fallbackGrad?: string;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [gradient, setGradient] = useState<string>(
    fallbackGrad || fallbackGradients[index % fallbackGradients.length]
  );
  const [glowColor, setGlowColor] = useState<string>("rgba(255,255,255,0.15)");

  useEffect(() => {
    if (!logoUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      imgRef.current = img;
      const color = extractDominantColor(img);
      if (!color) return;

      const { r, g, b } = color;
      const { h, s } = rgbToHsl(r, g, b);
      // Keep the logo's hue (so each agent gets its own distinct color) but
      // pin saturation/lightness to a light, vivid range instead of the raw
      // averaged value — otherwise logos land as either washed-out grays or,
      // after darkening, near-black. This keeps every banner light and colorful.
      const sat = Math.min(0.62, Math.max(0.42, s + 0.12));
      const lightHex = hslToHex(h, sat, 0.68);
      const darkHex = hslToHex(h, sat, 0.46);

      setGradient(
        `linear-gradient(135deg, ${lightHex} 0%, ${darkHex} 100%)`
      );
      setGlowColor(`rgba(${r},${g},${b},0.45)`);
    };

    img.src = logoUrl;
  }, [logoUrl]);

  // Turn the two-stop gradient into a wider, three-stop strip and pan its
  // background-position — a lightweight way to make the banner feel alive
  // without re-rendering or animating any DOM colour values.
  const stops = gradient.match(/#[0-9a-fA-F]{3,8}/g);
  const animatedBg = stops && stops.length >= 2
    ? `linear-gradient(120deg, ${stops[0]} 0%, ${stops[1]} 50%, ${stops[0]} 100%)`
    : gradient;
  const variant = Math.abs(index) % 3;
  const duration = 4 + variant * 1.4; // 4s / 5.4s / 6.8s — desyncs adjacent cards
  const delay = -(variant * 1.6); // negative delay starts each mid-cycle

  return (
    <div
      className={`${className || "ex-card-banner"} cb-anim`}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: animatedBg,
        ["--cb-duration" as string]: `${duration}s`,
        ["--cb-delay" as string]: `${delay}s`,
        ...style,
      } as React.CSSProperties}
    >
      <style>{`
        .cb-anim {
          background-size: 350% 350%;
          animation: cardBannerPan var(--cb-duration, 5s) linear infinite;
          animation-delay: var(--cb-delay, 0s);
        }
        @keyframes cardBannerPan {
          0%   { background-position: 0% 20%; }
          25%  { background-position: 60% 80%; }
          50%  { background-position: 100% 30%; }
          75%  { background-position: 40% 90%; }
          100% { background-position: 0% 20%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cb-anim { animation: none; }
        }
      `}</style>

      {/* Radial glow blob derived from logo colour */}
      {logoUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse 70% 80% at 30% 60%, ${glowColor} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}