"use client";
/* eslint-disable @next/next/no-img-element */

import { useListingForm } from "../context";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitListing } from "@/lib/api-client/listings";
import { getUploadUrl } from "@/lib/api-client/storage";
import { API_BASE } from "@/lib/api-client/config";
import { ManifestPreviewSection } from "../ManifestPreviewSection";
import { ApiEndpointSection } from "../ApiEndpointSection";

/** Parses a raw-JSON wizard field. Invalid JSON becomes undefined so the
 *  server-side validator reports it rather than the client silently guessing. */
function safeJson(raw: string): Record<string, unknown> | undefined {
  if (!raw || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

// ── Configuration Constants ──
const COUNTRIES = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Russian",
  "Italian",
  "Korean",
];

const CATEGORIES = [
  "Coding & Development",
  "Customer Support",
  "Sales & Marketing",
  "Data Analysis",
  "Content Creation",
  "Finance & Accounting",
  "HR & Recruitment",
  "Operations & Automation",
  "Research & Intelligence",
  "Healthcare & Life Sciences",
  "Legal & Compliance",
  "Design & Media",
];

const INDUSTRY_VERTICALS = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "E-commerce & Retail",
  "Education & EdTech",
  "Real Estate",
  "Legal & Compliance",
  "Media & Entertainment",
  "Manufacturing",
  "Logistics & Supply Chain",
  "Sports & Gaming",
  "Other",
];

const INDIVIDUAL_TEAM_SIZES = ["Solo", "2-5", "5-10"];
const ENTERPRISE_TEAM_SIZES = ["11-50", "51-200", "201+"];

const PRICING_MODELS = [
  { value: "Free", label: "Free" },
  { value: "Freemium", label: "Freemium" },
  { value: "Paid", label: "Paid" },
  { value: "Custom", label: "Custom" },
];

const CURRENCIES = [
  { value: "USD", label: "USD US Dollar", name: "USD US Dollar", symbol: "$" },
  { value: "INR", label: "INR Indian Rupee", name: "INR Indian Rupee", symbol: "₹" },
  { value: "EUR", label: "EUR Euro", name: "EUR Euro", symbol: "€" },
  { value: "GBP", label: "GBP British Pound", name: "GBP British Pound", symbol: "£" },
  { value: "CAD", label: "CAD Canadian Dollar", name: "CAD Canadian Dollar", symbol: "CA$" },
  { value: "AUD", label: "AUD Australian Dollar", name: "AUD Australian Dollar", symbol: "A$" },
  { value: "SGD", label: "SGD Singapore Dollar", name: "SGD Singapore Dollar", symbol: "S$" },
  { value: "AED", label: "AED UAE Dirham", name: "AED UAE Dirham", symbol: "AED" },
  { value: "JPY", label: "JPY Japanese Yen", name: "JPY Japanese Yen", symbol: "¥" },
];

const PAYOUT_FREQUENCIES = ["Monthly", "Weekly"];

