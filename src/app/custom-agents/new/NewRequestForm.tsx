"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCustomRequest } from "@/lib/api-client/listings";

const URGENCY_OPTIONS = [
  "ASAP (1-3 days)",
  "Within a week",
  "2-4 weeks",
  "1-3 months",
  "Flexible / No rush",
];

const CATEGORIES = [
  "Customer Support",
  "Sales & Marketing",
  "Coding & Development",
  "Data Analysis",
  "Content Creation",
  "Finance & Accounting",
  "HR & Recruitment",
  "Operations & Automation",
  "Research & Intelligence",
  "Other",
];

function CustomCategorySelect({
  value,
  onChange,
  options,
  placeholder = "Select a category…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          borderRadius: "12px",
          border: open ? "1px solid #2563EB" : "1px solid #D1D5DB",
          backgroundColor: "#FFFFFF",
          padding: "10px 16px",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
        }}
        className="w-full flex items-center justify-between text-left cursor-pointer text-sm font-normal transition-all duration-200 ease-in-out hover:border-[#2563EB]"
      >
        <span className={value ? "text-[#111827]" : "text-[#9CA3AF]"}>
          {value || placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-lg text-[#6B7280] transition-transform duration-150 ${
            open ? "rotate-180 text-[#2563EB]" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          style={{
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            padding: "8px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
          }}
          className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-[#E5E7EB] overflow-hidden"
        >
          <div className="category-dropdown-scroll flex flex-col gap-[2px] pr-1">
            {options.map((cat) => {
              const isSelected = cat === value;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onChange(cat);
                    setOpen(false);
                  }}
                  style={{
                    borderRadius: "12px",
                    padding: "10px 12px",
                  }}
                  className={`w-full text-left text-sm font-normal transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#111827] hover:bg-[#F8F9FA] hover:text-[#2563EB]"
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-base text-[#2563EB]">
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

export default function NewRequestForm({
  onSuccess,
  onClose,
  isModal = false,
}: {
  /** When rendered inside a modal, called with the new listing id instead of
   * the default router.push — lets the caller close the modal itself. */
  onSuccess?: (listingId: string) => void;
  /** When rendered inside a modal, called by the header's Back/Close action
   * instead of navigating to /custom-agents. */
  onClose?: () => void;
  /** True when inside a dialog popup */
  isModal?: boolean;
} = {}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [otherCategory, setOtherCategory] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [wantsMeeting, setWantsMeeting] = useState(false);
  const [urgency, setUrgency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    category.length > 0 &&
    description.trim().length > 0 &&
    email.trim().length > 0;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await createCustomRequest({
      title,
      category: category === "Other" && otherCategory.trim() ? otherCategory.trim() : category,
      description,
      budget,
      email,
      linkedin,
      phone,
      companyWebsite,
      wantsMeeting,
      urgency,
    });
    if (res.error || !res.listingId) {
      setError(res.error || "Failed to create request");
      setSubmitting(false);
      return;
    }
    if (onSuccess) {
      onSuccess(res.listingId);
    } else {
      router.push(`/custom-agents/${res.listingId}`);
    }
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .req-field {
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
          .req-field {
            border-radius: 12px;
            padding: 10px 16px;
            font-size: 14px;
          }
        }
        .req-field::placeholder {
          color: #9CA3AF;
        }
        .req-field:focus {
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
        .category-dropdown-scroll {
          max-height: 210px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .category-dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .category-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .category-dropdown-scroll::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 9999px;
        }
        .category-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `,
        }}
      />

      <div className={`w-full mx-auto flex flex-col gap-3 sm:gap-6 ${isModal ? "max-w-full" : "max-w-[720px]"}`}>
        <div className="flex items-center sm:items-start justify-between gap-3 sm:gap-4 pb-2 border-b border-gray-100">
          <div className="pr-1">
            <h1 className="text-lg sm:text-3xl font-semibold text-gray-900 leading-tight">
              Post a Custom Agent Request
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
              Describe the AI agent you need. Builders will see your request and can send you a proposal. You stay anonymous.
            </p>
          </div>
          {onClose ? (
            <button type="button" onClick={onClose} className="req-back-btn">
              Close
            </button>
          ) : (
            <Link href="/custom-agents" className="req-back-btn">
              Back
            </Link>
          )}
        </div>

        <div className={`flex flex-col gap-3 sm:gap-6 ${isModal ? "" : "bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-8 shadow-sm"}`}>
          {/* Title */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label htmlFor="req-title" className="block text-[13px] sm:text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="req-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder={
                isMobile
                  ? "e.g. AI contract review agent"
                  : "e.g. AI agent to summarise legal contracts"
              }
              className="req-field"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="block text-[13px] sm:text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <CustomCategorySelect
              value={category}
              onChange={setCategory}
              options={CATEGORIES}
              placeholder="Select a category…"
            />
            {category === "Other" && (
              <input
                type="text"
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="Please specify the category"
                className="req-field"
              />
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label htmlFor="req-desc" className="block text-[13px] sm:text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="req-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                isMobile
                  ? "Describe what the agent should do and key requirements..."
                  : "Describe what the agent should do, the inputs/outputs, any integrations, and how you'd measure success."
              }
              className="req-field resize-none"
            />
          </div>

          {/* Email * (Required) */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label htmlFor="req-email" className="block text-[13px] sm:text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="req-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="req-field"
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
            {/* Grid for LinkedIn & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* LinkedIn (Optional) */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label htmlFor="req-linkedin" className="block text-[13px] sm:text-sm font-medium text-gray-700">
                  LinkedIn <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  id="req-linkedin"
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/yourprofile"
                  className="req-field"
                />
              </div>

              {/* Phone Number (Optional) */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label htmlFor="req-phone" className="block text-[13px] sm:text-sm font-medium text-gray-700">
                  Phone Number <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="req-field"
                />
              </div>
            </div>

            {/* Grid for Company Website & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Company Website (Optional) */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label htmlFor="req-website" className="block text-[13px] sm:text-sm font-medium text-gray-700">
                  Company Website <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  id="req-website"
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="req-field"
                />
              </div>

              {/* Budget */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label htmlFor="req-budget" className="block text-[13px] sm:text-sm font-medium text-gray-700">
                  Budget (USD) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  id="req-budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder={isMobile ? "Leave empty for Open" : "Leave empty for “Open”"}
                  className="req-field"
                />
              </div>
            </div>
          </div>

          {/* Urgency / Timeline (Optional) */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <label className="block text-[13px] sm:text-sm font-medium text-gray-700">
              How soon do you need this? <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            {/* Mobile View: Smooth Dropdown Menu */}
            <div className="block sm:hidden">
              <MobileTimelineDropdown
                value={urgency}
                onChange={setUrgency}
                options={URGENCY_OPTIONS}
                placeholder="Select timeline..."
              />
            </div>

            {/* Desktop View: Preserved untouched 5-column button row */}
            <div className="hidden sm:grid sm:grid-cols-5 gap-2 w-full">
              {URGENCY_OPTIONS.map((opt, idx) => {
                const active = urgency === opt;
                const isLast = idx === URGENCY_OPTIONS.length - 1;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setUrgency(active ? "" : opt)}
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

          {/* Schedule a Call (Optional) */}
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
                if (onClose) onClose();
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

          {error && (
            <div
              style={{ borderRadius: "16px", padding: "12px 16px" }}
              className="bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444]"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={submit}
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
                  <span>Posting…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Post Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
