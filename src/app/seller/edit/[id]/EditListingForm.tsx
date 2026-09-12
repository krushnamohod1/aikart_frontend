"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateListing, updateListingSecrets, type ListingEditDraft } from "@/lib/api-client/listings";

const CATEGORIES = [
  "Customer Support", "Sales & Marketing", "Coding & Development", "Data Analysis",
  "Content Creation", "Finance & Accounting", "HR & Recruitment",
  "Operations & Automation", "Research & Intelligence", "Other",
];
const LISTING_TYPES = ["AI Agent", "AI Service", "AI Tool"];
const PRICING_MODELS = ["Free", "Freemium", "Paid"];

export type EditListingData = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  listing_type: string;
  description: string;
  use_case: string;
  technologies: string[];
  key_capabilities: string[];
  pricing_model: string;
  price: string;
  website_url: string;
  status: string;
};

type DeclaredSecret = { name: string; description?: string; required: boolean };

function CustomDropdown({
  label,
  required = false,
  value,
  options,
  placeholder = "Select...",
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedText = value || "";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="edit-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`edit-dropdown-trigger ${isOpen ? "is-open" : ""}`}
      >
        <span className={selectedText ? "text-[#0f172a] font-medium" : "text-[#94a3b8]"}>
          {selectedText || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-[#64748b] transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="edit-dropdown-menu">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`edit-dropdown-item ${isSelected ? "is-selected" : ""}`}
              >
                <span>{opt}</span>
                {isSelected && (
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EditListingForm({
  listing,
  declaredSecrets = [],
  secretsAlreadySet = [],
}: {
  listing: EditListingData;
  declaredSecrets?: DeclaredSecret[];
  secretsAlreadySet?: string[];
}) {
  const router = useRouter();
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(listing.title);
  const [tagline, setTagline] = useState(listing.tagline ?? "");
  const [category, setCategory] = useState(listing.category);
  const [listingType, setListingType] = useState(listing.listing_type);
  const [description, setDescription] = useState(listing.description ?? "");
  const [useCase, setUseCase] = useState(listing.use_case ?? "");
  const [technologies, setTechnologies] = useState<string[]>(listing.technologies ?? []);
  const [keyCapabilities, setKeyCapabilities] = useState<string[]>(listing.key_capabilities ?? []);
  const [pricingModel, setPricingModel] = useState(listing.pricing_model);
  const [price, setPrice] = useState(listing.price ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(listing.website_url ?? "");
  const [techInput, setTechInput] = useState("");
  const [capInput, setCapInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim() && category && listingType && pricingModel;

  function addTag(list: string[], setList: (v: string[]) => void, value: string, clear: () => void) {
    const v = value.trim();
    if (v && !list.includes(v)) setList([...list, v]);
    clear();
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const draft: ListingEditDraft = {
      title, tagline, category, listingType, description, useCase,
      technologies, keyCapabilities, pricingModel,
      price: pricingModel === "Paid" ? price : "",
      websiteUrl,
    };
    const res = await updateListing(listing.id, draft);
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    if (declaredSecrets.length > 0 && Object.values(secretValues).some((v) => v.trim())) {
      const secretsRes = await updateListingSecrets(listing.id, secretValues);
      if (secretsRes.error) {
        setError(secretsRes.error);
        setSaving(false);
        return;
      }
    }
    router.push("/seller/status");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .edit-form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
        }
        @media (max-width: 640px) {
          .edit-form-card {
            padding: 20px 16px;
            border-radius: 20px;
          }
        }
        .edit-label {
          display: block;
          font-family: var(--font-poppins), 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .edit-input {
          width: 100%;
          height: 46px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .edit-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }
        .edit-input::placeholder {
          color: #94a3b8;
        }
        .edit-textarea {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #0f172a;
          outline: none;
          resize: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .edit-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }
        .edit-textarea::placeholder {
          color: #94a3b8;
        }

        /* ── Custom Dropdown ── */
        .edit-dropdown-trigger {
          width: 100%;
          height: 46px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
          outline: none;
        }
        .edit-dropdown-trigger:hover {
          border-color: #cbd5e1;
          background: #fbfcfe;
        }
        .edit-dropdown-trigger.is-open {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }
        .edit-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 60;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04);
          padding: 6px;
          max-height: 240px;
          overflow-y: auto;
          animation: editDropdownFade 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .edit-dropdown-menu::-webkit-scrollbar {
          width: 5px;
        }
        .edit-dropdown-menu::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
        @keyframes editDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .edit-dropdown-item {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          border: none;
          text-align: left;
          transition: all 0.15s ease;
        }
        .edit-dropdown-item:hover {
          background: #eff6ff;
          color: #2563eb;
        }
        .edit-dropdown-item.is-selected {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }

        .edit-tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          font-size: 13px;
          font-weight: 500;
        }
        .edit-tag-close {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1e40af;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .edit-tag-close:hover {
          background: #ef4444;
          color: #ffffff;
        }
        .edit-add-btn {
          height: 46px;
          padding: 0 20px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #334155;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .edit-add-btn:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
        }
        .edit-submit-btn {
          height: 40px;
          padding: 0 26px;
          border-radius: 9999px !important;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4fd0 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }
        .edit-submit-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          opacity: 0.75;
          transform: none !important;
        }
        .edit-submit-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
        }
        .edit-cancel-btn {
          height: 40px;
          padding: 0 24px;
          border-radius: 9999px !important;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .edit-cancel-btn:hover {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.28);
        }
        .edit-eyebrow {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: inline-block;
          background: linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%);
          background-size: 200% 100%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: editGradientShift 6s linear infinite;
        }
        @keyframes editGradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .edit-title {
          font-family: var(--font-red-hat), 'Red Hat Display', sans-serif;
          font-size: 32px;
          font-weight: 500;
          color: #0f172a;
          line-height: 1.2;
          margin: 0;
        }
        @media (max-width: 640px) {
          .edit-eyebrow {
            font-size: 12px;
          }
          .edit-title {
            font-size: 26px;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="edit-eyebrow">
            MANAGE LISTING
          </p>
          <h1 className="edit-title">
            Edit AI Solution
          </h1>
          <p className="text-[#64748b] mt-1.5 text-[14.5px] font-normal">
            {listing.status === "approved"
              ? "This listing is live changes will reflect immediately upon saving."
              : listing.status === "rejected"
              ? "Saving changes will resubmit this listing for review."
              : "Update and manage your solution details below."}
          </p>
        </div>
        <Link href="/seller/status" style={{ borderRadius: "9999px" }} className="edit-cancel-btn shrink-0">
          Back
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="edit-form-card space-y-7">
        {/* Title */}
        <div>
          <label className="edit-label">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. AI Support Assistant"
            className="edit-input"
          />
        </div>

        {/* Tagline */}
        <div>
          <label className="edit-label">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={120}
            placeholder="A short, catchy summary of your AI solution"
            className="edit-input"
          />
        </div>

        {/* Category & Type */}
        <div className="grid md:grid-cols-2 gap-5">
          <CustomDropdown
            label="Category"
            required
            value={category}
            options={CATEGORIES}
            placeholder="Select category..."
            onChange={(val) => setCategory(val)}
          />

          <CustomDropdown
            label="Listing Type"
            required
            value={listingType}
            options={LISTING_TYPES}
            placeholder="Select type..."
            onChange={(val) => setListingType(val)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="edit-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide a comprehensive explanation of how your product works..."
            className="edit-textarea"
          />
        </div>

        {/* Use Case */}
        <div>
          <label className="edit-label">Primary Use Case</label>
          <input
            type="text"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="e.g. Automating 24/7 customer inquiries with CRM integration"
            className="edit-input"
          />
        </div>

        {/* Technologies */}
        <div>
          <label className="edit-label">Technologies &amp; Frameworks</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(technologies, setTechnologies, techInput, () => setTechInput(""));
                }
              }}
              placeholder="e.g. Next.js, LangChain, OpenAI (Press Enter to add)"
              className="edit-input"
            />
            <button
              type="button"
              onClick={() => addTag(technologies, setTechnologies, techInput, () => setTechInput(""))}
              className="edit-add-btn"
            >
              + Add
            </button>
          </div>
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {technologies.map((t) => (
                <span key={t} className="edit-tag-pill">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTechnologies(technologies.filter((x) => x !== t))}
                    className="edit-tag-close"
                    title={`Remove ${t}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Key Capabilities */}
        <div>
          <label className="edit-label">Key Capabilities</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(keyCapabilities, setKeyCapabilities, capInput, () => setCapInput(""));
                }
              }}
              placeholder="e.g. Multi-turn reasoning, Automated lead routing"
              className="edit-input"
            />
            <button
              type="button"
              onClick={() => addTag(keyCapabilities, setKeyCapabilities, capInput, () => setCapInput(""))}
              className="edit-add-btn"
            >
              + Add
            </button>
          </div>
          {keyCapabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {keyCapabilities.map((c) => (
                <span key={c} className="edit-tag-pill">
                  {c}
                  <button
                    type="button"
                    onClick={() => setKeyCapabilities(keyCapabilities.filter((x) => x !== c))}
                    className="edit-tag-close"
                    title={`Remove ${c}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Model & Price */}
        <div className="grid md:grid-cols-2 gap-5">
          <CustomDropdown
            label="Pricing Model"
            required
            value={pricingModel}
            options={PRICING_MODELS}
            placeholder="Select pricing model..."
            onChange={(val) => setPricingModel(val)}
          />

          {pricingModel === "Paid" && (
            <div>
              <label className="edit-label">Price (USD)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder='Leave blank for "Contact for pricing"'
                className="edit-input"
              />
            </div>
          )}
        </div>

        {/* Website URL */}
        <div>
          <label className="edit-label">Website URL</label>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourproduct.com"
            className="edit-input"
          />
        </div>

        {/* Declared Secrets / API Keys Section */}
        {declaredSecrets.length > 0 && (
          <div className="my-8 p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-5">
            <div>
              <label className="edit-label flex items-center gap-2 mb-1.5 text-base">
                <span className="text-blue-600">🔑</span> API Keys / Environment Variables
              </label>
              <p className="text-xs text-[#64748b]">
                Your manifest declares these keys. Leave a field blank to keep its existing configured value.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {declaredSecrets.map((s) => {
                const sName = s.name.toUpperCase();
                const isEmailKey =
                  sName.includes("EMAIL") ||
                  sName.includes("MAIL") ||
                  sName === "MY_EMAIL" ||
                  sName === "EMAIL_PASSWORD" ||
                  sName === "EMAIL_PASS";

                if (isEmailKey) {
                  return (
                    <div key={s.name} className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-xs text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                            {s.name}
                          </span>
                          {s.required && <span className="text-xs font-bold text-red-500">*</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3 font-medium leading-snug">
                        <span className="material-symbols-outlined text-base text-blue-600 shrink-0">lock</span>
                        <span>AiKart wont show your sandbox as email is needed due to our Terms and Condition</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={s.name} className="p-4 rounded-xl bg-white border border-[#e2e8f0] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                          {s.name}
                        </span>
                        {s.required && <span className="text-xs font-bold text-red-500">*</span>}
                      </div>

                      {secretsAlreadySet.includes(s.name) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          ✓ Configured
                        </span>
                      ) : (
                        s.required && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Required, not set
                          </span>
                        )
                      )}
                    </div>

                    {s.description && (
                      <p className="text-xs text-[#64748b] mb-2.5 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    <input
                      type="password"
                      autoComplete="off"
                      value={secretValues[s.name] ?? ""}
                      onChange={(e) => setSecretValues((prev) => ({ ...prev, [s.name]: e.target.value }))}
                      placeholder={
                        secretsAlreadySet.includes(s.name)
                          ? "Leave blank to keep current value..."
                          : `Enter your ${s.name} value...`
                      }
                      className="edit-input"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Informational Callout */}
        <div className="my-7 flex items-start gap-3 bg-[#eff6ff] border border-[#bfdbfe] p-4 rounded-xl">
          <span className="text-blue-600 text-base mt-0.5">ℹ️</span>
          <p className="text-xs text-[#1e40af] font-medium leading-relaxed">
            Note: Media assets (photos, promo video, and brochures) stay as originally uploaded and cannot be replaced in this quick editor.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-[#f1f5f9]">
          <Link href="/seller/status" style={{ borderRadius: "9999px" }} className="edit-cancel-btn">
            Cancel
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={!valid || saving}
            style={{ borderRadius: "9999px" }}
            className="edit-submit-btn"
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
