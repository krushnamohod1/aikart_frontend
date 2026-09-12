"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewRequestForm from "@/app/custom-agents/new/NewRequestForm";

// Global "Custom Solution" popup — the same custom-agent request form that
// lives at /custom-agents/new, opened as a modal instead of a page navigation.
// Any part of the app can open it via window.dispatchEvent(new
// CustomEvent("open-custom-solution-modal")), mirroring ScheduleMeetingModal.
export function CustomSolutionModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-custom-solution-modal", handleOpen);
    return () => window.removeEventListener("open-custom-solution-modal", handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 w-full max-w-3xl max-h-[90vh] max-h-[90dvh] sm:max-h-[92vh] sm:max-h-[92dvh] overflow-y-auto relative shadow-2xl mx-auto my-auto">
        <NewRequestForm
          isModal
          onClose={() => setOpen(false)}
          onSuccess={(listingId) => {
            setOpen(false);
            router.push(`/custom-agents`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

