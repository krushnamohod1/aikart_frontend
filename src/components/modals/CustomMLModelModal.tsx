"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api-client/config";

const TIMELINE_OPTIONS = [
  "ASAP (1-3 days)",
  "Within a week",
  "2-4 weeks",
  "1-3 months",
  "Flexible / No rush",
];

function MobileTimelineDropdown({
  value,
  onChange,
  options,
  placeholder = "Select timeline...",
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left cursor-pointer transition-all duration-200"
        style={{
          borderRadius: "10px",
          border: open ? "1px solid #2563EB" : "1px solid #D1D5DB",
          backgroundColor: "#FFFFFF",
          padding: "9px 12px",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
          fontSize: "13.5px",
        }}
      >
        <span className={value ? "text-[#111827] font-medium" : "text-[#9CA3AF] font-normal"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              role="button"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </span>
          )}
          <span
            className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180 text-[#2563EB]" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {open && (
        <div
          style={{
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            padding: "6px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
          }}
          className="absolute z-50 left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#E5E7EB] overflow-hidden"
        >
          <div className="flex flex-col gap-1">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(isSelected ? "" : opt);
                    setOpen(false);
                  }}
                  style={{
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  className={`w-full text-left text-[13.5px] transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#EFF6FF] text-[#2563EB] font-medium"
                      : "text-[#374151] hover:bg-[#F8F9FA] hover:text-[#2563EB]"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[18px] text-[#2563EB] font-semibold">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomMLModelModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phone, setPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [wantsMeeting, setWantsMeeting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOptionalMobile, setShowOptionalMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const hasOptionalFilled = Boolean(
    linkedin.trim() || phone.trim() || companyWebsite.trim() || budget.trim()
  );

  const valid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    email.trim().length > 0;

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setSubmitted(false);
      setError(null);
    };
    window.addEventListener("open-custom-ml-modal", handleOpen);
    return () => window.removeEventListener("open-custom-ml-modal", handleOpen);
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

  // Auto-close success screen after 3s
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [submitted]);

  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/custom-ml-request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          email,
          linkedin,
          phone,
          companyWebsite,
          timeline,
          budget,
          wantsMeeting,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to submit request");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setEmail("");
    setLinkedin("");
    setPhone("");
    setCompanyWebsite("");
    setTimeline("");
    setBudget("");
    setWantsMeeting(false);
  }

  if (!open) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .ml-req-field {
            border-radius: 10px;
            border: 1px solid #D1D5DB;
            background-color: #FFFFFF;
            padding: 8px 12px;
            transition: all 0.2s ease;
            outline: none;
            color: #111827;
            font-size: 13.5px;
            font-weight: 400;
            width: 100%;
          }
          @media (min-width: 640px) {
            .ml-req-field {
              border-radius: 12px;
              padding: 10px 16px;
              font-size: 14px;
            }
          }
          .ml-req-field::placeholder { color: #9CA3AF; }
          .ml-req-field:focus {
            border-color: #2563EB !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
          }
          .req-back-btn {
            color: #475569;
            border: 1px solid #E2E8F0;
            background-color: #FFFFFF;
            border-radius: 9999px;
            padding: 5px 11px;
            font-weight: 500;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            text-decoration: none;
            cursor: pointer;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
          }
          @media (min-width: 640px) {
            .req-back-btn {
              padding: 9px 20px;
              font-size: 14px;
              gap: 6px;
            }
          }
          .req-back-btn:hover {
            background-color: #DC2626;
            border-color: #DC2626;
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);
          }
          @keyframes ml-success-circle {
            0%   { stroke-dashoffset: 226; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes ml-success-check {
            0%   { stroke-dashoffset: 48; opacity: 0; }
            50%  { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 1; }
          }
          @keyframes ml-success-fill {
            0%   { opacity: 0; transform: scale(0.7); }
            60%  { opacity: 1; transform: scale(1.06); }
            100% { opacity: 1; transform: scale(1); }
          }
          .ml-success-circle {
            stroke-dasharray: 226;
            stroke-dashoffset: 226;
            animation: ml-success-circle 0.55s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
          }
          .ml-success-check {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: ml-success-check 0.4s ease-out 0.55s forwards;
          }
          .ml-success-fill {
            opacity: 0;
            transform-origin: center;
            animation: ml-success-fill 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards;
          }
        `,
      }} />

      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Custom ML Model Request"
      >
        <div className="bg-white rounded-3xl p-4 sm:p-8 w-full max-w-2xl max-h-[92vh] max-h-[92dvh] overflow-y-auto relative shadow-2xl mx-auto my-auto">
          {submitted ? (
            /* ── Success State ── */
            <div className="text-center py-10 px-2 flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-5 relative flex items-center justify-center">
                <svg className="w-20 h-20" viewBox="0 0 80 80">
                  <circle className="ml-success-fill" cx="40" cy="40" r="36" fill="#2563EB" />
                  <circle
                    className="ml-success-circle"
                    cx="40" cy="40" r="36"
                    fill="none" stroke="#2563EB" strokeWidth="4"
                  />
                  <path
                    className="ml-success-check"
                    fill="none" stroke="#ffffff"
                    strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
                    d="M24 40.5L34.5 51L56 29.5"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1.5">Request Sent!</h3>
              <p className="text-base font-medium text-gray-600 mb-1">
                Our ML team will connect with you soon.
              </p>
              <p className="text-xs text-gray-400 mb-7 max-w-xs mx-auto">
                You&apos;ll receive a confirmation on your email shortly.
              </p>
              <button
                type="button"
                onClick={() => { setOpen(false); setSubmitted(false); resetForm(); }}
                className="px-8 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-sm font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            /* ── Form State ── */
            <div className="w-full flex flex-col gap-3 sm:gap-6">
              {/* Header */}
              <div className="flex items-center sm:items-start justify-between gap-4 pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-lg sm:text-3xl font-semibold text-gray-900 leading-tight">
                    Custom ML Model Request
                  </h2>
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                    Describe the ML model you need. Our team will reach out with a custom proposal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="req-back-btn"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:gap-6">
                {/* 1. Title */}
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label htmlFor="ml-req-title" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ml-req-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder={
                      isMobile
                        ? "e.g. Churn prediction model"
                        : "e.g. Churn prediction model for SaaS customers"
                    }
                    className="ml-req-field"
                  />
                </div>

                {/* 2. Description */}
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label htmlFor="ml-req-description" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="ml-req-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={1500}
                    placeholder={
                      isMobile
                        ? "Describe your requirements, expected inputs/outputs, and data..."
                        : "Describe the problem, expected inputs/outputs, and what data you have."
                    }
                    className="ml-req-field resize-none"
                  />
                </div>

                {/* 3. Email */}
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label htmlFor="ml-req-email" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ml-req-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="ml-req-field"
                  />
                </div>

                {/* Mobile View: Toggle for secondary optional details */}
                <div className="block sm:hidden">
                  <button
                    type="button"
                    onClick={() => setShowOptionalMobile(!showOptionalMobile)}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-gray-50/90 hover:bg-gray-100 border border-gray-200 transition-all text-xs font-medium text-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[17px] text-gray-500">
                        tune
                      </span>
                      <span>
                        {showOptionalMobile
                          ? "Hide optional details"
                          : "Add more details (LinkedIn, Phone, Website, Budget)"}
                      </span>
                      {hasOptionalFilled && !showOptionalMobile && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span
                      className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 ${
                        showOptionalMobile ? "rotate-180 text-blue-600" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                </div>

                {/* Secondary optional fields: Collapsible on mobile, always visible in 2x2 grid on desktop */}
                <div
                  className={`${
                    showOptionalMobile ? "flex" : "hidden"
                  } sm:flex flex-col gap-3 sm:gap-6`}
                >
                  {/* 4. Grid for LinkedIn & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <label htmlFor="ml-req-linkedin" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                        LinkedIn <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        id="ml-req-linkedin"
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/yourprofile"
                        className="ml-req-field"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <label htmlFor="ml-req-phone" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                        Phone Number <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        id="ml-req-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="ml-req-field"
                      />
                    </div>
                  </div>

                  {/* 5. Grid for Company Website & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <label htmlFor="ml-req-website" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                        Company Website <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        id="ml-req-website"
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="ml-req-field"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <label htmlFor="ml-req-budget" className="block text-[13px] sm:text-sm font-medium text-on-surface">
                        Budget (USD) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <input
                        id="ml-req-budget"
                        type="number"
                        min="0"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder={isMobile ? "Leave empty for Open" : "Leave empty for “Open”"}
                        className="ml-req-field"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. How soon / Timeline */}
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label className="block text-[13px] sm:text-sm font-medium text-on-surface">
                    How soon do you need this? <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  {/* Mobile View: Smooth Dropdown Menu */}
                  <div className="block sm:hidden">
                    <MobileTimelineDropdown
                      value={timeline}
                      onChange={setTimeline}
                      options={TIMELINE_OPTIONS}
                      placeholder="Select timeline..."
                    />
                  </div>

                  {/* Desktop View: Preserved untouched 5-column button row */}
                  <div className="hidden sm:grid sm:grid-cols-5 gap-2 w-full">
                    {TIMELINE_OPTIONS.map((opt, idx) => {
                      const active = timeline === opt;
                      const isLast = idx === TIMELINE_OPTIONS.length - 1;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setTimeline(active ? "" : opt)}
                          style={{ borderRadius: "9999px" }}
                          className={`w-full flex items-center justify-center text-center px-2 py-2 sm:px-2 sm:py-2 text-[12px] sm:text-[13px] font-normal border transition-all cursor-pointer whitespace-nowrap ${
                            isLast ? "col-span-2 sm:col-span-1" : ""
                          } ${
                            active
                              ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                              : "bg-[#F8F9FA] border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB]"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Schedule a Call (Optional) */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                      Schedule a Call <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1">(Optional)</span>
                    </h3>
                  </div>

                  <Link
                    href="/schedule"
                    onClick={() => {
                      setWantsMeeting(true);
                      setOpen(false);
                    }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/80 transition-all shadow-sm group text-decoration-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                        📅
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          <span className="block sm:hidden">Book an Onboarding Call</span>
                          <span className="hidden sm:block">Book an Onboarding Call with the aiKart Team</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <span className="block sm:hidden">Pick a 30-min slot on our booking page</span>
                          <span className="hidden sm:block">Pick a 30-minute slot that fits your schedule on our booking page</span>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-gray-200 rounded-full px-4 sm:px-5 py-2 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                      Open Calendar
                    </span>
                  </Link>
                </div>

                {/* Error */}
                {error && (
                  <div
                    style={{ borderRadius: "16px", padding: "12px 16px" }}
                    className="bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444]"
                  >
                    {error}
                  </div>
                )}

                {/* 8. Submit Button */}
                <div className="flex justify-start pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!valid || submitting}
                    style={{
                      backgroundColor: "#2563EB",
                      borderRadius: "9999px",
                      padding: "13px 36px",
                      fontWeight: 500,
                      color: "#FFFFFF",
                    }}
                    className="w-full sm:w-auto hover:bg-[#1D4ED8] transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm active:scale-[0.99]"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">
                          progress_activity
                        </span>
                        <span>Submitting…</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
