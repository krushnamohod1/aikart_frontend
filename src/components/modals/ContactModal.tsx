"use client";

import { useEffect, useState } from "react";
import { ContactSection } from "@/components/contact/ContactSection";

// Global "Contact Us" popup — any part of the app can open it by dispatching
// window.dispatchEvent(new CustomEvent("open-contact-modal")), the same
// pattern ScheduleMeetingModal uses for "open-schedule-meeting".
export function ContactModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-contact-modal", handleOpen);
    return () => window.removeEventListener("open-contact-modal", handleOpen);
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
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 pt-16 pb-8 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-[620px] max-h-[calc(100vh-80px)] overflow-y-auto relative shadow-2xl mx-auto my-auto border border-gray-100">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white flex items-center justify-center text-lg cursor-pointer transition-colors z-10"
          aria-label="Close contact modal"
        >
          ×
        </button>
        <ContactSection compact onSuccess={() => setOpen(false)} />
      </div>
    </div>
  );
}