type FileStatus = "idle" | "uploading" | "done" | "error";
type Phase = "idle" | "uploading" | "saving" | "done";
interface UploadTask {
  key: string;
  label: string;
  file: File;
  status: FileStatus;
  progress: number;
  url?: string;
}

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ─── N8n Sandbox Section ─────────────────────────────────────────────────────
// Self-contained sub-component so its useState hooks are scoped and don't
// pollute the 400-line ListingFormPage hook list.
function N8nFieldTypeDropdown({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "textarea", label: "Textarea" },
  ];
  const currentLabel = options.find((o) => o.value === value)?.label ?? "Text";

  return (
    <div className={`relative inline-block ${className ?? ""}`} style={{ width: 130, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lf-select w-full flex items-center justify-between text-left"
        style={{ fontSize: 13.5, height: 42, padding: "8px 14px", borderRadius: 14, backgroundImage: "none" }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className={`lf-dd-chevron ${open ? "lf-dd-chevron-open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ color: "#64748b", transition: "transform 0.2s ease", flexShrink: 0, marginLeft: "4px" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-full min-w-[130px] bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                  value === o.value
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{o.label}</span>
                {value === o.value && (
                  <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function N8nSandboxSection() {
  const { formData, updateField } = useListingForm();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Auto-generate a secret on first enable
  const handleEnable = (enabled: boolean) => {
    updateField("n8nEnabled", enabled);
    if (enabled && !formData.n8nWebhookSecret) {
      // Use crypto.randomUUID + timestamp for entropy; seller can override if needed
      const secret = `akt_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, "")}`;
      updateField("n8nWebhookSecret", secret);
    }
  };

  const addField = () => {
    if (formData.n8nInputSchema.length >= 10) return;
    updateField("n8nInputSchema", [
      ...formData.n8nInputSchema,
      { name: "", label: "", type: "text" },
    ]);
  };

  const removeField = (i: number) => {
    updateField("n8nInputSchema", formData.n8nInputSchema.filter((_, idx) => idx !== i));
  };

  const updateFieldSchema = (i: number, key: string, value: string) => {
    const updated = formData.n8nInputSchema.map((f, idx) =>
      idx === i ? { ...f, [key]: value } : f
    );
    updateField("n8nInputSchema", updated);
  };

  const testConnection = async () => {
    setTestStatus("testing");
    setTestError(null);
    setTestLatency(null);
    try {
      const res = await fetch(`${API_BASE}/api/n8n/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ webhookUrl: formData.n8nWebhookUrl, secret: formData.n8nWebhookSecret }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
        setTestLatency(data.latencyMs);
      } else {
        setTestStatus("error");
        setTestError(data.error ?? "Connection failed.");
      }
    } catch {
      setTestStatus("error");
      setTestError("Network error — check your connection and try again.");
    }
  };

  return (
    <div className="lf-textcard">
      <style>{`
        @media (max-width: 768px) {
          .lf-n8n-field-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .lf-n8n-name,
          .lf-n8n-label,
          .lf-n8n-type,
          .lf-n8n-type > button {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            flex: none !important;
          }
        }
      `}</style>
      <div>
        <h3 className="lf-heading" style={{ fontSize: 18 }}>
          n8n Automation Try Me Now
          <span className="lf-tag">(Optional)</span>
        </h3>
        <p className="lf-desc">
          Allow buyers to trial your n8n workflow live. Your webhook URL remains completely private.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="lf-toggle-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => handleEnable(true)}
          className={`lf-toggle ${formData.n8nEnabled ? "is-active" : ""}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleEnable(false)}
          className={`lf-toggle ${!formData.n8nEnabled ? "is-active" : ""}`}
        >
          No
        </button>
      </div>

      {formData.n8nEnabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>

          {/* Webhook URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
              Webhook URL <span className="text-red-500 ml-0.5">*</span>
            </label>
            <p className="lf-desc" style={{ fontSize: "12px", margin: "0 0 2px" }}>
              Public HTTPS Production URL from your n8n Webhook node.
            </p>
            <input
              type="url"
              value={formData.n8nWebhookUrl}
              onChange={(e) => updateField("n8nWebhookUrl", e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/abc123"
              className="lf-input"
            />
          </div>

          {/* Auto-generated secret */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
              Webhook Secret
            </label>
            <p className="lf-desc" style={{ fontSize: "12px", margin: "0 0 2px" }}>
              Sent in the <code style={{ fontFamily: "monospace", color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: 6 }}>X-Aikart-Secret</code> header to verify requests originate from aiKart.
            </p>
            <div className="lf-secret-row">
              <input
                type="text"
                value={formData.n8nWebhookSecret}
                onChange={(e) => updateField("n8nWebhookSecret", e.target.value)}
                className="lf-input lf-secret-input"
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  letterSpacing: "-0.2px",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(formData.n8nWebhookSecret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="lf-pillbtn shrink-0"
                style={{ height: "46px" }}
              >
                {copiedSecret ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Input schema builder */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                Input Fields <span className="lf-tag" style={{ fontWeight: 400 }}>(max 10)</span>
              </label>
              {formData.n8nInputSchema.length === 0 && (
                <p className="lf-desc" style={{ fontSize: "12.5px", marginTop: 4 }}>
                  No fields configured yet. Click "+ Add Field" to define buyer inputs.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {formData.n8nInputSchema.map((f, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 14,
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div className="lf-n8n-field-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => updateFieldSchema(i, "name", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                      placeholder="field_name"
                      className="lf-input lf-n8n-name"
                      style={{ width: "160px", fontFamily: "monospace", fontSize: 13, height: "42px", padding: "8px 14px", borderRadius: "14px" }}
                    />
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => updateFieldSchema(i, "label", e.target.value)}
                      placeholder="Display Label"
                      className="lf-input lf-n8n-label"
                      style={{ flex: "1 1 200px", fontSize: 13.5, height: "42px", padding: "8px 14px", borderRadius: "14px" }}
                    />
                    <N8nFieldTypeDropdown
                      value={f.type}
                      className="lf-n8n-type"
                      onChange={(val) => updateFieldSchema(i, "type", val)}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "100%" }}>
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      style={{
                        fontFamily: "var(--font-poppins),'Poppins',sans-serif",
                        fontSize: 12.5,
                        fontWeight: 500,
                        padding: "6px 14px",
                        borderRadius: 999,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {formData.n8nInputSchema.length < 10 && (
              <button
                type="button"
                onClick={addField}
                className="lf-pillbtn"
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              >
                + Add Field
              </button>
            )}
          </div>

          {/* Output format */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
              Output Format
            </label>
            <p className="lf-desc" style={{ fontSize: "12px", margin: "0 0 2px" }}>
              Select how your n8n workflow output is rendered for buyers.
            </p>
            <div className="lf-chip-group">
              {(["text", "markdown", "json"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => updateField("n8nOutputFormat", fmt)}
                  className={`lf-chip ${formData.n8nOutputFormat === fmt ? "is-active" : ""}`}
                  style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Test connection */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={testConnection}
              disabled={!formData.n8nWebhookUrl || testStatus === "testing"}
              className="lf-submit-btn"
              style={{
                height: "40px",
                padding: "0 22px",
                fontSize: "13.5px",
                cursor: !formData.n8nWebhookUrl || testStatus === "testing" ? "not-allowed" : "pointer"
              }}
            >
              {testStatus === "testing" ? "Testing…" : "Test Connection"}
            </button>
            {testStatus === "ok" && (
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                ✓ Connected{testLatency !== null ? ` (${testLatency}ms)` : ""}
              </span>
            )}
            {testStatus === "error" && (
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
                ✗ {testError}
              </span>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function ListingFormPage() {
  const { formData, updateField } = useListingForm();
  const router = useRouter();

  const [fileError, setFileError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const modalAgreed = agreeTerms && agreePrivacy;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successListingId, setSuccessListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!showSuccessModal || !successListingId) return;
    const timer = setTimeout(() => {
      router.push(`/seller/status?id=${successListingId}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showSuccessModal, successListingId, router]);

  // Section expansion toggles
  const [openAbout, setOpenAbout] = useState(false);
  const [openProblem, setOpenProblem] = useState(false);
  const [openHowItHelps, setOpenHowItHelps] = useState(false);

  // Individual vs Enterprise is a single choice — picking one hides the other's
  // size options. Derive the initial choice from any team size already saved
  // in the draft so returning to this step doesn't lose the selection.
  const [teamType, setTeamType] = useState<"individual" | "enterprise" | null>(() => {
    if (INDIVIDUAL_TEAM_SIZES.includes(formData.teamSize)) return "individual";
    if (ENTERPRISE_TEAM_SIZES.includes(formData.teamSize)) return "enterprise";
    return null;
  });

  const selectTeamType = (type: "individual" | "enterprise") => {
    if (teamType !== type) {
      updateField("teamSize", "");
    }
    setTeamType(type);
    clearError("teamSize");
  };

  // Video section works the same way — Tutorial Video (required) vs
  // Promotional Video (optional) is a single choice, one panel at a time.
  const [videoType, setVideoType] = useState<"tutorial" | "promotional">(() => {
    if (!formData.videoPreview && formData.promoVideoPreview) return "promotional";
    return "tutorial";
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  // Which interactive-testing method tab is showing (API / Sandbox / n8n) —
  // none pre-selected unless the seller already configured one in a saved draft.
  const [testTab, setTestTab] = useState<"api" | "sandbox" | "n8n" | null>(() => {
    if (formData.apiEnabled) return "api";
    if (formData.tryMeEnabled) return "sandbox";
    if (formData.n8nEnabled) return "n8n";
    return null;
  });

  const clearError = (fieldKey: string) => {
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const renderFieldError = (fieldKey: string) => {
    if (!errors[fieldKey]) return null;
    return (
      <p className="text-red-500 text-xs mt-1" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
        {errors[fieldKey]}
      </p>
    );
  };

  // Contact state
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Country & Language dropdown states
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Currency dropdown state
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  // Category and Industry mobile dropdown states
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");

  // Product category pill selection state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (formData.category) {
      const parts = formData.category.split(",").map((c) => c.trim()).filter(Boolean);
      return parts.length > 0 ? parts : ["Coding & Development"];
    }
    return ["Coding & Development"];
  });

  const toggleCategory = (cat: string) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(updated);
    updateField("category", updated.join(", "));
  };

  const countryRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const industryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setIsCountryOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setIsCatOpen(false);
        setCatSearch("");
      }
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setIsIndustryOpen(false);
        setIndustrySearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase().trim())
  );

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.label.toLowerCase().includes(currencySearch.toLowerCase().trim()) ||
      c.value.toLowerCase().includes(currencySearch.toLowerCase().trim()) ||
      c.symbol.toLowerCase().includes(currencySearch.toLowerCase().trim())
  );

  const filteredCategories = CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(catSearch.toLowerCase().trim())
  );

  const filteredIndustries = INDUSTRY_VERTICALS.filter((ind) =>
    ind.toLowerCase().includes(industrySearch.toLowerCase().trim())
  );

  const currentCurrency =
    CURRENCIES.find((c) => c.value === formData.payoutCurrency) || CURRENCIES[0];

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const promoVideoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const yamlInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const updateTask = useCallback((key: string, updates: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.key === key ? { ...t, ...updates } : t)));
  }, []);

  // ── File Handlers ──
  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFileError("Logo must be less than 2MB.");
      return;
    }
    updateField("logoFile", file);
    updateField("logoPreview", URL.createObjectURL(file));
  };

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Cover image must be less than 5MB.");
      return;
    }
    updateField("coverFile", file);
    updateField("coverPreview", URL.createObjectURL(file));
  };
  const clearCover = () => {
    updateField("coverFile", null);
    updateField("coverPreview", "");
  };

  const MAX_VIDEO_BYTES = 250 * 1024 * 1024; // 250MB

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setFileError("Video file size must not exceed 250 MB");
      return;
    }
    updateField("videoFile", file);
    updateField("videoPreview", URL.createObjectURL(file));
    updateField("videoName", file.name);
    clearError("video");
  };
  const clearVideo = () => {
    updateField("videoFile", null);
    updateField("videoPreview", "");
    updateField("videoName", "");
  };

  const handlePromoVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setFileError("Video file size must not exceed 250 MB");
      return;
    }
    updateField("promoVideoFile", file);
    updateField("promoVideoPreview", URL.createObjectURL(file));
    updateField("promoVideoName", file.name);
  };
  const clearPromoVideo = () => {
    updateField("promoVideoFile", null);
    updateField("promoVideoPreview", "");
    updateField("promoVideoName", "");
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setFileError("Each photo must be less than 5MB.");
      if (e.target) e.target.value = "";
      return;
    }

    const newFiles = [...formData.screenshotFiles];
    const newPreviews = [...formData.screenshotPreviews];

    let fileIdx = 0;
    for (let i = 0; i < 5 && fileIdx < files.length; i++) {
      if (!newFiles[i]) {
        newFiles[i] = files[fileIdx];
        newPreviews[i] = URL.createObjectURL(files[fileIdx]);
        fileIdx++;
      }
    }

    if (fileIdx < files.length) {
      setFileError("Maximum 5 photos allowed. Remaining photos were not added.");
    }

    updateField("screenshotFiles", newFiles);
    updateField("screenshotPreviews", newPreviews);
    if (e.target) e.target.value = "";
  };

  const removeScreenshot = (index: number) => {
    const newFiles = [...formData.screenshotFiles];
    const newPreviews = [...formData.screenshotPreviews];
    newFiles[index] = null;
    newPreviews[index] = "";
    updateField("screenshotFiles", newFiles);
    updateField("screenshotPreviews", newPreviews);
  };

  const handlePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileError("PDF must be less than 10MB.");
      return;
    }
    updateField("pdfFile", file);
    updateField("pdfName", file.name);
  };
  const clearPdf = () => {
    updateField("pdfFile", null);
    updateField("pdfName", "");
  };

  const handleYaml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    updateField("yamlFile", file);
    updateField("yamlName", file.name);
    updateField("yamlSecrets", []);
    updateField("secretValues", {});
    updateField("secretProviders", {});
    updateField("yamlValid", null); // "checking…"
    updateField("yamlError", null);
    // Validate right away — the sandbox enforces this exact same check when a
    // buyer actually tries to run the agent, so a seller finds out here,
    // immediately, instead of only discovering it after approval when "Try
    // Me Now" quietly shows "Coming Soon" with no explanation why.
    try {
      const text = await file.text();
      const { parseManifest } = await import("@/lib/sandbox-manifest");
      const result = parseManifest(text);
      if (result.ok) {
        updateField("yamlValid", true);
        updateField("yamlSecrets", result.manifest.secrets);
      } else {
        updateField("yamlValid", false);
        updateField("yamlError", result.error);
      }
    } catch {
      updateField("yamlValid", false);
      updateField("yamlError", "Couldn't read this file make sure it's a plain-text .yaml/.yml file.");
    }
  };
  const clearYaml = () => {
    updateField("yamlFile", null);
    updateField("yamlName", "");
    updateField("yamlSecrets", []);
    updateField("secretValues", {});
    updateField("secretProviders", {});
    updateField("yamlValid", null);
    updateField("yamlError", null);
  };

  // ── Industry Handlers ──

  const toggleIndustry = (ind: string) => {
    const current = formData.targetIndustries || [];
    if (current.includes(ind)) {
      updateField(
        "targetIndustries",
        current.filter((x) => x !== ind)
      );
    } else {
      updateField("targetIndustries", [...current, ind]);
    }
  };

  // ── Submission ──
  const isSubmitting = phase === "uploading" || phase === "saving" || phase === "done";
  const totalTasks = tasks.length;

  const validatePhase1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "This field is required";
    }
    if (!formData.tagline.trim()) {
      newErrors.tagline = "This field is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "This field is required";
      setOpenAbout(true);
    }
    if (!formData.problemSolved.trim()) {
      newErrors.problemSolved = "This field is required";
      setOpenProblem(true);
    }
    if (!formData.howItHelps.trim()) {
      newErrors.howItHelps = "This field is required";
      setOpenHowItHelps(true);
    }
    if (selectedCategories.length === 0 && (!formData.category || !formData.category.trim())) {
      newErrors.category = "This field is required";
    }
    if (!formData.targetIndustries || formData.targetIndustries.length === 0) {
      newErrors.targetIndustries = "This field is required";
    }
    if (!formData.teamSize) {
      newErrors.teamSize = "This field is required";
    }
    if (!formData.pricingModel) {
      newErrors.pricingModel = "This field is required";
    } else if (
      (formData.pricingModel === "Paid" || formData.pricingModel === "Freemium") &&
      !formData.price?.toString().trim()
    ) {
      newErrors.price = "This field is required";
    } else if (
      (formData.pricingModel === "Custom" || formData.pricingModel === "Custom Quote") &&
      !formData.pricingDetails.trim()
    ) {
      newErrors.pricingDetails = "This field is required";
    }
    if (!formData.videoFile && !formData.videoPreview) {
      newErrors.video = "Tutorial video is required";
      setVideoType("tutorial");
    } else if (formData.videoFile && formData.videoFile.size > MAX_VIDEO_BYTES) {
      newErrors.video = "Tutorial video file size must not exceed 250 MB";
      setVideoType("tutorial");
    }
    if (formData.promoVideoFile && formData.promoVideoFile.size > MAX_VIDEO_BYTES) {
      newErrors.promoVideo = "Promotional video file size must not exceed 250 MB";
    }
    if (formData.pricingModel !== "Free") {
      if (!formData.payoutCurrency) {
        newErrors.payoutCurrency = "This field is required";
      }
      if (!formData.payoutFrequency) {
        newErrors.payoutFrequency = "This field is required";
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePhase2 = () => {
    const newErrors: Record<string, string> = {};

    if (formData.apiEnabled && formData.apiInputSchema.length === 0) {
      newErrors.apiEndpoint = "Add at least one input field so buyers have something to fill in";
    }
    if (formData.apiEnabled && !formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = "This field is required";
    }
    if (formData.tryMeEnabled && !formData.yamlFile && !formData.yamlName) {
      newErrors.yamlFile = "This field is required";
    }
    if (!formData.providerEmail.trim()) {
      newErrors.providerEmail = "This field is required";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const p1 = validatePhase1();
    const p2 = validatePhase2();
    return p1 && p2;
  };

  const handleNextStep = () => {
    setSubmitError(null);
    if (validatePhase1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSubmitError("Please fill in all required fields marked with * in Phase 1 before proceeding.");
      const firstErrorEl = document.querySelector(".text-red-500");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenModal = () => {
    setSubmitError(null);
    const p1Valid = validatePhase1();
    const p2Valid = validatePhase2();

    if (!p1Valid) {
      setCurrentStep(1);
      setSubmitError("Please fill in all required fields marked with * in Phase 1.");
      const firstErrorEl = document.querySelector(".text-red-500");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!p2Valid) {
      setSubmitError("Please fill in all required fields marked with *.");
      const firstErrorEl = document.querySelector(".text-red-500");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (formData.tryMeEnabled && formData.yamlFile && formData.yamlValid !== true) {
      setSubmitError(
        formData.yamlValid === false
          ? `Your manifest has an error: ${formData.yamlError} fix it and re-upload before submitting.`
          : "Still checking your manifest please wait a moment and try again."
      );
      return;
    }

    setAgreeTerms(false);
    setAgreePrivacy(false);
    setShowTermsModal(true);
  };

  const executeSubmit = async () => {
    try {
      setSubmitError(null);
      const isValid = validateForm();
      if (!isValid) {
        setSubmitError("Please fill in all required fields marked with *");
        return;
      }
      if (formData.tryMeEnabled && formData.yamlFile && formData.yamlValid !== true) {
        setSubmitError(
          formData.yamlValid === false
            ? `Your manifest has an error: ${formData.yamlError}. Fix it and re-upload before submitting.`
            : "Still checking your manifest. Please wait a moment and try again."
        );
        return;
      }
      // Only block on secrets the seller is providing themselves — ones
      // marked "aiKart will provide" are allowed to go in blank; an admin
      // fills those in before the listing can be approved.
      const isEmailSecretName = (name: string) => {
        const n = name.toUpperCase();
        return n.includes("EMAIL") || n.includes("MAIL") || n === "MY_EMAIL" || n === "EMAIL_PASSWORD" || n === "EMAIL_PASS";
      };
      const missingSecret = formData.yamlSecrets.find(
        (s) =>
          s.required &&
          !isEmailSecretName(s.name) &&
          (formData.secretProviders[s.name] ?? "seller") === "seller" &&
          !(formData.secretValues[s.name] ?? "").trim()
      );
      if (missingSecret) {
        setSubmitError(`Please provide a value for "${missingSecret.name}" your manifest declares it as required.`);
        return;
      }

      const newTasks: UploadTask[] = [];
      if (formData.logoFile) {
        newTasks.push({
          key: "logo",
          label: "Logo",
          file: formData.logoFile,
          status: "idle",
          progress: 0,
        });
      }
      if (formData.coverFile) {
        newTasks.push({
          key: "cover",
          label: "Cover Image",
          file: formData.coverFile,
          status: "idle",
          progress: 0,
        });
      }
      if (formData.videoFile) {
        newTasks.push({
          key: "video",
          label: "Tutorial Video",
          file: formData.videoFile,
          status: "idle",
          progress: 0,
        });
      }
      if (formData.promoVideoFile) {
        newTasks.push({
          key: "promo_video",
          label: "Promotional Video",
          file: formData.promoVideoFile,
          status: "idle",
          progress: 0,
        });
      }
      formData.screenshotFiles.forEach((f, i) => {
        if (f) {
          newTasks.push({
            key: `screenshot_${i}`,
            label: `Screenshot ${i + 1}`,
            file: f,
            status: "idle",
            progress: 0,
          });
        }
      });
      if (formData.pdfFile) {
        newTasks.push({
          key: "pdf",
          label: "Pitch Deck / PDF",
          file: formData.pdfFile,
          status: "idle",
          progress: 0,
        });
      }
      if (formData.tryMeEnabled && formData.yamlFile) {
        newTasks.push({
          key: "yaml",
          label: "Sandbox YAML Manifest",
          file: formData.yamlFile,
          status: "idle",
          progress: 0,
        });
      }

      setTasks(newTasks.map((t) => ({ ...t, status: "uploading" })));
      setDoneCount(0);
      setPhase("uploading");

      const listingId = generateUUID();
      const results: Record<string, string> = {};

      if (newTasks.length > 0) {
        await Promise.allSettled(
          newTasks.map(async (task) => {
            const ext = task.file.name.split(".").pop()?.toLowerCase() ?? "bin";
            let key: string;
            let bucket: string;
            let contentType = task.file.type;

            if (task.key === "logo") {
              key = `logos/${listingId}.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
            } else if (task.key === "cover") {
              key = `covers/${listingId}.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
            } else if (task.key === "video") {
              key = `videos/${listingId}.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
              contentType = contentType || "video/mp4";
            } else if (task.key === "promo_video") {
              key = `videos/${listingId}_promo.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
              contentType = contentType || "video/mp4";
            } else if (task.key === "pdf") {
              key = `pdfs/${listingId}.pdf`;
              bucket = process.env.NEXT_PUBLIC_S3_PDFS_BUCKET || "ai-marketplace-listing-pdfs";
            } else if (task.key === "yaml") {
              key = `manifests/${listingId}.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_PDFS_BUCKET || "ai-marketplace-listing-pdfs";
              contentType = contentType || "application/x-yaml";
            } else {
              const idx = task.key.split("_")[1];
              key = `screenshots/${listingId}_${idx}.${ext}`;
              bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
            }

            try {
              const { uploadUrl, publicUrl } = await getUploadUrl(bucket, key, contentType);
              await putWithProgress(uploadUrl, task.file, contentType, (pct) =>
                updateTask(task.key, { progress: pct })
              );
              results[task.key] = publicUrl;
              updateTask(task.key, { status: "done", url: publicUrl, progress: 100 });
              setDoneCount((c) => c + 1);
            } catch (err) {
              console.warn(`Upload failed for ${task.key}:`, err);
              updateTask(task.key, { status: "error" });
            }
          })
        );
      }

      const screenshotUrls = Object.entries(results)
        .filter(([k]) => k.startsWith("screenshot_"))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, url]) => url);

      setPhase("saving");

      const result = await submitListing(
        {
          title: formData.title,
          tagline: formData.tagline,
          category: selectedCategories.join(", ") || formData.category,
          listingType: formData.listingType,
          description: formData.description,
          problemSolved: formData.problemSolved,
          howItHelps: formData.howItHelps,
          technologies: formData.technologies,
          keyCapabilities: formData.keyCapabilities,
          targetIndustries: formData.targetIndustries,
          teamSize: formData.teamSize,
          pricingModel: formData.pricingModel,
          price: formData.price,
          pricingDetails: formData.pricingDetails,
          websiteUrl: formData.websiteUrl,
          providerName: formData.providerName || formData.title,
          providerEmail: formData.providerEmail,
          bankDetails: {
            accountHolder: formData.bankAccountHolder,
            accountNumber: formData.bankAccountNumber,
            ifsc: formData.bankIfsc,
            upi: formData.bankUpi,
          },
          gstNumber: formData.gstNumber,
          payoutCurrency: formData.payoutCurrency,
          payoutFrequency: formData.payoutFrequency,
          apiEndpoint: formData.apiEndpoint,
          apiEnabled: formData.apiEnabled,
          // API Endpoint Mode configuration (only meaningful when apiEnabled)
          apiMethod: formData.apiMethod,
          apiAuthType: formData.apiAuthType,
          apiAuthConfig: formData.apiAuthConfig,
          apiCredential: formData.apiCredential || undefined,
          apiInputSchema: formData.apiInputSchema.length ? formData.apiInputSchema : undefined,
          apiOutputMapping: formData.apiOutputMapping,
          apiTimeoutMs: formData.apiTimeoutMs,
          apiResponseFormat: formData.apiResponseFormat,
          apiSession:
            formData.apiSessionEnabled && formData.apiSessionUrl.trim()
              ? {
                  url: formData.apiSessionUrl.trim(),
                  method: "POST",
                  body: safeJson(formData.apiSessionBody),
                  extract: safeJson(formData.apiSessionExtract),
                }
              : undefined,
          apiStaticBody: safeJson(formData.apiStaticBody),
          apiSampleResponse: formData.apiSampleResponse ?? undefined,
          // n8n webhook trial fields
          n8nEnabled: formData.n8nEnabled,
          n8nWebhookUrl: formData.n8nWebhookUrl || undefined,
          n8nWebhookSecret: formData.n8nWebhookSecret || undefined,
          n8nInputSchema: formData.n8nInputSchema.length ? formData.n8nInputSchema : undefined,
          n8nOutputFormat: formData.n8nOutputFormat || "text",
        },
        {
          listingId,
          logoUrl: results["logo"] ?? null,
          coverUrl: results["cover"] ?? null,
          videoUrl: results["video"] ?? null,
          promoVideoUrl: results["promo_video"] ?? null,
          screenshotUrls,
          pdfUrl: results["pdf"] ?? null,
          tryMeEnabled: formData.tryMeEnabled,
          yamlUrl: results["yaml"] ?? null,
          secretValues: formData.secretValues,
          secretProviders: formData.secretProviders,
        }
      );

      if (result?.error) {
        setSubmitError(result.error);
        setPhase("idle");
        return;
      }

      setPhase("done");
      setSuccessListingId(listingId);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred during submission."
      );
      setPhase("idle");
    }
  };

  const nextEmptyPhotoIndex = formData.screenshotPreviews.findIndex((p) => !p);

  return (
    <main className="lf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ═══ SECTION 1: Header ═══ */}
      <div className="lf-topbar">
        <div className="lf-topbar-in">
          <div>
            <p className="lf-eyebrow">LIST AI SOLUTION</p>
            <h1 className="lf-h1">Add your AI product</h1>
          </div>
          <Link href="/explore" className="lf-exit">
            Exit
          </Link>
        </div>
      </div>

      <div className="lf-container">
        {fileError && <div className="lf-alert">{fileError}</div>}
        {submitError && <div className="lf-alert">{submitError}</div>}

        {/* ════════════════ PHASE 1: PRODUCT DETAILS ════════════════ */}
        {currentStep === 1 && (
          <>
            {/* ═══ SECTION 2: Cover banner with overlapping logo (matches agent detail page layout) ═══ */}
        <div className="mb-4 w-full">
          {/* Cover Image banner, with the Logo overlapping its bottom-left corner */}
          <div className="relative mb-14 sm:mb-16">
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-36 sm:h-48 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative"
            >
              {formData.coverPreview ? (
                <>
                  <img src={formData.coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCover();
                    }}
                    className="lf-cover-remove"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <svg className="text-slate-500 mb-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Upload Cover Image</span>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleCover}
              className="lf-sr-only"
            />

            {/* Logo box: overlaps the bottom-left of the cover banner */}
            <div className="absolute left-6 sm:left-8 -bottom-10 sm:-bottom-12">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 sm:w-28 sm:h-28 border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl bg-white hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative shadow-[0_10px_26px_rgba(15,23,42,0.14)]"
              >
                {formData.logoPreview ? (
                  <img src={formData.logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-1.5 text-center">
                    <svg className="text-slate-500 mb-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-600 leading-tight">Upload Logo</span>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogo}
                className="lf-sr-only"
              />
            </div>
          </div>

          {/* Product Name + Title / Tagline: side by side on larger screens */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-64 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  updateField("title", e.target.value);
                  clearError("title");
                }}
                placeholder="Add Product name"
                maxLength={50}
                className="w-full h-11 border border-slate-300 rounded-2xl px-3.5 text-sm text-left text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all"
              />
              {renderFieldError("title")}
            </div>

            <div className="w-full sm:w-64 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title / Tagline <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => {
                  updateField("tagline", e.target.value);
                  clearError("tagline");
                }}
                placeholder="Add title"
                maxLength={200}
                className="w-full h-11 border border-slate-300 rounded-2xl px-3.5 text-sm text-left text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all"
              />
              {renderFieldError("tagline")}
            </div>
          </div>

          {/* Language & Country row — ALWAYS single horizontal line */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap w-full mt-0.5">
            {/* Country Dropdown */}
            <div className="lf-dd-wrapper flex-shrink-0" ref={countryRef}>
              <button
                type="button"
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className="lf-country-btn"
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                <span className="lf-country-flag">{selectedCountry.flag}</span>
                <span className="whitespace-nowrap">{selectedCountry.name}</span>
                <svg
                  className={`lf-dd-chevron ${isCountryOpen ? "lf-dd-chevron-open" : ""}`}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCountryOpen && (
                <div className="lf-dd-menu" style={{ left: 0, transform: "none", zIndex: 60 }}>
                  <div className="lf-dd-search-box">
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="lf-dd-search-input"
                      autoFocus
                    />
                  </div>
                  <div className="lf-dd-list">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setIsCountryOpen(false);
                            setCountrySearch("");
                          }}
                          className={`lf-dd-item ${selectedCountry.code === c.code ? "is-selected" : ""
                            }`}
                        >
                          <span className="lf-dd-item-flag">{c.flag}</span>
                          <span className="lf-dd-item-name">{c.name}</span>
                          {selectedCountry.code === c.code && (
                            <span className="lf-dd-item-check">✓</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="lf-dd-empty">No countries found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Multi-language Selector */}
            <div className="lf-dd-wrapper flex-shrink-0" ref={langRef}>
              <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap">
                {selectedLanguages.map((lang) => (
                  <span key={lang} className="lf-lang-chip whitespace-nowrap" style={{ padding: "6px 12px", fontSize: "13px" }}>
                    {lang}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
                      }}
                      className="lf-lang-chip-remove"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="lf-add-lang-btn whitespace-nowrap"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  + Add languages
                </button>
              </div>

              {isLangOpen && (
                <div className="lf-dd-menu lf-dd-menu-right" style={{ zIndex: 60 }}>
                  <div className="lf-dd-list">
                    {LANGUAGES.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setSelectedLanguages(
                                selectedLanguages.filter((l) => l !== lang)
                              );
                            } else {
                              setSelectedLanguages([...selectedLanguages, lang]);
                            }
                          }}
                          className={`lf-dd-item ${active ? "is-selected" : ""}`}
                        >
                          <span>{lang}</span>
                          {active && <span className="lf-dd-item-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: Description ═══ */}
        <div className="lf-card lf-textcard">
          <h2 className="lf-heading">
            Description <span className="text-red-500 ml-0.5">*</span>
          </h2>

          {/* Main textarea: About your AI Solution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 400, color: "#334155", margin: 0 }}>
                About your AI Solution?
              </h3>
              {!openAbout && (
                <button type="button" onClick={() => setOpenAbout(true)} className="lf-pillbtn shrink-0">
                  + Add details
                </button>
              )}
            </div>
            {openAbout ? (
              <>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    updateField("description", e.target.value);
                    clearError("description");
                  }}
                  placeholder="Enter complete overview, target audience, and primary capabilities..."
                  rows={4}
                  className="lf-textarea"
                />
                {renderFieldError("description")}
              </>
            ) : (
              renderFieldError("description")
            )}
          </div>

          {/* Sub-field 1: What problem does it solve? */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 400, color: "#334155", margin: 0 }}>
                What problem does it solve?
              </h3>
              {!openProblem && (
                <button type="button" onClick={() => setOpenProblem(true)} className="lf-pillbtn shrink-0">
                  + Add details
                </button>
              )}
            </div>
            {openProblem ? (
              <>
                <textarea
                  value={formData.problemSolved}
                  onChange={(e) => {
                    updateField("problemSolved", e.target.value);
                    clearError("problemSolved");
                  }}
                  placeholder="Describe the exact pain points, inefficiencies, or workflow bottlenecks this solves..."
                  rows={3}
                  className="lf-textarea"
                />
                {renderFieldError("problemSolved")}
              </>
            ) : (
              renderFieldError("problemSolved")
            )}
          </div>

          {/* Sub-field 2: How it helps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 400, color: "#334155", margin: 0 }}>
                How it helps?
              </h3>
              {!openHowItHelps && (
                <button type="button" onClick={() => setOpenHowItHelps(true)} className="lf-pillbtn shrink-0">
                  + Add details
                </button>
              )}
            </div>
            {openHowItHelps ? (
              <>
                <textarea
                  value={formData.howItHelps}
                  onChange={(e) => {
                    updateField("howItHelps", e.target.value);
                    clearError("howItHelps");
                  }}
                  placeholder="Explain the tangible outcomes, speed improvements, cost savings, or key features..."
                  rows={3}
                  className="lf-textarea"
                />
                {renderFieldError("howItHelps")}
              </>
            ) : (
              renderFieldError("howItHelps")
            )}
          </div>
        </div>

        {/* ═══ SECTION 4: Product category / Target industry verticals ═══ */}
        <div className="lf-row2col">
          <div className="lf-card lf-textcard lf-fixedh">
            <div>
              <h2 className="lf-heading">
                Product category <span className="text-red-500 ml-0.5">*</span>
              </h2>
              <p className="lf-desc">Add your product category like data analytics</p>
            </div>

            {/* Mobile View: Selected blue chips above + custom inline dropdown */}
            <div className="block md:hidden">
              {selectedCategories.length > 0 && (
                <div className="lf-chip-group mb-3">
                  {selectedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        toggleCategory(cat);
                        clearError("category");
                      }}
                      className="lf-chip is-active"
                    >
                      ✓ {cat}
                      <span className="ml-1.5 text-xs opacity-80 font-bold">✕</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="lf-dd-wrapper w-full relative" ref={catRef} style={{ width: "100%" }}>
                <button
                  type="button"
                  onClick={() => setIsCatOpen(!isCatOpen)}
                  className={`lf-select-btn ${isCatOpen ? "is-active" : ""}`}
                  style={{
                    borderRadius: "25px",
                    height: "46px",
                    justifyContent: "space-between",
                    padding: "0 18px",
                  }}
                >
                  <span style={{ color: isCatOpen ? "#0f172a" : "#64748b", fontWeight: 500 }}>
                    + Select Product Category
                  </span>
                  <svg
                    className={`lf-dd-chevron ${isCatOpen ? "lf-dd-chevron-open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCatOpen && (
                  <div
                    className="lf-dd-menu"
                    style={{
                      width: "100%",
                      left: 0,
                      right: 0,
                      transform: "none",
                      marginTop: "6px",
                      zIndex: 50,
                    }}
                  >
                    <div className="lf-dd-search-box">
                      <input
                        type="text"
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        placeholder="Search category..."
                        className="lf-dd-search-input"
                        autoFocus
                      />
                    </div>
                    <div className="lf-dd-list" style={{ maxHeight: "210px" }}>
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => {
                          const selected = selectedCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                toggleCategory(cat);
                                clearError("category");
                                setIsCatOpen(false);
                                setCatSearch("");
                              }}
                              className={`lf-dd-item ${selected ? "is-selected" : ""}`}
                            >
                              <span className="lf-dd-item-name">{cat}</span>
                              {selected && <span className="lf-dd-item-check">✓</span>}
                            </button>
                          );
                        })
                      ) : (
                        <div className="lf-dd-empty">No category found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View: Full Chip List */}
            <div className="lf-desktop-chips lf-chip-group">
              {CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      toggleCategory(cat);
                      clearError("category");
                    }}
                    className={`lf-chip ${selected ? "is-active" : ""}`}
                  >
                    {selected ? "✓ " : "+ "}
                    {cat}
                  </button>
                );
              })}
            </div>
            {renderFieldError("category")}
          </div>

          <div className="lf-card lf-textcard lf-fixedh">
            <div>
              <h2 className="lf-heading">
                Target industry verticals <span className="text-red-500 ml-0.5">*</span>
              </h2>
              <p className="lf-desc">
                Select all your target industry verticals like sports, healthcare...
              </p>
            </div>

            {/* Mobile View: Selected blue chips above + custom inline dropdown */}
            <div className="block md:hidden">
              {formData.targetIndustries && formData.targetIndustries.length > 0 && (
                <div className="lf-chip-group mb-3">
                  {formData.targetIndustries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => {
                        toggleIndustry(ind);
                        clearError("targetIndustries");
                      }}
                      className="lf-chip is-active"
                    >
                      ✓ {ind}
                      <span className="ml-1.5 text-xs opacity-80 font-bold">✕</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="lf-dd-wrapper w-full relative" ref={industryRef} style={{ width: "100%" }}>
                <button
                  type="button"
                  onClick={() => setIsIndustryOpen(!isIndustryOpen)}
                  className={`lf-select-btn ${isIndustryOpen ? "is-active" : ""}`}
                  style={{
                    borderRadius: "25px",
                    height: "46px",
                    justifyContent: "space-between",
                    padding: "0 18px",
                  }}
                >
                  <span style={{ color: isIndustryOpen ? "#0f172a" : "#64748b", fontWeight: 500 }}>
                    + Select Target Industry
                  </span>
                  <svg
                    className={`lf-dd-chevron ${isIndustryOpen ? "lf-dd-chevron-open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isIndustryOpen && (
                  <div
                    className="lf-dd-menu"
                    style={{
                      width: "100%",
                      left: 0,
                      right: 0,
                      transform: "none",
                      marginTop: "6px",
                      zIndex: 50,
                    }}
                  >
                    <div className="lf-dd-search-box">
                      <input
                        type="text"
                        value={industrySearch}
                        onChange={(e) => setIndustrySearch(e.target.value)}
                        placeholder="Search target industry..."
                        className="lf-dd-search-input"
                        autoFocus
                      />
                    </div>
                    <div className="lf-dd-list" style={{ maxHeight: "210px" }}>
                      {filteredIndustries.length > 0 ? (
                        filteredIndustries.map((ind) => {
                          const selected = formData.targetIndustries?.includes(ind);
                          return (
                            <button
                              key={ind}
                              type="button"
                              onClick={() => {
                                toggleIndustry(ind);
                                clearError("targetIndustries");
                                setIsIndustryOpen(false);
                                setIndustrySearch("");
                              }}
                              className={`lf-dd-item ${selected ? "is-selected" : ""}`}
                            >
                              <span className="lf-dd-item-name">{ind}</span>
                              {selected && <span className="lf-dd-item-check">✓</span>}
                            </button>
                          );
                        })
                      ) : (
                        <div className="lf-dd-empty">No industry found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View: Full Chip List */}
            <div className="lf-desktop-chips lf-chip-group">
              {INDUSTRY_VERTICALS.map((ind) => {
                const selected = formData.targetIndustries?.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => {
                      toggleIndustry(ind);
                      clearError("targetIndustries");
                    }}
                    className={`lf-chip ${selected ? "is-active" : ""}`}
                  >
                    {selected ? "✓ " : "+ "}
                    {ind}
                  </button>
                );
              })}
            </div>
            {renderFieldError("targetIndustries")}
          </div>
        </div>

        {/* ═══ SECTION 5: Team Size (Individual vs Enterprise — pick one) ═══ */}
        <div className="lf-card lf-textcard">
          <div>
            <h2 className="lf-heading">
              Team Size <span className="text-red-500 ml-0.5">*</span>
            </h2>
            <p className="lf-desc">Are you an individual creator or an established enterprise?</p>
          </div>

          <div className="lf-chip-group">
            <button
              type="button"
              onClick={() => selectTeamType("individual")}
              className={`lf-chip ${teamType === "individual" ? "is-active" : ""}`}
            >
              {teamType === "individual" ? "✓ " : ""}Individual
            </button>
            <button
              type="button"
              onClick={() => selectTeamType("enterprise")}
              className={`lf-chip ${teamType === "enterprise" ? "is-active" : ""}`}
            >
              {teamType === "enterprise" ? "✓ " : ""}Enterprise
            </button>
          </div>

          {teamType === "individual" && (
            <div style={{ paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
              <p className="lf-desc" style={{ marginBottom: 10 }}>Solo developer or small team</p>
              <div className="lf-size-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {INDIVIDUAL_TEAM_SIZES.map((sz) => {
                  const active = formData.teamSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        updateField("teamSize", sz);
                        clearError("teamSize");
                      }}
                      className={`lf-size-btn ${active ? "is-active" : ""}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {teamType === "enterprise" && (
            <div style={{ paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
              <p className="lf-desc" style={{ marginBottom: 10 }}>Established team or organization</p>
              <div className="lf-size-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {ENTERPRISE_TEAM_SIZES.map((sz) => {
                  const active = formData.teamSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        updateField("teamSize", sz);
                        clearError("teamSize");
                      }}
                      className={`lf-size-btn ${active ? "is-active" : ""}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {renderFieldError("teamSize")}
        </div>

        {/* ═══ SECTION 6: Pricing ═══ */}
        <div className="lf-card lf-textcard">
          <div>
            <h2 className="lf-heading">
              Pricing <span className="text-red-500 ml-0.5">*</span>
            </h2>
            <p className="lf-desc">Pricing is the official currency for the item</p>
          </div>
          <div className="lf-size-grid" style={{ marginTop: 16, marginBottom: 12, gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {PRICING_MODELS.map((p) => {
              const active = formData.pricingModel === p.value || (p.value === "Custom" && formData.pricingModel === "Custom Quote");
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    updateField("pricingModel", p.value);
                    clearError("pricingModel");
                  }}
                  className={`lf-size-btn ${active ? "is-active" : ""}`}
                  style={{
                    borderRadius: "999px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 10px",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {renderFieldError("pricingModel")}
          {(formData.pricingModel === "Paid" || formData.pricingModel === "Freemium") && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                Monthly Price <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => {
                  updateField("price", e.target.value);
                  clearError("price");
                }}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Monthly price (e.g. 49)"
                className="lf-input"
              />
              {renderFieldError("price")}
            </div>
          )}
          {(formData.pricingModel === "Custom" || formData.pricingModel === "Custom Quote") && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                Custom Pricing & Subscription Details <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                value={formData.pricingDetails}
                onChange={(e) => {
                  updateField("pricingDetails", e.target.value);
                  clearError("pricingDetails");
                }}
                placeholder="Give your details for subscription / custom pricing (e.g. Enterprise subscription with custom SLA, Standard per-seat plans, Volume API usage tiers, Dedicated cloud instance, Annual contract discount)..."
                rows={3}
                className="lf-textarea"
                style={{ fontSize: "13.5px", padding: "10px 14px", minHeight: "80px" }}
              />
              {renderFieldError("pricingDetails")}
            </div>
          )}
        </div>

        {/* ═══ SECTION 5 + 6: GST / Payout currency / Payout frequency (hidden when Pricing = Free) ═══ */}
        {formData.pricingModel !== "Free" && (
          <>
            <div className="lf-row2col">
              <div className="lf-card lf-textcard lf-fixedh">
                <div>
                  <h2 className="lf-heading">
                    GST / Tax number
                    <span className="lf-tag">(Optional)</span>
                  </h2>
                  <p className="lf-desc">Add your GST / Tax number and GST address</p>
                </div>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => {
                    updateField("gstNumber", e.target.value.toUpperCase());
                    clearError("gstNumber");
                  }}
                  placeholder="22AAAAA0000A1Z5"
                  className="lf-input"
                />
                {renderFieldError("gstNumber")}
              </div>

              <div className="lf-card lf-textcard lf-fixedh">
                <div>
                  <h2 className="lf-heading">
                    Preferred payout currency <span className="text-red-500 ml-0.5">*</span>
                  </h2>
                  <p className="lf-desc">Receive your payouts in this currency</p>
                </div>

                <div className="lf-dd-wrapper" ref={currencyRef} style={{ width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="lf-select-btn"
                  >
                    <span className="lf-currency-symbol">{currentCurrency.symbol}</span>
                    <span className="lf-currency-label">{currentCurrency.label}</span>
                    <svg
                      className={`lf-dd-chevron ${isCurrencyOpen ? "lf-dd-chevron-open" : ""}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      style={{ marginLeft: "auto" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isCurrencyOpen && (
                    <div className="lf-dd-menu" style={{ width: "100%", minWidth: 260, left: 0, transform: "none" }}>
                      <div className="lf-dd-search-box">
                        <input
                          type="text"
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          placeholder="Search currency..."
                          className="lf-dd-search-input"
                          autoFocus
                        />
                      </div>
                      <div className="lf-dd-list">
                        {filteredCurrencies.length > 0 ? (
                          filteredCurrencies.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => {
                                updateField("payoutCurrency", c.value);
                                clearError("payoutCurrency");
                                setIsCurrencyOpen(false);
                                setCurrencySearch("");
                              }}
                              className={`lf-dd-item ${formData.payoutCurrency === c.value ? "is-selected" : ""
                                }`}
                            >
                              <span className="lf-dd-item-symbol">{c.symbol}</span>
                              <span className="lf-dd-item-name">{c.label}</span>
                              {formData.payoutCurrency === c.value && (
                                <span className="lf-dd-item-check">✓</span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="lf-dd-empty">No currencies found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {renderFieldError("payoutCurrency")}
              </div>
            </div>

            <div className="lf-card lf-textcard">
              <div>
                <h2 className="lf-heading">
                  Payout frequency <span className="text-red-500 ml-0.5">*</span>
                </h2>
                <p className="lf-desc">Pick the right options for payout step-by-step</p>
              </div>
              <div className="lf-toggle-row">
                {PAYOUT_FREQUENCIES.map((freq) => {
                  const active = formData.payoutFrequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => {
                        updateField("payoutFrequency", freq);
                        clearError("payoutFrequency");
                      }}
                      className={`lf-toggle ${active ? "is-active" : ""}`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
              {renderFieldError("payoutFrequency")}
            </div>
          </>
        )}

        {/* ═══ SECTION 7: Video — Tutorial (compulsory) & Promotional (optional) ═══ */}
        <div className="lf-card lf-textcard" style={{ padding: "18px 26px", gap: "10px" }}>
          <h2 className="lf-heading" style={{ marginBottom: "2px" }}>
            Video <span className="text-red-500 ml-0.5">*</span>
            <span className="lf-tag" style={{ fontSize: "13px" }}>(up to 250MB per video)</span>
          </h2>

          {/* Row 1: Tutorial Video (Compulsory) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14.5px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
                Tutorial Video
              </h3>
              {formData.videoPreview ? (
                <div className="lf-file-row max-w-[170px] sm:max-w-[240px] md:max-w-[320px] shrink-0" style={{ padding: "5px 14px", margin: 0, borderRadius: "999px" }}>
                  <span className="lf-file-name text-xs md:text-sm">▶ {formData.videoName}</span>
                  <button type="button" onClick={clearVideo} className="lf-file-remove">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="lf-pillbtn shrink-0"
                  style={{ height: "36px", padding: "0 18px", fontSize: "13.5px" }}
                >
                  + Add Video
                </button>
              )}
            </div>
            {renderFieldError("video")}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleVideo}
              className="lf-sr-only"
            />
          </div>

          {/* Row 2: Promotional Video (Optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14.5px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
                Promotional Video <span className="lf-tag" style={{ fontSize: "13px", fontWeight: 400 }}>(Optional)</span>
              </h3>
              {formData.promoVideoPreview ? (
                <div className="lf-file-row max-w-[170px] sm:max-w-[240px] md:max-w-[320px] shrink-0" style={{ padding: "5px 14px", margin: 0, borderRadius: "999px" }}>
                  <span className="lf-file-name text-xs md:text-sm">▶ {formData.promoVideoName}</span>
                  <button type="button" onClick={clearPromoVideo} className="lf-file-remove">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => promoVideoInputRef.current?.click()}
                  className="lf-pillbtn shrink-0"
                  style={{ height: "36px", padding: "0 18px", fontSize: "13.5px" }}
                >
                  + Add Video
                </button>
              )}
            </div>
            {renderFieldError("promoVideo")}
            <input
              ref={promoVideoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              onChange={handlePromoVideo}
              className="lf-sr-only"
            />
          </div>

          {fileError && <div className="lf-alert" style={{ marginTop: 8 }}>{fileError}</div>}
        </div>

        {/* ═══ SECTION 8: Photos / Document-Pitch Deck ═══ */}
        <div className="lf-row2col">
          <div className="lf-card lf-textcard lf-fixedh">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="lf-heading">Photos</h2>
                <p className="lf-desc">(up to 5 optional)</p>
              </div>
              {formData.screenshotPreviews.some((p) => !p) && (
                <button
                  type="button"
                  onClick={() => photosInputRef.current?.click()}
                  className="lf-pillbtn shrink-0"
                  style={{ height: "36px", padding: "0 18px", fontSize: "13.5px" }}
                >
                  + Add Photo
                </button>
              )}
            </div>

            <div>
              {formData.screenshotPreviews.some((p) => p) && (
                <div className="lf-photo-row" style={{ marginBottom: 10 }}>
                  {formData.screenshotPreviews.map((preview, idx) =>
                    preview ? (
                      <div key={idx} className="lf-photo-thumb">
                        <img src={preview} alt={`Preview ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="lf-photo-remove"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null
                  )}
                </div>
              )}
              <input
                ref={photosInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotos}
                className="lf-sr-only"
              />
            </div>
          </div>

          <div className="lf-card lf-textcard lf-fixedh">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="lf-heading">
                  Document/Pitch Deck
                  <span className="lf-tag">(Optional)</span>
                </h2>
                <p className="lf-desc">Product brochure, pitch deck, or technical docs</p>
              </div>

              <div className="flex justify-end shrink-0 min-w-0">
                {formData.pdfName ? (
                  <div className="lf-file-row max-w-[170px] sm:max-w-[240px] md:max-w-[320px] shrink-0" style={{ margin: 0, padding: "5px 14px", borderRadius: "999px" }}>
                    <span className="lf-file-name text-xs md:text-sm">📄 {formData.pdfName}</span>
                    <button type="button" onClick={clearPdf} className="lf-file-remove">
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="lf-pillbtn shrink-0"
                    style={{ height: "36px", padding: "0 18px", fontSize: "13.5px" }}
                  >
                    + Add PDF
                  </button>
                )}
              </div>
            </div>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdf}
              className="lf-sr-only"
            />
          </div>
        </div>

        {/* ═══ PHASE 1 END NEXT BUTTON ═══ */}
        <div className="lf-submit-row" style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button
            type="button"
            onClick={handleNextStep}
            className="lf-submit-btn"
          >
            Next
          </button>
        </div>
      </>
    )}

    {/* ════════════════ PHASE 2: TESTING & CONTACT ════════════════ */}
    {currentStep === 2 && (
      <>
        <div className="flex flex-row items-center justify-between gap-2 w-full mb-4">
          <button
            type="button"
            onClick={handlePrevStep}
            className="lf-pillbtn shrink-0"
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#2563eb",
              background: "#eff6ff",
              borderColor: "#bfdbfe",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span>Back to Product Details</span>
          </button>
          <span className="text-[12px] sm:text-sm font-semibold text-slate-500 text-right shrink-0">
            Step 2 of 2<span className="hidden sm:inline">: Interactive Testing &amp; Contact</span>
          </span>
        </div>

        {/* ═══ SECTION: Interactive Testing — API / Sandbox / n8n tabs, one merged card ═══ */}
        <div className="lf-card lf-textcard">
          <div>
            <h2 className="lf-heading">
              Interactive Testing <span className="text-red-500 ml-0.5">*</span>
            </h2>
            <p className="lf-desc">
              Choose how buyers can try your product before they buy
            </p>
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-3 flex-wrap border-b border-slate-200/80 pb-4 mb-2">
            {(["api", "sandbox", "n8n"] as const).map((tab) => {
              const label = tab === "api" ? "API" : tab === "sandbox" ? "Sandbox" : "n8n Automation";
              const active = testTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTestTab(tab)}
                  className={`lf-chip text-center justify-center ${active ? "is-active" : ""}`}
                  style={{
                    borderRadius: "999px",
                    height: "40px",
                    padding: "0 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

        {testTab === "api" && <ApiEndpointSection />}

        {testTab === "sandbox" && (
          <div className="lf-textcard">
            <div>
              <h3 className="lf-heading" style={{ fontSize: 18 }}>
                Do you have a testable sandbox? <span className="text-red-500 ml-0.5">*</span>
              </h3>
              <p className="lf-desc">
                Let users evaluate your product live with a fully functional sandbox
              </p>
            </div>

            <div>
              <div className="lf-toggle-row" style={{ marginBottom: formData.tryMeEnabled ? 12 : 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    updateField("tryMeEnabled", true);
                    updateField("apiEnabled", false);
                  }}
                  className={`lf-toggle ${formData.tryMeEnabled ? "is-active" : ""}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateField("tryMeEnabled", false);
                    clearError("yamlFile");
                  }}
                  className={`lf-toggle ${!formData.tryMeEnabled ? "is-active" : ""}`}
                >
                  No
                </button>
              </div>

              {formData.tryMeEnabled && (
                <>
                  <div className="flex flex-row items-center gap-2 sm:gap-2.5 mb-4 w-full">
                    <div className="relative group inline-flex flex-1 sm:flex-initial">
                      <a
                        href="/docs/aikart-agent-manifest-template.yaml"
                        download="aikart-agent-manifest-template.yaml"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 hover:border-blue-300 py-1.5 px-3 sm:px-4 rounded-full transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow active:scale-[0.98]"
                        title="Download starter template (.yaml)"
                        aria-label="Download starter template (.yaml)"
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[16px] flex-shrink-0">download</span>
                        <span className="hidden sm:inline">Download starter template (.yaml)</span>
                        <span className="sm:hidden">Download</span>
                      </a>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center justify-center z-30 transition-all duration-150">
                        <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap">
                          Download starter template (.yaml)
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    </div>

                    <div className="relative group inline-flex flex-1 sm:flex-initial">
                      <a
                        href="/docs/aikart-agent-manifest-guide.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 py-1.5 px-3 sm:px-4 rounded-full transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow active:scale-[0.98]"
                        title="Read Manifest Guide (PDF)"
                        aria-label="Read Manifest Guide (PDF)"
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-red-500 flex-shrink-0">picture_as_pdf</span>
                        <span className="hidden sm:inline">Read Manifest Guide (PDF)</span>
                        <span className="sm:hidden">Read Manifest</span>
                      </a>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center justify-center z-30 transition-all duration-150">
                        <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap">
                          Read Manifest Guide (PDF)
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.yamlName ? (
                    <div>
                      <div className="lf-file-row">
                        <span className="lf-file-name">{formData.yamlName}</span>
                        <button type="button" onClick={clearYaml} className="lf-file-remove">
                          Remove
                        </button>
                      </div>
                      {formData.yamlValid === null && (
                        <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, fontWeight: 500 }}>
                          Checking manifest…
                        </p>
                      )}
                      {formData.yamlValid === true && (
                        <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 6 }}>
                          ✓ Valid manifest &ldquo;Try Me Now&rdquo; will work once your listing is approved.
                        </p>
                      )}
                      {formData.yamlValid === false && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "12px 16px",
                            borderRadius: 14,
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            fontSize: 13,
                            fontWeight: 500,
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>✗ {formData.yamlError}</strong> fix this in your manifest file and re-upload. If you
                          submit anyway, buyers will see &ldquo;Coming Soon&rdquo; instead of a working Try Me Now button.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => yamlInputRef.current?.click()}
                        className="lf-pillbtn"
                      >
                        + Upload YAML Manifest <span className="text-red-500 ml-0.5">*</span>
                      </button>
                      {renderFieldError("yamlFile")}
                    </div>
                  )}
                  <input
                    ref={yamlInputRef}
                    type="file"
                    accept=".yaml,.yml"
                    onChange={(e) => {
                      handleYaml(e);
                      clearError("yamlFile");
                    }}
                    className="lf-sr-only"
                  />

                  {formData.yamlSecrets.length > 0 && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: "20px 24px",
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        boxShadow: "0 2px 10px rgba(15,23,42,0.02)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        API Keys / Environment Variables
                      </p>
                      <p
                        className="text-xs sm:text-[13px] text-slate-500 mb-4 leading-relaxed"
                        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      >
                        <span className="sm:hidden">
                          Encrypted &amp; only used for your agent&apos;s sandbox testing. Never shared with buyers.
                        </span>
                        <span className="hidden sm:inline">
                          Your manifest says this agent needs these to run. Values are encrypted
                          and only ever used inside your agent&apos;s own sandbox run never shown
                          to buyers, never included in your manifest file.
                        </span>
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {formData.yamlSecrets.map((s) => {
                          const sName = s.name.toUpperCase();
                          const isEmailKey =
                            sName.includes("EMAIL") ||
                            sName.includes("MAIL") ||
                            sName === "MY_EMAIL" ||
                            sName === "EMAIL_PASSWORD" ||
                            sName === "EMAIL_PASS";

                          if (isEmailKey) {
                            return (
                              <div key={s.name}>
                                <label
                                  style={{
                                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#334155",
                                    display: "block",
                                    marginBottom: 6,
                                  }}
                                >
                                  {s.name}
                                  {s.required && <span className="text-red-500 ml-0.5">*</span>}
                                  {s.description && (
                                    <span style={{ fontWeight: 400, color: "#94a3b8" }}> {s.description}</span>
                                  )}
                                </label>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    fontSize: 13,
                                    color: "#1d4ed8",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 14,
                                    padding: "12px 16px",
                                    margin: 0,
                                    fontWeight: 500,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined text-[18px] text-blue-600"
                                    style={{ flexShrink: 0 }}
                                  >
                                    lock
                                  </span>
                                  <span>
                                    AiKart wont show your sandbox as email is needed due to our Terms and Condition
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          const provider = formData.secretProviders[s.name] ?? "seller";
                          const setProvider = (p: "seller" | "admin") =>
                            updateField("secretProviders", { ...formData.secretProviders, [s.name]: p });
                          return (
                            <div key={s.name}>
                              <label
                                style={{
                                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#334155",
                                  display: "block",
                                  marginBottom: 6,
                                }}
                              >
                                {s.name}
                                {s.required && <span className="text-red-500 ml-0.5">*</span>}
                                {s.description && (
                                  <span style={{ fontWeight: 400, color: "#94a3b8" }}> {s.description}</span>
                                )}
                              </label>

                              <div className="flex flex-row items-center gap-2 mb-2.5 w-full">
                                <div className="relative group inline-flex flex-1 sm:flex-initial">
                                  <button
                                    type="button"
                                    onClick={() => setProvider("seller")}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center py-1.5 px-3 sm:px-4 text-xs sm:text-[13px] rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer text-center ${
                                      provider === "seller"
                                        ? "font-semibold text-blue-600 bg-blue-50 border border-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.12)]"
                                        : "font-medium text-slate-500 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                    }`}
                                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                                    title="I'll provide this key"
                                    aria-label="I'll provide this key"
                                  >
                                    <span className="hidden sm:inline">I&apos;ll provide this key</span>
                                    <span className="sm:hidden">I&apos;ll provide</span>
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center justify-center z-30 transition-all duration-150">
                                    <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap">
                                      I&apos;ll provide this key
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
                                    </div>
                                  </div>
                                </div>

                                <div className="relative group inline-flex flex-1 sm:flex-initial">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProvider("admin");
                                      updateField("secretValues", { ...formData.secretValues, [s.name]: "" });
                                    }}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center py-1.5 px-3 sm:px-4 text-xs sm:text-[13px] rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer text-center ${
                                      provider === "admin"
                                        ? "font-semibold text-blue-600 bg-blue-50 border border-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.12)]"
                                        : "font-medium text-slate-500 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                    }`}
                                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                                    title="aiKart should provide it"
                                    aria-label="aiKart should provide it"
                                  >
                                    <span className="hidden sm:inline">aiKart should provide it</span>
                                    <span className="sm:hidden">aiKart provide</span>
                                  </button>
                                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center justify-center z-30 transition-all duration-150">
                                    <div className="bg-slate-900 text-white text-[11px] font-medium py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap">
                                      aiKart should provide it
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {provider === "seller" ? (
                                <input
                                  type="password"
                                  autoComplete="off"
                                  value={formData.secretValues[s.name] ?? ""}
                                  onChange={(e) =>
                                    updateField("secretValues", { ...formData.secretValues, [s.name]: e.target.value })
                                  }
                                  placeholder={`Paste your ${s.name} value…`}
                                  style={{
                                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                                    width: "100%",
                                    fontSize: 14,
                                    padding: "12px 16px",
                                    borderRadius: 14,
                                    border: "1px solid #e2e8f0",
                                    background: "#ffffff",
                                    outline: "none",
                                    color: "#0f172a",
                                    transition: "all 0.2s ease",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    fontSize: 13,
                                    color: "#1d4ed8",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 14,
                                    padding: "12px 16px",
                                    margin: 0,
                                    fontWeight: 500,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined text-[18px] text-blue-600"
                                    style={{ flexShrink: 0 }}
                                  >
                                    info
                                  </span>
                                  <span>
                                    aiKart will add this key before your listing goes live no action needed from you here.
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {formData.yamlValid === true && (
                    <ManifestPreviewSection yamlFile={formData.yamlFile} yamlName={formData.yamlName} />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {testTab === "n8n" && <N8nSandboxSection />}
        </div>

        {/* ═══ SECTION: Schedule a Call ═══ */}
        <div className="lf-card lf-textcard" style={{ padding: "20px 24px" }}>
          <div>
            <h2 className="lf-heading" style={{ fontSize: "18px", marginBottom: "2px" }}>
              Schedule a Call
              <span className="lf-tag" style={{ fontSize: "13px" }}>(Optional)</span>
            </h2>
            <p className="lf-desc" style={{ fontSize: "13px" }}>Pick a time that works for you</p>
          </div>

          <div style={{ width: "100%", marginTop: "12px" }}>
            <Link
              href="/schedule"
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">📅</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Book an Onboarding Call with the aiKart Team</div>
                  <div className="text-xs text-slate-500">Pick a 30-minute slot that fits your schedule on our booking page</div>
                </div>
              </div>
              <span className="lf-pillbtn lf-calendar-btn shrink-0 text-xs sm:text-sm font-semibold text-blue-600 bg-white border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all" style={{ height: "36px", padding: "0 16px" }}>
                Open Calendar
              </span>
            </Link>
          </div>
        </div>

        {/* ═══ SECTION: Contact ═══ */}
        <div className="lf-card lf-textcard">
          <div>
            <h2 className="lf-heading">Contact</h2>
            <p className="lf-desc">Provide your contact details so buyers and the AIKart team can reach you</p>
          </div>

          <div className="lf-row2col">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                Email <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                value={formData.providerEmail}
                onChange={(e) => {
                  updateField("providerEmail", e.target.value);
                  clearError("providerEmail");
                }}
                placeholder="your-email@example.com"
                className="lf-input"
                required
              />
              {renderFieldError("providerEmail")}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontFamily: "var(--font-poppins),'Poppins',sans-serif", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
                LinkedIn <span className="lf-tag">(Optional)</span>
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="lf-input"
                  style={{ paddingRight: linkedinUrl ? "40px" : "16px" }}
                />
                {linkedinUrl && (
                  <button
                    type="button"
                    onClick={() => setLinkedinUrl("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Clear LinkedIn"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 10: Submit ═══ */}
        <div className="lf-submit-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <button
            type="button"
            onClick={handlePrevStep}
            className="lf-back-btn"
          >
            Back
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleOpenModal}
            className="lf-submit-btn"
          >
            {isSubmitting ? "Submitting..." : "Submit Listing"}
          </button>
        </div>
      </>
    )}

        {showTermsModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setShowTermsModal(false)}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "28px",
                width: "100%",
                maxWidth: "660px",
                height: "min(680px, 92vh)",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 30px 80px rgba(15,23,42,0.28)",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header (Fixed) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "20px 28px 14px",
                  background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
                  borderBottom: "1px solid #f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src="/logo/aikart-ai-mark.png"
                    alt="aiKart"
                    style={{ height: "34px", width: "auto", flexShrink: 0 }}
                  />
                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-poppins)",
                        fontWeight: 600,
                        fontSize: "18.5px",
                        color: "#0f172a",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      AIKart Seller Agreement &amp; Terms of Service
                    </h2>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0" }}>
                      Please review the terms below before your listing is submitted
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="lf-modal-close"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable body */}
              <div
                className="lf-terms-scroll"
                style={{
                  overflowY: "auto",
                  flex: "1 1 auto",
                  minHeight: 0,
                  padding: "16px 28px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {[
                  {
                    title: "1. Eligibility & Product Originality",
                    body: "You must be at least 18 years old and legally able to enter into contracts to list products on AIKart. All AI products listed must be original, functional, and accurately described. Misrepresentation of features or capabilities is strictly prohibited.",
                  },
                  {
                    title: "2. Commission Structure & Revenue Sharing",
                    body: "AIKart charges a platform commission on each successful transaction. The current commission rate is displayed in your seller dashboard and is deducted upon verified buyer settlement.",
                  },
                  {
                    title: "3. Payout Terms & Settlement",
                    body: "Payouts are remitted in your selected preferred currency to your designated bank account according to your chosen payout schedule (Monthly or Weekly), subject to standard settlement and fraud verification.",
                  },
                  {
                    title: "4. Prohibited Content & Intellectual Property",
                    body: "You retain ownership of your AI product. By listing on AIKart, you grant AIKart a non exclusive license to display and promote your product. You may not list products that are harmful, illegal, or violate intellectual property rights.",
                  },
                  {
                    title: "5. Sandbox & Live Evaluation",
                    body: "If you provide live sandbox manifests or test endpoints, ensure demo environments do not expose sensitive infrastructure or secrets.",
                  },
                  {
                    title: "6. Termination & Governing Law",
                    body: "AIKart reserves the right to suspend or terminate seller accounts that violate these terms. These terms are governed by the laws of India.",
                  },
                ].map((section) => (
                  <div key={section.title}>
                    <p style={{ margin: "0 0 3px", fontWeight: 600, fontSize: "13.5px", color: "#0f172a" }}>
                      {section.title}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.65, color: "#475569" }}>
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer: streamlined, compact without harsh gray lines */}
              <div
                style={{
                  padding: "10px 28px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  background: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#0f172a",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#2563eb",
                      marginTop: "1px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <span>I agree to the <strong style={{ color: "#2563eb", fontWeight: 600 }}>Terms &amp; Conditions</strong> of the AIKart Seller Agreement</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#0f172a",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#2563eb",
                      marginTop: "1px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <span>I accept the <strong style={{ color: "#2563eb", fontWeight: 600 }}>Privacy Policy</strong></span>
                </label>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="lf-back-btn"
                    style={{
                      height: "38px",
                      padding: "0 22px",
                      fontSize: "13.5px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!modalAgreed || isSubmitting}
                    onClick={() => {
                      if (!agreeTerms || !agreePrivacy) return;
                      updateField("termsAgreed", true);
                      updateField("privacyAgreed", true);
                      setShowTermsModal(false);
                      executeSubmit();
                    }}
                    className="lf-submit-btn"
                    style={{
                      height: "38px",
                      padding: "0 26px",
                      fontSize: "13.5px",
                      boxShadow: modalAgreed ? "0 4px 14px rgba(37,99,235,0.25)" : "none",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Submission Modal / Progress ── */}
      {(phase === "uploading" || phase === "saving") && (
        <div className="lf-modal-overlay">
          <div className="lf-modal">
            <h3>
              {phase === "uploading"
                ? `Uploading Media Files (${doneCount}/${totalTasks})...`
                : "Saving AI Product Listing..."}
            </h3>

            <div className="lf-progress-track">
              <div
                className="lf-progress-fill"
                style={{
                  width: `${totalTasks > 0
                      ? Math.round((doneCount / totalTasks) * 100)
                      : phase === "saving"
                        ? 90
                        : 100
                    }%`,
                }}
              />
            </div>

            {tasks.length > 0 && (
              <div>
                {tasks.map((t) => (
                  <div key={t.key} className="lf-task-row">
                    <span>{t.label}</span>
                    <span
                      className={
                        t.status === "done"
                          ? "lf-task-done"
                          : t.status === "error"
                            ? "lf-task-error"
                            : "lf-task-pct"
                      }
                    >
                      {t.status === "done" ? "✓ Done" : t.status === "error" ? "Failed" : `${t.progress}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Success Modal: shown once the listing has been created ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="ak-success-wrap shadow-2xl p-8 sm:p-10 bg-white/10 backdrop-blur-xl border border-white/20 max-w-sm w-full text-center flex flex-col items-center" style={{ borderRadius: "25px" }}>
            <div className="w-20 h-20 mb-5 relative flex items-center justify-center">
              <svg className="w-20 h-20 ak-success-svg" viewBox="0 0 80 80">
                <circle className="ak-success-fill" cx="40" cy="40" r="36" fill="#2563eb" />
                <circle
                  className="ak-success-circle"
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                />
                <path
                  className="ak-success-check"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M24 40.5L34.5 51L56 29.5"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1.5">Your AI Agent is Listed!</h3>
            <p className="text-base font-medium text-white/80 mb-1">
              It&apos;s now under review by our team.
            </p>
            <p className="text-xs text-white/60 mb-7 max-w-xs mx-auto">
              We&apos;ll notify you by email as soon as it&apos;s approved and live on aiKart.
            </p>

            <button
              type="button"
              onClick={() => {
                if (successListingId) router.push(`/seller/status?id=${successListingId}`);
              }}
              className="px-8 py-2.5 border border-white/30 text-white hover:bg-white/10 rounded-full text-sm font-semibold transition-colors cursor-pointer"
            >
              View Status
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const CSS = `
.lf{ font-family:var(--font-inter),'Inter',sans-serif; background:#F4F4F4; min-height:100vh; color:#0f172a; padding-bottom:80px; }

/* ── header ── */
.lf-topbar{ padding:32px 20px 12px; }
.lf-topbar-in{ max-width:1097px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.lf-eyebrow{ font-family:var(--font-inter),'Inter',sans-serif; font-weight:600; font-size:18px; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 6px; background:linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%); background-size:200% 100%; background-position:0% 50%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; display:inline-block; animation:movingGradientShift 6s linear infinite; white-space:nowrap; max-width:100%; }
@media(max-width:480px){ .lf-eyebrow{ font-size:14px; letter-spacing:0.04em; } }
.lf-h1{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; font-weight:400; font-size:28px; line-height:1.15; letter-spacing:-0.01em; margin:0; color:#0f172a; }
@media(min-width:1024px){ .lf-h1{ line-height:44px; } }
.lf-exit{ padding:9px 22px; border-radius:999px; border:1px solid #e2e8f0; background:#ffffff; font-size:14px; font-weight:500; color:#475569; text-decoration:none; transition:background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.02); }
.lf-exit:hover{ background-color:#dc2626; border-color:#dc2626; color:#ffffff; box-shadow:0 4px 14px rgba(220,38,38,0.3); }

/* ── dropdowns (country & language) ── */
.lf-dd-wrapper{ position:relative; display:inline-block; }
.lf-country-btn{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; color:#0f172a; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:999px; padding:9px 16px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; transition:all 0.2s ease; }
.lf-country-btn:hover{ background:#e2e8f0; border-color:#94a3b8; }
.lf-country-flag{ font-size:17px; line-height:1; }
.lf-dd-chevron{ width:16px; height:16px; color:#64748b; margin-left:2px; flex-shrink:0; transition:transform 0.2s ease; }
.lf-dd-chevron-open{ transform:rotate(180deg); }

@keyframes lfDdSlide{ 0%{ opacity:0; transform:translateY(-6px); } 100%{ opacity:1; transform:translateY(0); } }
.lf-dd-menu{ position:absolute; top:calc(100% + 6px); left:50%; transform:translateX(-50%); z-index:50; width:220px; background:#ffffff; border:1px solid #cbd5e1; border-radius:20px; box-shadow:0 12px 36px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.06); padding:8px 0; overflow:hidden; animation:lfDdSlide 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.lf-dd-menu-right{ left:auto; right:0; transform:none; }
.lf-dd-search-box{ padding:6px 10px 8px; border-bottom:1px solid #f1f5f9; }
.lf-dd-search-input{ font-family:var(--font-poppins),'Poppins',sans-serif; width:100%; font-size:13px; padding:6px 10px; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; outline:none; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
.lf-dd-search-input:focus{ border-color:#2563eb; background:#ffffff; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }

.lf-dd-list{ max-height:210px; overflow-y:auto; padding:4px 0; }
.lf-dd-item{ width:100%; display:flex; align-items:center; justify-content:space-between; padding:9px 16px; font-family:var(--font-poppins),'Poppins',sans-serif; font-size:13.5px; font-weight:500; color:#334155; background:none; border:none; text-align:left; cursor:pointer; transition:background 0.15s ease; }
.lf-dd-item:hover{ background:#f1f5f9; color:#0f172a; }
.lf-dd-item.is-selected{ background:#eff6ff; color:#2563eb; font-weight:600; }
.lf-dd-item-flag{ font-size:16px; margin-right:8px; }
.lf-dd-item-name{ flex:1; }
.lf-dd-item-check{ color:#2563eb; font-weight:700; font-size:13px; }
.lf-dd-empty{ padding:12px; font-size:12px; color:#94a3b8; text-align:center; }

.lf-lang-chips-row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.lf-lang-chip{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; color:#2563eb; background:#eff6ff; border:1px solid #bfdbfe; border-radius:999px; padding:8px 14px; display:inline-flex; align-items:center; gap:6px; }
.lf-lang-chip-remove{ background:none; border:none; color:#2563eb; cursor:pointer; font-size:12px; padding:0; display:inline-flex; align-items:center; justify-content:center; }
.lf-lang-chip-remove:hover{ color:#1d4fd0; }
.lf-add-lang-btn{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; color:#2563eb; background:#ffffff; border:1px dashed #93c5fd; border-radius:999px; padding:8px 16px; cursor:pointer; transition:all 0.2s ease; }
.lf-add-lang-btn:hover{ background:#eff6ff; border-color:#2563eb; }

.lf-select-btn{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; color:#0f172a; background:#ffffff; border:1px solid #cbd5e1; border-radius:14px; padding:10px 16px; width:100%; display:flex; align-items:center; gap:8px; cursor:pointer; transition:all 0.2s ease; outline:none; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
.lf-select-btn:hover{ background:#ffffff; border-color:#94a3b8; }
.lf-select-btn:focus, .lf-select-btn.is-active{ background:#ffffff; border-color:#2563eb; box-shadow:0 0 0 3.5px rgba(37,99,235,0.12); }
.lf-currency-symbol{ font-weight:600; color:#2563eb; font-size:14px; margin-right:4px; flex-shrink:0; }
.lf-currency-label{ font-weight:500; color:#0f172a; flex:1; text-align:left; }
.lf-dd-item-symbol{ font-weight:600; color:#2563eb; margin-right:10px; min-width:28px; flex-shrink:0; text-align:left; }

/* ── container / cards ── */
.lf-container{ max-width:1097px; margin:0 auto; padding:20px 20px 0; display:flex; flex-direction:column; gap:20px; }
@media(max-width:768px){ .lf-container{ padding:16px 16px 0; gap:16px; } }
@media(min-width:1024px){ .lf-container{ padding:24px 0 0; gap:20px; } }
.lf-alert{ padding:14px 18px; border-radius:25px; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:13px; font-weight:600; }

.lf-card{ background:#ffffff; border:1px solid rgba(15,23,42,0.08); border-radius:25px; padding:24px 28px; box-shadow:0 2px 10px rgba(15,23,42,0.03); transition:all .2s ease; }
@media(max-width:768px){ .lf-card{ border-radius:25px; padding:20px 16px; } }
@media(min-width:1024px){ .lf-card{ border-radius:25px; padding:28px 34px; } }
.lf-card:hover{ border-color:rgba(15,23,42,0.12); box-shadow:0 4px 16px rgba(15,23,42,0.04); }
.lf-textcard{ display:flex; flex-direction:column; gap:16px; }
.lf-fixedh{ min-height:auto; display:flex; flex-direction:column; gap:16px; justify-content:flex-start; }

.lf-heading{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:600; font-size:20px; line-height:1.3; margin:0 0 6px; color:#0f172a; display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
@media(min-width:1024px){ .lf-heading{ font-size:24px; line-height:34px; margin-bottom:4px; } }
.lf-heading.lf-center{ justify-content:center; text-align:center; }
.lf-tag{ font-family:var(--font-poppins),'Poppins',sans-serif; font-size:14px; font-weight:500; color:#94a3b8; line-height:1; }
@media(min-width:1024px){ .lf-tag{ font-size:15px; } }
.lf-desc{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:400; font-size:13px; line-height:1.4; color:#64748b; margin:0; }
@media(min-width:1024px){ .lf-desc{ font-size:15px; line-height:22px; } }

.lf-pillbtn{ font-family:var(--font-poppins),'Poppins',sans-serif; display:inline-flex; align-items:center; justify-content:center; height:36px; padding:0 16px; border-radius:999px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s ease; align-self:center; box-shadow:0 1px 3px rgba(0,0,0,0.03); white-space:nowrap; }
@media(min-width:768px){ .lf-pillbtn{ height:42px; padding:0 22px; font-size:14px; } }
@media(min-width:1024px){ .lf-pillbtn{ height:46px; border-radius:999px; font-size:14px; padding:0 24px; } }
.lf-pillbtn:hover{ background:#2563eb; color:#ffffff; border-color:#2563eb; box-shadow:0 4px 14px rgba(37,99,235,0.22); }
.lf-calendar-btn{ align-self:flex-start !important; }
@media(min-width:640px){ .lf-calendar-btn{ align-self:center !important; } }
.lf-secret-row{ display:flex; align-items:center; gap:10px; width:100%; max-width:100%; flex-wrap:nowrap; }
.lf-secret-input{ flex:1 1 auto !important; min-width:0 !important; width:auto !important; }
@media(min-width:640px){
  .lf-secret-row{ width:fit-content; }
  .lf-secret-input{ flex:0 0 360px !important; width:360px !important; }
}

.lf-textarea{ font-family:var(--font-poppins),'Poppins',sans-serif; width:100%; font-size:14px; color:#0f172a; background:#ffffff; border:1px solid #cbd5e1; border-radius:20px; padding:16px 20px; outline:none; resize:vertical; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
.lf-textarea:hover{ border-color:#94a3b8; }
.lf-textarea:focus{ background:#ffffff; border-color:#2563eb; box-shadow:0 0 0 3.5px rgba(37,99,235,0.12); }

/* ── section 2: identity row ── */
.lf-row2{ display:flex; flex-wrap:wrap; align-items:flex-start; gap:20px; margin-bottom:40px; }
@media(max-width:768px){ .lf-row2{ flex-direction:column; align-items:stretch; gap:16px; margin-bottom:24px; } }
.lf-logo-identity{ display:flex; align-items:flex-start; gap:24px; flex:1 1 240px; min-width:180px; }
.lf-logo-box{ width:100px; height:100px; min-width:100px; min-height:100px; border-radius:25px; border:2px dashed #cbd5e1; background:#ffffff; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; flex:0 0 100px; flex-shrink:0; align-self:flex-start; position:relative; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
@media(min-width:640px){ .lf-logo-box{ width:144px; height:144px; min-width:144px; min-height:144px; border-radius:25px; flex:0 0 144px; } }
.lf-logo-box:hover{ border-color:#2563eb; background:#eff6ff; box-shadow:0 4px 14px rgba(37,99,235,0.08); }
.lf-logo-box img{ width:100%; height:100%; object-fit:cover; }
.lf-upload-placeholder{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; text-align:center; padding:8px; }
.lf-upload-icon{ color:#64748b; transition:color .2s ease; }
.lf-logo-box:hover .lf-upload-icon{ color:#2563eb; }
.lf-logo-label{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:12.5px; text-align:center; color:#475569; transition:color .2s ease; line-height:1.2; }
@media(min-width:1024px){ .lf-logo-label{ font-size:13px; } }
.lf-logo-box:hover .lf-logo-label{ color:#2563eb; }

.lf-identity{ flex:1 1 220px; display:flex; flex-direction:column; align-items:stretch; gap:10px; text-align:center; min-width:180px; width:100%; }
.lf-title-input{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:15px; text-align:center; color:#0f172a; border:1px solid #cbd5e1; outline:none; background:#ffffff; border-radius:25px; height:52px !important; min-height:52px; max-height:52px; padding:0 20px; width:100% !important; max-width:none !important; box-sizing:border-box; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
.lf-title-input:hover{ border-color:#94a3b8; }
.lf-title-input::placeholder{ color:#94a3b8; font-weight:400; }
.lf-title-input:focus{ background:#ffffff; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
@media(min-width:1024px){ .lf-title-input{ font-size:16px; height:52px !important; } }
.lf-tagline-input{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:400; font-size:14px; text-align:center; color:#334155; border:1px solid #cbd5e1; outline:none; background:#ffffff; border-radius:25px; height:52px !important; min-height:52px; max-height:52px; padding:0 20px; width:100% !important; max-width:none !important; box-sizing:border-box; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
.lf-tagline-input:hover{ border-color:#94a3b8; }
.lf-tagline-input::placeholder{ color:#94a3b8; }
.lf-tagline-input:focus{ background:#ffffff; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
@media(min-width:1024px){ .lf-tagline-input{ height:52px !important; } }
.lf-meta-row{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:10px; width:100%; margin-top:2px; }
.lf-country, .lf-add-lang{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:13px; color:#475569; background:#ffffff; border:1px solid #cbd5e1; border-radius:999px; padding:4px 12px; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
.lf-add-lang{ cursor:pointer; transition:all .2s; }
.lf-add-lang:hover{ background:#f8fafc; border-color:#94a3b8; color:#0f172a; }

.lf-cover-box{ width:100%; max-width:420px; height:158px; border-radius:25px; border:2px dashed #cbd5e1; background:#ffffff; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; flex:1 1 240px; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
@media(min-width:1024px){ .lf-cover-box{ width:559px; height:158px; border-radius:25px; flex:0 0 auto; max-width:none; } }
.lf-cover-box:hover{ border-color:#2563eb; background:#eff6ff; box-shadow:0 4px 14px rgba(37,99,235,0.08); }
.lf-cover-box img{ width:100%; height:100%; object-fit:cover; }
.lf-cover-label{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; text-align:center; color:#475569; transition:color .2s ease; }
@media(min-width:1024px){ .lf-cover-label{ font-size:15px; } }
.lf-cover-box:hover .lf-cover-label{ color:#2563eb; }
.lf-cover-box:hover .lf-upload-icon{ color:#2563eb; }
.lf-cover-remove{ position:absolute; top:8px; right:8px; width:24px; height:24px; border-radius:999px; background:rgba(15,23,42,.7); color:#fff; border:none; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; transition:background .2s; }
.lf-cover-remove:hover{ background:#dc2626; }

/* ── section 3: type tiles ── */
.lf-tile-grid{ display:grid; grid-template-columns:1fr; gap:14px; margin-top:20px; }
@media(min-width:640px){ .lf-tile-grid{ grid-template-columns:repeat(2,1fr); } }
@media(min-width:1024px){ .lf-tile-grid{ grid-template-columns:repeat(3,1fr); gap:16px; margin-top:24px; } }
.lf-tile{ border-radius:25px; border:1.5px solid #cbd5e1; background:#ffffff; padding:18px 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; cursor:pointer; transition:all .2s ease; gap:6px; min-height:104px; box-shadow:0 1px 3px rgba(15,23,42,0.03); }
.lf-tile:hover{ border-color:#93c5fd; box-shadow:0 6px 18px rgba(37,99,235,0.08); transform:translateY(-1px); }
.lf-tile.is-active{ border-color:#2563eb; background:#eff6ff; box-shadow:0 6px 20px rgba(37,99,235,0.14); }
.lf-tile-title{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:600; font-size:16px; line-height:1.3; color:#0f172a; }
.lf-tile.is-active .lf-tile-title{ color:#2563eb; }
@media(min-width:1024px){ .lf-tile-title{ font-size:18px; } }
.lf-tile-desc{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:400; font-size:12px; line-height:1.4; color:#64748b; }
@media(min-width:1024px){ .lf-tile-desc{ font-size:13.5px; } }

/* ── section 5: two-column rows ── */
.lf-row2col{ display:grid; grid-template-columns:1fr; gap:20px; }
@media(min-width:768px){ .lf-row2col{ grid-template-columns:1fr 1fr; gap:24px; } }

.lf-select, .lf-input{ font-family:var(--font-poppins),'Poppins',sans-serif; width:100%; font-size:14px; font-weight:500; color:#0f172a; background:#ffffff; border:1px solid #cbd5e1; border-radius:25px; padding:12px 18px; outline:none; transition:all .2s ease; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
@media(min-width:1024px){ .lf-select, .lf-input{ font-size:15px; padding:13px 18px; } }
.lf-select{ cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; background-size:16px; padding-right:38px; }
.lf-select:hover, .lf-input:hover{ border-color:#94a3b8; }
.lf-select:focus, .lf-input:focus{ background:#ffffff; border-color:#2563eb; box-shadow:0 0 0 3.5px rgba(37,99,235,0.12); }
.lf-input::placeholder{ color:#94a3b8; font-weight:400; }
.lf-api-input{ flex:1 1 220px; }

.lf-chip-group{ display:flex; flex-wrap:wrap; gap:8px; }
.lf-desktop-chips{ display:flex; flex-wrap:wrap; gap:8px; }
@media(max-width:767px){ .lf-desktop-chips{ display:none !important; } }
@media(min-width:768px){ .lf-desktop-chips{ display:flex !important; } }
.lf-chip{ font-family:var(--font-poppins),'Poppins',sans-serif; font-size:13px; font-weight:500; padding:8px 16px; border-radius:999px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; cursor:pointer; transition:all .2s ease; display:inline-flex; align-items:center; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
@media(min-width:1024px){ .lf-chip{ font-size:14px; padding:8px 18px; } }
.lf-chip:hover{ background:#f8fafc; color:#0f172a; border-color:#94a3b8; }
.lf-chip.is-active{ background:#2563eb; border-color:#2563eb; color:#ffffff; font-weight:600; box-shadow:0 4px 12px rgba(37,99,235,0.22); }

.lf-size-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
@media(min-width:480px){ .lf-size-grid{ grid-template-columns:repeat(4,1fr); } }
.lf-size-btn{ font-family:var(--font-poppins),'Poppins',sans-serif; padding:12px 10px; border-radius:25px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-size:14px; font-weight:500; text-align:center; cursor:pointer; transition:all .2s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
@media(min-width:1024px){ .lf-size-btn{ font-size:15px; padding:12px 12px; } }
.lf-size-btn:hover{ background:#f8fafc; border-color:#94a3b8; color:#0f172a; }
.lf-size-btn.is-active{ border-color:#2563eb; background:#eff6ff; color:#2563eb; font-weight:600; box-shadow:0 2px 8px rgba(37,99,235,0.12); }

.lf-skill-add-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.lf-skill-add-row .lf-input{ width:auto; flex:1 1 220px; }

/* ── toggles (payout frequency / yes-no) ── */
.lf-toggle-row{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.lf-toggle{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:14px; line-height:1; height:44px; padding:0 24px; border-radius:999px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:all .2s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
@media(min-width:1024px){ .lf-toggle{ font-size:15px; height:48px; padding:0 28px; } }
.lf-toggle:hover{ background:#f8fafc; border-color:#94a3b8; color:#0f172a; }
.lf-toggle.is-active{ border-color:#2563eb; background:#eff6ff; color:#2563eb; font-weight:600; box-shadow:0 2px 10px rgba(37,99,235,0.12); }

/* ── interactive-testing method tabs (API / Sandbox / n8n) ── */
.lf-testtab-row{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; border-bottom:1px solid #e2e8f0; padding-bottom:18px; }
.lf-testtab{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:600; font-size:14px; padding:10px 20px; border-radius:14px; border:1.5px solid #cbd5e1; background:#ffffff; color:#64748b; cursor:pointer; transition:all .2s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
.lf-testtab:hover{ background:#f8fafc; color:#0f172a; border-color:#94a3b8; }
.lf-testtab.is-active{ border-color:#2563eb; background:#eff6ff; color:#2563eb; box-shadow:0 2px 10px rgba(37,99,235,0.12); }

/* ── files (video / pdf / yaml) ── */
.lf-file-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 18px; border-radius:25px; background:#ffffff; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(15,23,42,0.04); max-width:100%; min-width:0; overflow:hidden; }
.lf-file-name{ font-size:14px; font-weight:500; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; flex:1 1 auto; }
.lf-file-remove{ font-size:13px; font-weight:600; color:#dc2626; background:none; border:none; cursor:pointer; flex:0 0 auto; transition:color .2s; margin-left:auto; }
.lf-file-remove:hover{ color:#991b1b; }

/* ── photos ── */
.lf-photo-row{ display:flex; flex-wrap:wrap; gap:10px; }
.lf-photo-thumb{ width:64px; height:64px; border-radius:25px; overflow:hidden; position:relative; border:1px solid #e2e8f0; flex:0 0 auto; box-shadow:0 2px 6px rgba(0,0,0,0.04); }
.lf-photo-thumb img{ width:100%; height:100%; object-fit:cover; }
.lf-photo-remove{ position:absolute; top:3px; right:3px; width:18px; height:18px; border-radius:999px; background:rgba(15,23,42,.7); color:#fff; border:none; font-size:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s; }
.lf-photo-remove:hover{ background:#dc2626; }

.lf-sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

/* ── stepper header ── */
.lf-stepper-bar{ display:flex; align-items:center; gap:12px; padding:0; margin-bottom:10px; }
.lf-step-item{ flex:1; display:flex; align-items:center; gap:12px; padding:10px 16px; border-radius:25px; border:1px solid #e2e8f0; background:#f8fafc; cursor:pointer; transition:all 0.2s ease; text-align:left; }
.lf-step-item.is-active{ background:#eff6ff; border-color:#2563eb; box-shadow:0 2px 10px rgba(37,99,235,0.12); animation:lfStepPop 0.35s ease; }
.lf-step-item.is-complete{ background:#f0fdf4; border-color:#86efac; }
.lf-step-badge{ width:32px; height:32px; border-radius:999px; background:#e2e8f0; color:#475569; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s ease; }
.lf-step-item.is-active .lf-step-badge{ background:#2563eb; color:#ffffff; }
.lf-step-item.is-complete .lf-step-badge{ background:#16a34a; color:#ffffff; }
.lf-step-text{ display:flex; flex-direction:column; }
.lf-step-title{ font-family:var(--font-poppins),'Poppins',sans-serif; font-size:14px; font-weight:600; color:#0f172a; }
.lf-step-item.is-active .lf-step-title{ color:#2563eb; }
.lf-step-sub{ font-size:11px; color:#64748b; }
.lf-step-arrow{ color:#94a3b8; font-size:18px; font-weight:600; }
@keyframes lfStepPop{ 0%{ transform:scale(0.97); opacity:0.7; } 100%{ transform:scale(1); opacity:1; } }
@media(max-width:640px){
  .lf-stepper-bar{ justify-content:center; gap:10px; padding:8px; }
  .lf-step-item{ flex:none; padding:0; border:none; background:none; box-shadow:none !important; }
  .lf-step-text{ display:none; }
  .lf-step-badge{ width:34px; height:34px; }
}

/* ── section 10: agreement checkboxes ── */
.lf-agree{ display:flex; flex-direction:column; gap:14px; padding:8px 4px 0; }
.lf-check-row{ display:flex; align-items:flex-start; gap:12px; cursor:pointer; user-select:none; }
.lf-check-box{ width:24px; height:24px; border-radius:8px; border:2px solid #cbd5e1; background:#ffffff; flex:0 0 auto; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#ffffff; transition:all .2s ease; margin-top:1px; }
.lf-check-box.is-checked{ background:#2563eb; border-color:#2563eb; box-shadow:0 2px 8px rgba(37,99,235,0.3); }
.lf-check-text{ font-family:var(--font-inter),'Inter',sans-serif; font-size:14px; color:#334155; line-height:1.5; }
@media(min-width:1024px){ .lf-check-text{ font-size:15px; } }
.lf-link{ text-decoration:underline; font-weight:600; color:#2563eb; }

/* ── section 11: submit ── */
.lf-submit-row{ display:flex; justify-content:flex-end; padding-top:8px; }
.lf-back-btn{ font-family:var(--font-inter),'Inter',sans-serif; height:40px; padding:0 24px; border-radius:999px; border:1px solid #cbd5e1; background:#ffffff; color:#475569; font-size:14px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all .2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.02); }
.lf-back-btn:hover{ background-color:#dc2626; border-color:#dc2626; color:#ffffff; transform:translateY(-1px); box-shadow:0 4px 14px rgba(220,38,38,0.28); }
.lf-submit-btn{ font-family:var(--font-inter),'Inter',sans-serif; height:40px; padding:0 24px; border-radius:999px; border:none; background:linear-gradient(135deg,#2563eb 0%,#1d4fd0 100%); color:#ffffff; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s ease; box-shadow:0 4px 14px rgba(37,99,235,0.25); display:inline-flex; align-items:center; justify-content:center; }
@media(min-width:1024px){ .lf-submit-btn, .lf-back-btn{ height:40px; padding:0 24px; font-size:14px; } }
.lf-submit-btn:disabled{ background:#cbd5e1; color:#94a3b8; cursor:not-allowed; box-shadow:none; opacity:0.75; transform:none !important; }
.lf-submit-btn:not(:disabled):hover{ transform:translateY(-1px); box-shadow:0 6px 18px rgba(37,99,235,0.35); }

/* ── terms & conditions modal scrollbar ── */
.lf-terms-scroll{ scrollbar-width:thin; scrollbar-color:#94a3b8 #f1f5f9; }
.lf-terms-scroll::-webkit-scrollbar{ width:6px; display:block !important; }
.lf-terms-scroll::-webkit-scrollbar-track{ background:#f1f5f9; border-radius:999px; }
.lf-terms-scroll::-webkit-scrollbar-thumb{ background:#cbd5e1; border-radius:999px; }
.lf-terms-scroll::-webkit-scrollbar-thumb:hover{ background:#94a3b8; }

/* ── modal close button ── */
.lf-modal-close{ width:32px; height:32px; border-radius:999px; background:#f1f5f9; border:none; font-size:15px; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s ease; }
.lf-modal-close:hover{ background:#dc2626 !important; color:#ffffff !important; transform:scale(1.05); }

/* ── submission modal ── */
.lf-modal-overlay{ position:fixed; inset:0; z-index:50; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; }
.lf-modal{ background:#ffffff; border-radius:25px; max-width:440px; width:100%; padding:28px; box-shadow:0 20px 60px rgba(15,23,42,0.25); border:1px solid rgba(255,255,255,0.2); }
.lf-modal h3{ font-family:var(--font-poppins),'Poppins',sans-serif; font-size:17px; font-weight:600; margin:0 0 16px; color:#0f172a; }
.lf-progress-track{ width:100%; height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; margin-bottom:14px; }
.lf-progress-fill{ height:100%; background:#2563eb; transition:width .3s; }
.lf-task-row{ display:flex; align-items:center; justify-content:space-between; font-size:13px; padding:4px 0; }
.lf-task-row span:first-child{ color:#475569; }
.lf-task-done{ color:#16a34a; font-weight:600; }
.lf-task-error{ color:#dc2626; font-weight:600; }
.lf-task-pct{ color:#2563eb; font-weight:600; }
`;
