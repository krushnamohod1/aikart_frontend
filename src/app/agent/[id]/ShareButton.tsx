"use client";

import { useState } from "react";

// Copies the current agent's public URL. Anyone opening a shared link who isn't
// signed in is redirected to login/signup (the agent detail page already gates
// on auth), so the share simply spreads the URL.
export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    // Prefer the native share sheet where available (falls through on cancel).
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall back to copy */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Legacy fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={share}
      title="Copy share link"
      className="flex-1 py-3 px-4 rounded-full border-[1.5px] border-[#0f172a]/30 bg-white text-[#0f172a] font-bold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <span className="material-symbols-outlined text-[20px]">
        {copied ? "check" : "share"}
      </span>
      <span>{copied ? "Link copied!" : "Share"}</span>
    </button>
  );
}
