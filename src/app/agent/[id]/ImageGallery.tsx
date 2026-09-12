"use client";

import { useState } from "react";

type MediaItem = { url: string; type: string };

export default function ImageGallery({
  media,
}: {
  media: MediaItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

  if (media.length === 0) return null;

  const active = media[activeIndex];
  const isVideoSlide = active.type === "video";

  const goTo = (i: number) => {
    setActiveIndex(i);
    setVideoPlaying(false); // require an explicit click to (re)play when revisiting the video slide
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-surface-container-low shadow-2xl border border-outline-variant/10">
      {/* Main media */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-black">
        {isVideoSlide ? (
          videoPlaying ? (
            <video
              src={active.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <button
              type="button"
              onClick={() => setVideoPlaying(true)}
              className="group relative w-full h-full"
              aria-label="Play demo video"
            >
              <video
                src={active.url}
                preload="metadata"
                muted
                className="w-full h-full object-contain pointer-events-none"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <span className="w-20 h-20 rounded-full bg-white/90 group-hover:scale-110 group-hover:bg-white transition-all flex items-center justify-center shadow-2xl">
                  <span className="material-symbols-outlined text-black text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                </span>
              </span>
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-1 rounded-md backdrop-blur-sm">
                Demo Video
              </span>
            </button>
          )
        ) : (
          <img
            src={active.url}
            alt={`Screenshot ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}

        {/* Navigation arrows if multiple */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => goTo((activeIndex - 1 + media.length) % media.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
            </button>
            <button
              onClick={() => goTo((activeIndex + 1) % media.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
            </button>
          </>
        )}

        {/* Index indicator */}
        {media.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIndex
                    ? "bg-white scale-125"
                    : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-3 p-4 bg-background/80 overflow-x-auto">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? "scale-105"
                  : "border-transparent hover:border-outline-variant/50 opacity-60 hover:opacity-100"
              }`}
              style={i === activeIndex ? { borderColor: "#2563eb", boxShadow: "0 0 12px rgba(37,99,235,0.4)" } : undefined}
            >
              {m.type === "video" ? (
                <>
                  <video src={m.url} muted preload="metadata" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="material-symbols-outlined text-white text-lg drop-shadow">play_circle</span>
                  </span>
                </>
              ) : (
                <img
                  src={m.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
