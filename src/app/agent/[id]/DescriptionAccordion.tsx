"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DescriptionSection {
  id: string;
  title: string;
  content: string;
}

interface DescriptionAccordionProps {
  description: string;
  problemSolved?: string | null;
  howItHelps?: string | null;
}

// Renders paragraphs normally, but groups any run of indented lines (a
// content convention for list-style points) into an actual bulleted <ul>
// instead of leaving them as raw, pre-wrapped whitespace.
function renderContent(content: string) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc pl-5 space-y-1.5 my-2">
        {currentList.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
    currentList = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (/^[ \t]/.test(line)) {
      currentList.push(trimmed);
    } else {
      flushList();
      blocks.push(
        <p key={`p-${i}`} className="mb-2 last:mb-0">
          {trimmed}
        </p>
      );
    }
  });
  flushList();

  return blocks;
}

export default function DescriptionAccordion({
  description,
  problemSolved,
  howItHelps,
}: DescriptionAccordionProps) {
  const sections: DescriptionSection[] = [];

  if (description?.trim()) {
    sections.push({
      id: "about",
      title: "About your AI Solution?",
      content: description,
    });
  }

  if (problemSolved?.trim()) {
    sections.push({
      id: "problem",
      title: "What problem does it solve?",
      content: problemSolved,
    });
  }

  if (howItHelps?.trim()) {
    sections.push({
      id: "help",
      title: "How it helps?",
      content: howItHelps,
    });
  }

  // All description sections start collapsed by default
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    // Only show the clicked question description, hide others (accordion behavior)
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-3">
      {sections.map((section, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={section.id}
            className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
              isOpen
                ? "border-blue-500/40 bg-blue-50/20 shadow-[0_2px_10px_rgba(37,99,235,0.06)]"
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection(index)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left font-medium transition-colors cursor-pointer select-none group"
              aria-expanded={isOpen}
            >
              <span
                className={`text-[15px] sm:text-[16px] font-semibold transition-colors ${
                  isOpen ? "text-blue-700 font-bold" : "text-slate-800 group-hover:text-slate-900"
                }`}
              >
                {section.title}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isOpen
                    ? "bg-blue-600 text-white rotate-180 shadow-sm"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                }`}
              >
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-blue-100/60">
                <div className="text-[14.5px] leading-relaxed text-slate-600 font-normal">
                  {renderContent(section.content)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
