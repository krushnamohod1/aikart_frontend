"use client";

import { useState } from "react";

export function AddCustomSolutionButton({
  className = "",
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-custom-solution-modal"));
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Post a Custom Solution"
        className={`group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${
          showText ? "px-4 py-2.5 text-sm" : "w-11 h-11"
        } ${className}`}
      >
        <span className="material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:rotate-90">
          add
        </span>
        {showText && <span>Post Requirement</span>}
      </button>

      {/* Hover Tooltip Box */}
      {isHovered && (
        <div
          role="tooltip"
          className="absolute right-0 bottom-full mb-3 z-50 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
          style={{ width: "max-content", maxWidth: "260px" }}
        >
          <div className="bg-white text-gray-800 text-xs rounded-xl py-2.5 px-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col gap-0.5">
            <span className="font-semibold text-[#2563EB] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#2563EB]">lightbulb</span>
              Have a custom solution?
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

export function FloatingAddCustomSolutionButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-custom-solution-modal"));
  };

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end">
      {/* Hover Tooltip */}
      <div
        className={`mb-3 transition-all duration-200 pointer-events-none ${
          isHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        style={{ width: "max-content", maxWidth: "260px" }}
      >
        <div className="bg-white text-gray-800 text-xs rounded-xl py-2.5 px-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-gray-200 flex flex-col gap-0.5">
          <span className="font-semibold text-[#2563EB] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#2563EB]">lightbulb</span>
            Have a custom solution?
          </span>
          <span className="text-[#64748B] text-[11.5px] leading-snug">
            Post it here & our team will connect with you!
          </span>
        </div>
        <div className="absolute right-5 top-full -mt-[1px] w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
      </div>

      {/* Floating Button */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Post a Custom Solution"
        className="w-14 h-14 bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/35 hover:shadow-blue-500/50 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/20 group"
      >
        <span className="material-symbols-outlined text-[30px] transition-transform duration-300 group-hover:rotate-90">
          add
        </span>
      </button>
    </div>
  );
}
