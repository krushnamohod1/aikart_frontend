"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandableDescriptionProps {
  content: string;
  maxCharLength?: number;
  label?: string;
}

export default function ExpandableDescription({
  content,
  maxCharLength = 180,
  label = "Read more",
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  // Check if content is considered "big / long"
  const lineCount = (content.match(/\n/g) || []).length;
  const isLongText = content.length > maxCharLength || lineCount >= 3;

  // If text is short, render standard text without collapse button
  if (!isLongText) {
    return <div className="ad-description">{content}</div>;
  }

  return (
    <div className="relative group">
      <div
        className={`ad-description transition-all duration-300 relative ${
          isExpanded ? "" : "line-clamp-3 max-h-[82px] overflow-hidden"
        }`}
      >
        {content}

        {/* Smooth gradient overlay at bottom when collapsed */}
        {!isExpanded && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"
          />
        )}
      </div>

      {/* Button matching top category ad-pill styling */}
      <div className="mt-3 flex items-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ad-pill inline-flex items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-blue-50/60 active:scale-[0.98] focus:outline-none"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Show less" : label}</span>
          <ChevronDown
            className={`w-4 h-4 text-[#2563eb] transition-transform duration-300 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
