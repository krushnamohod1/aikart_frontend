"use client";

import { useState } from "react";
import { toggleLike } from "@/lib/api-client/likes";

export default function LikeButton({
  listingId,
  initialLiked,
  initialCount,
}: {
  listingId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    const prevLiked = liked;
    const prevCount = count;
    // Optimistic update
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));

    const res = await toggleLike(listingId);
    setBusy(false);
    if (res.error) {
      setLiked(prevLiked);
      setCount(prevCount);
    } else {
      setLiked(!!res.liked);
      if (typeof res.count === "number") setCount(res.count);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={liked ? "Unlike" : "Like"}
      className={`group flex-1 py-3 px-4 rounded-full border-[1.5px] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
        liked
          ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
          : "border-[#0f172a]/30 bg-white text-[#0f172a] hover:bg-gray-50"
      }`}
    >
      <span
        className="material-symbols-outlined text-[20px] transition-colors duration-200 group-hover:text-red-500 [font-variation-settings:'FILL'_0] group-hover:[font-variation-settings:'FILL'_1]"
        style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        favorite
      </span>
      <span>{count > 0 ? count : "Like"}</span>
    </button>
  );
}
