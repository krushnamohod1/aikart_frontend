"use client";

import React from "react";

interface ToolLogo {
  name: string;
  src: string;
  dh: number; // desktop height in px
  mh: number; // mobile height in px
}

const TOOLS: ToolLogo[] = [
  { name: "Amazon Web Services", src: "/logos/aws.svg", dh: 44, mh: 30 },
  { name: "Google Cloud Platform", src: "/logos/gcp.svg", dh: 42, mh: 28 },
  { name: "Docker", src: "/logos/docker.svg", dh: 42, mh: 28 },
  { name: "n8n", src: "/logos/n8n.png", dh: 36, mh: 24 },
  { name: "NGINX", src: "/logos/nginx.svg", dh: 36, mh: 24 },
  { name: "PostgreSQL", src: "/logos/postgresql.svg", dh: 46, mh: 32 },
  { name: "Kubernetes", src: "/logos/kubernetes.svg", dh: 42, mh: 28 },
  { name: "Redis", src: "/logos/redis.svg", dh: 40, mh: 28 },
  { name: "GitLab", src: "/logos/gitlab.svg", dh: 30, mh: 20 },
  { name: "Snowflake", src: "/logos/snowflake.svg", dh: 32, mh: 22 },
  { name: "MongoDB", src: "/logos/mongodb.svg", dh: 38, mh: 26 },
  { name: "Grafana", src: "/logos/grafana.svg", dh: 42, mh: 28 },
  { name: "Microsoft Azure", src: "/logos/azure.svg", dh: 40, mh: 26 },
];

export function ToolsWeWorkWith() {
  // Duplicate array twice for seamless marquee loop
  const marqueeItems = [...TOOLS, ...TOOLS];

  return (
    <section className="tools-sec" aria-label="The Tech Stack">
      <style dangerouslySetInnerHTML={{ __html: TOOLS_CSS }} />

      <div className="tools-container">
        <div className="tools-header">
          <p className="tools-eyebrow hm-grad">THE TECH STACK</p>
          <h2 className="tools-h2">Built on the tools powering modern AI</h2>
        </div>
      </div>

      {/* Marquee Viewport with soft left and right edge gradient fades */}
      <div className="tools-marquee-viewport">
        <div className="tools-marquee-track">
          {marqueeItems.map((tool, idx) => (
            <div
              key={`${tool.name}-${idx}`}
              className="tools-item"
              title={tool.name}
            >
              <img
                src={tool.src}
                alt={tool.name}
                className="tools-logo-img"
                style={{
                  "--dh": `${tool.dh}px`,
                  "--mh": `${tool.mh}px`,
                } as React.CSSProperties}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TOOLS_CSS = `
/* ─── The Tech Stack Section ─── */
.tools-sec {
  position: relative;
  background: #f8fafc;
  padding: 84px 0 56px;
  overflow: hidden;
  border-top: 1px solid #e8ecf1;
  font-family: var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.tools-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 1024px) {
  .tools-container {
    padding: 0 40px;
  }
}

.tools-header {
  text-align: left;
  margin-bottom: 34px;
}

.tools-eyebrow {
  font-family: var(--font-inter), sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 10px;
  background: linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%);
  background-size: 200% 100% !important;
  background-position: 0% 50%;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
  animation: movingGradientShift 6s linear infinite !important;
  display: inline-block;
}

.tools-h2 {
  font-family: var(--font-red-hat), 'Red Hat Display', var(--font-inter), sans-serif;
  font-weight: 500;
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1.15;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
  text-align: left;
}

/* ─── Marquee Viewport with Edge Fade Masks ─── */
.tools-marquee-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 16px 0;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 1) 8%,
    rgba(0, 0, 0, 1) 92%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 1) 8%,
    rgba(0, 0, 0, 1) 92%,
    transparent 100%
  );
}

/* ─── Infinite Marquee Track ─── */
@keyframes tools-marquee-anim {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

.tools-marquee-track {
  display: flex;
  align-items: center;
  gap: 56px;
  width: max-content;
  will-change: transform;
  animation: tools-marquee-anim 40s linear infinite;
  user-select: none;
  -webkit-user-select: none;
}

/* Pause on hover (desktop) & active touch (mobile) */
.tools-marquee-track:hover,
.tools-marquee-track:active {
  animation-play-state: paused;
}

/* ─── Logo Item without Card Box ─── */
.tools-item {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.tools-item:hover {
  transform: scale(1.08);
}

.tools-logo-img {
  height: var(--dh, 42px);
  width: auto;
  max-width: 190px;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.03));
  transition: transform 0.25s ease, filter 0.25s ease;
}

.tools-item:hover .tools-logo-img {
  filter: drop-shadow(0 6px 16px rgba(37, 99, 235, 0.15));
}

/* ─── Responsive Viewports ─── */
@media (max-width: 768px) {
  .tools-sec {
    padding: 48px 0 36px;
  }
  .tools-header {
    margin-bottom: 24px;
  }
  .tools-eyebrow {
    font-size: 14px;
    letter-spacing: 0.15em;
    margin-bottom: 6px;
  }
  .tools-h2 {
    font-size: clamp(20px, 5.5vw, 26px);
    line-height: 1.25;
    margin-bottom: 0;
  }
  .tools-marquee-viewport {
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(0, 0, 0, 1) 5%,
      rgba(0, 0, 0, 1) 95%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(0, 0, 0, 1) 5%,
      rgba(0, 0, 0, 1) 95%,
      transparent 100%
    );
  }
  .tools-marquee-track {
    gap: 40px;
    animation-duration: 30s;
  }
  .tools-logo-img {
    height: var(--mh, 30px);
    max-width: 140px;
  }
}

@media (max-width: 480px) {
  .tools-sec {
    padding: 40px 0 28px;
  }
  .tools-eyebrow {
    font-size: 13px;
  }
  .tools-h2 {
    font-size: 22px;
  }
  .tools-marquee-track {
    gap: 32px;
    animation-duration: 26s;
  }
  .tools-logo-img {
    height: var(--mh, 26px);
    max-width: 125px;
  }
}

/* ─── Accessibility: Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  .tools-marquee-track {
    animation: none !important;
    overflow-x: auto;
    width: 100%;
    padding: 0 16px;
    justify-content: flex-start;
  }
  .tools-marquee-viewport {
    mask-image: none !important;
    -webkit-mask-image: none !important;
  }
}
`;
