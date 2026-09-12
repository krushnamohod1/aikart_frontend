"use client";

import { useState } from "react";

export function PostMLModelButton({
  className = "",
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-custom-ml-modal"));
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        suppressHydrationWarning
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Post a Custom ML Model Request"
        className={`group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${
          showText ? "px-4 py-2.5 text-sm" : "w-11 h-11"
        } ${className}`}
      >
        <span className="material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:rotate-90">
          add
        </span>
        {showText && <span>Post Requirement</span>}
      </button>

      {/* Hover Tooltip — same structure as AddCustomSolutionButton */}
      {isHovered && (
        <div
          role="tooltip"
          className="absolute right-0 bottom-full mb-3 z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
          style={{ width: "max-content", maxWidth: "260px" }}
        >
          <div className="bg-white text-gray-800 text-xs rounded-xl py-2.5 px-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col gap-0.5">
            <span className="font-semibold text-[#2563EB] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#2563EB]">memory</span>
              Need a custom ML model?
            </span>
            <span className="text-[#64748B] text-[11.5px] leading-snug">
              Our team will connect with you.
            </span>
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute right-4 top-full -mt-[1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
        </div>
      )}
    </div>
  );
}
