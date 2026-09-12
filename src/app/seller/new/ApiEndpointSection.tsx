"use client";

// API Endpoint Mode configuration for the seller wizard.
//
// Self-contained sub-component for the same reason N8nSandboxSection is one: its
// hooks stay scoped instead of joining the ~400-hook list in step1/page.tsx.
// Visual language (lf-* classes, inline style objects) deliberately matches that
// section so the three execution modes look like one product.
//
// The seller never writes YAML or JSON here — they build fields visually and the
// standardized schema is generated for them. The buyer-side preview uses the
// SAME renderField() the real Try Me Now dialog uses, so what a seller sees here
// is what a buyer gets.

import { useMemo, useState } from "react";
import { useListingForm, type ApiBuilderField } from "./context";
import { renderField, renderOutput, type InputField, type RunOutput } from "@/app/agent/[id]/TryMeNow";
import { API_BASE } from "@/lib/api-client/config";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Yes / No" },
  { value: "file", label: "File" },
];

const OUTPUT_TARGETS = [
  { value: "text", label: "Text" },
  { value: "markdown", label: "Formatted text" },
  { value: "number", label: "Number" },
  { value: "status", label: "Status" },
  { value: "list", label: "List" },
  { value: "json", label: "Raw JSON" },
  { value: "code", label: "Code block" },
  { value: "table", label: "Table" },
  { value: "chart", label: "Chart (Vega-Lite)" },
  { value: "alert", label: "Error / alert" },
];

const AUTH_TYPES = [
  { value: "none", label: "No authentication" },
  { value: "bearer", label: "Bearer token" },
  { value: "header", label: "Custom header" },
  { value: "basic", label: "Basic auth" },
  { value: "query", label: "Query parameter" },
];

const MAX_FIELDS = 15;

type TestState = "idle" | "testing" | "ok" | "error";

const chipStyle = (active: boolean) => ({
  fontFamily: "var(--font-poppins),'Poppins',sans-serif",
  fontSize: 12.5,
  fontWeight: 500,
  padding: "8px 14px",
  borderRadius: 999,
  border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
  background: active ? "#eff6ff" : "#ffffff",
  color: active ? "#2563eb" : "#475569",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const smallBtn = {
  fontFamily: "var(--font-poppins),'Poppins',sans-serif",
  fontSize: 12,
  fontWeight: 500,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#475569",
  cursor: "pointer",
};

function FieldTypeDropdown({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = FIELD_TYPES.find((t) => t.value === value)?.label ?? "Text";

  return (
    <div className={`relative inline-block ${className ?? ""}`} style={{ width: 130, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lf-select w-full flex items-center justify-between text-left"
        style={{ fontSize: 13.5, height: 40, padding: "8px 12px", borderRadius: 12, backgroundImage: "none" }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className={`lf-dd-chevron ${open ? "lf-dd-chevron-open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ color: "#64748b", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-full min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
            {FIELD_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  onChange(t.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                  value === t.value
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{t.label}</span>
                {value === t.value && (
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

function TargetSelectDropdown({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = OUTPUT_TARGETS.find((t) => t.value === value)?.label ?? "Text";

  return (
    <div className={`relative inline-block ${className ?? ""}`} style={{ width: 130, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lf-select w-full flex items-center justify-between text-left"
        style={{ fontSize: 13.5, height: 40, padding: "8px 12px", borderRadius: 12, backgroundImage: "none" }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className={`lf-dd-chevron ${open ? "lf-dd-chevron-open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ color: "#64748b", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-full min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
            {OUTPUT_TARGETS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  onChange(t.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                  value === t.value
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{t.label}</span>
                {value === t.value && (
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

function ResponsePathDropdown({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`} style={{ width: 180, flexShrink: 0, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="lf-select w-full flex items-center justify-between text-left"
        style={{ fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12, backgroundImage: "none" }}
      >
        <span className="truncate">{value || "Select response…"}</span>
        <svg
          className={`lf-dd-chevron ${open ? "lf-dd-chevron-open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ color: "#64748b", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
            {options.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                  value === p
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{p}</span>
                {value === p && (
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

function AuthTypeDropdown({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = AUTH_TYPES.find((t) => t.value === value)?.label ?? "No authentication";

  return (
    <div className={`lf-dd-wrapper relative w-full ${className ?? ""}`} style={{ width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`lf-select-btn ${open ? "is-active" : ""}`}
        style={{
          borderRadius: "25px",
          height: "46px",
          justifyContent: "space-between",
          padding: "0 18px",
          fontSize: "14px",
          fontWeight: 500,
          color: "#0f172a",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          width: "100%",
        }}
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className={`lf-dd-chevron ${open ? "lf-dd-chevron-open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          style={{ color: "#64748b", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
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
            <div className="lf-dd-list" style={{ maxHeight: "240px", overflowY: "auto" }}>
              {AUTH_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    onChange(t.value);
                    setOpen(false);
                  }}
                  className={`lf-dd-item ${value === t.value ? "is-selected" : ""}`}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px" }}
                >
                  <span className="lf-dd-item-name">{t.label}</span>
                  {value === t.value && <span className="lf-dd-item-check" style={{ color: "#2563eb", fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ApiEndpointSection() {
  const { formData, updateField } = useListingForm();
  const [testState, setTestState] = useState<TestState>("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [testMeta, setTestMeta] = useState<{ durationMs?: number; httpStatus?: number } | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  /** Mapped, buyer-facing blocks returned by the test run. */
  const [previewOutputs, setPreviewOutputs] = useState<RunOutput[] | null>(null);
  const [suggested, setSuggested] = useState<{ entries: { source: string; target: string; label?: string }[]; passthrough?: boolean } | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [showRaw, setShowRaw] = useState(false);

  const fields = formData.apiInputSchema;
  const mapping = formData.apiOutputMapping;

  /** Parses one of the raw-JSON text inputs; invalid JSON becomes undefined so the
   *  server-side validator produces the error message rather than the UI guessing. */
  const parseJsonField = (raw: string): Record<string, unknown> | undefined => {
    if (!raw || !raw.trim()) return undefined;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  const buildSession = () =>
    formData.apiSessionEnabled && formData.apiSessionUrl.trim()
      ? {
          url: formData.apiSessionUrl.trim(),
          method: "POST",
          body: parseJsonField(formData.apiSessionBody) ?? {},
          extract: parseJsonField(formData.apiSessionExtract) ?? {},
        }
      : undefined;

  // ── Field builder ──────────────────────────────────────────────────────────

  const addField = () => {
    if (fields.length >= MAX_FIELDS) return;
    updateField("apiInputSchema", [
      ...fields,
      { name: "", label: "", type: "text", required: true } as ApiBuilderField,
    ]);
  };

  const removeField = (index: number) => {
    updateField(
      "apiInputSchema",
      fields.filter((_, i) => i !== index)
    );
  };

  const patchField = (index: number, patch: Partial<ApiBuilderField>) => {
    updateField(
      "apiInputSchema",
      fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  // ── Test Endpoint ──────────────────────────────────────────────────────────
  // Always server-side: this posts the draft config to aiKart, which performs
  // the SSRF checks and calls the seller's API. The browser never touches the
  // seller endpoint directly.

  const runTest = async () => {
    setTestState("testing");
    setTestError(null);
    setTestMeta(null);
    setRawResponse(null);
    setSuggested(null);

    // Sample values so the seller's API receives a realistic, schema-valid body.
    const testInputs: Record<string, string> = {};
    for (const f of fields) {
      if (!f.name) continue;
      if (previewValues[f.name]) {
        testInputs[f.name] = previewValues[f.name];
      } else if (f.type === "email") {
        testInputs[f.name] = "test@example.com";
      } else if (f.type === "number") {
        testInputs[f.name] = "1";
      } else if (f.type === "checkbox") {
        testInputs[f.name] = "true";
      } else if (f.type === "select") {
        testInputs[f.name] = f.options?.[0]?.value ?? "";
      } else {
        testInputs[f.name] = "aiKart test value";
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/api-endpoint/validate`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpointUrl: formData.apiEndpoint,
          method: formData.apiMethod,
          authType: formData.apiAuthType,
          authConfig: formData.apiAuthConfig,
          credential: formData.apiCredential || undefined,
          inputSchema: { fields },
          timeoutMs: formData.apiTimeoutMs,
          responseFormat: formData.apiResponseFormat,
          session: buildSession(),
          staticBody: parseJsonField(formData.apiStaticBody),
          testInputs,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setTestState("ok");
        setTestMeta({ durationMs: data.durationMs, httpStatus: data.httpStatus });
        setRawResponse(data.rawResponse);
        setPreviewOutputs((data.outputs as RunOutput[]) ?? null);
        setSuggested(data.suggestedMapping ?? null);
        updateField("apiSampleResponse", data.rawResponse);
        updateField("apiTested", true);
      } else {
        setTestState("error");
        setTestError(data.error ?? "The test request failed.");
        updateField("apiTested", false);
      }
    } catch {
      setTestState("error");
      setTestError("Network error — could not reach aiKart to run the test.");
    }
  };

  // ── Output mapping ─────────────────────────────────────────────────────────
  // Suggestions are generated from the seller's own sample response and are
  // never applied automatically — the seller has to accept or edit them.

  const applySuggestion = () => {
    if (!suggested) return;
    updateField("apiOutputMapping", suggested);
  };

  const addMappingEntry = () => {
    updateField("apiOutputMapping", {
      ...mapping,
      passthrough: false,
      entries: [...(mapping.entries ?? []), { source: "", target: "text" }],
    });
  };

  const patchMappingEntry = (
    index: number,
    patch: Partial<{
      source: string;
      target: string;
      label: string;
      event: string;
      language: string;
      columnsSource: string;
      rowsSource: string;
    }>
  ) => {
    updateField("apiOutputMapping", {
      ...mapping,
      entries: (mapping.entries ?? []).map((e, i) => (i === index ? { ...e, ...patch } : e)),
    });
  };

  const removeMappingEntry = (index: number) => {
    const entries = (mapping.entries ?? []).filter((_, i) => i !== index);
    updateField("apiOutputMapping", { ...mapping, entries, passthrough: entries.length === 0 });
  };

  // Candidate paths from the sample response, so mapping is a dropdown rather
  // than a field the seller has to remember the exact spelling of.
  const responsePaths = useMemo(() => {
    const sample = rawResponse ?? formData.apiSampleResponse;
    if (!sample || typeof sample !== "object") return [];
    const paths: string[] = [];
    const walk = (value: unknown, prefix: string, depth: number) => {
      if (depth > 3 || paths.length > 60) return;
      if (Array.isArray(value)) {
        if (prefix) paths.push(prefix);
        value.slice(0, 2).forEach((item, i) => walk(item, `${prefix}[${i}]`, depth + 1));
        return;
      }
      if (value !== null && typeof value === "object") {
        for (const key of Object.keys(value as Record<string, unknown>).slice(0, 30)) {
          walk((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key, depth + 1);
        }
        return;
      }
      if (prefix) paths.push(prefix);
    };
    walk(sample, "", 0);
    return paths;
  }, [rawResponse, formData.apiSampleResponse]);

  // Buyer-form preview built from the SAME renderer the live dialog uses.
  const previewFields: InputField[] = fields
    .filter((f) => f.name && f.label)
    .map((f) => ({
      name: f.name,
      label: f.label,
      type: f.type === "checkbox" ? "boolean" : f.type,
      required: f.required,
      options: f.options ?? [],
      default: f.defaultValue,
    }));

  return (
    <div className="lf-textcard">
      <style>{`
        button.lf-select {
          background-image: none !important;
        }
        .lf-label {
          font-family: var(--font-poppins), 'Poppins', sans-serif !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #0f172a !important;
          display: block !important;
        }
        @media (max-width: 768px) {
          .lf-auth-dropdown-mobile {
            display: block !important;
            width: 100% !important;
          }
          .lf-auth-chips-desktop {
            display: none !important;
          }
          .lf-auth-input {
            width: 100% !important;
            max-width: 100% !important;
            height: 46px !important;
            border-radius: 25px !important;
            padding: 0 18px !important;
            font-size: 14px !important;
          }
          .lf-builder-row,
          .lf-mapping-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .lf-builder-name,
          .lf-builder-label,
          .lf-builder-type,
          .lf-builder-type > button,
          .lf-builder-placeholder,
          .lf-builder-help,
          .lf-builder-file-col,
          .lf-mapping-source,
          .lf-mapping-source > button,
          .lf-mapping-target,
          .lf-mapping-target > button,
          .lf-mapping-label,
          .lf-mapping-extra {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            flex: none !important;
          }
          .lf-mapping-remove-desktop,
          .lf-builder-arrows {
            display: none !important;
          }
          .lf-mapping-actions-mobile {
            display: flex !important;
            justify-content: flex-end !important;
            padding-top: 2px !important;
            width: 100% !important;
          }
        }
      `}</style>
      <div>
        <h3 className="lf-heading" style={{ fontSize: 18 }}>
          API Endpoint Mode
        </h3>
        <p className="lf-desc">
          Allow buyers to test your agent while keeping credentials private.
        </p>
      </div>

      <div className="lf-toggle-row" style={{ marginBottom: formData.apiEnabled ? 16 : 0 }}>
        <button
          type="button"
          onClick={() => {
            updateField("apiEnabled", true);
            updateField("tryMeEnabled", false);
            updateField("n8nEnabled", false);
          }}
          className={`lf-toggle ${formData.apiEnabled ? "is-active" : ""}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => updateField("apiEnabled", false)}
          className={`lf-toggle ${!formData.apiEnabled ? "is-active" : ""}`}
        >
          No
        </button>
      </div>

      {formData.apiEnabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* ── 1. Endpoint ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="lf-label">Endpoint URL</label>
            <p className="lf-desc" style={{ fontSize: "12.5px", marginTop: -4 }}>
              Public HTTPS endpoint URL.
            </p>
            <input
              type="url"
              value={formData.apiEndpoint}
              onChange={(e) => {
                updateField("apiEndpoint", e.target.value);
                updateField("apiTested", false);
              }}
              placeholder="https://api.yourproduct.com/v1/run"
              className="lf-input"
              style={{ height: 42, fontSize: 13.5, padding: "8px 14px", borderRadius: 14 }}
            />

            <label className="lf-label" style={{ marginTop: 6 }}>
              HTTP method
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["POST", "GET", "PUT", "PATCH"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateField("apiMethod", m)}
                  style={chipStyle(formData.apiMethod === m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="lf-desc" style={{ fontSize: "12px", marginTop: -2 }}>
              {formData.apiMethod === "GET"
                ? "Buyer inputs sent as query parameters."
                : "Buyer inputs sent as JSON body."}
            </p>
          </div>

          {/* ── 2. Authentication ───────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="lf-label">Authentication</label>
            <p className="lf-desc" style={{ fontSize: "12.5px", marginTop: -4 }}>
              Choose how requests to your endpoint are authenticated.
            </p>
            <div className="lf-auth-dropdown-mobile" style={{ display: "none" }}>
              <AuthTypeDropdown
                value={formData.apiAuthType}
                onChange={(val) => {
                  updateField("apiAuthType", val);
                  updateField("apiTested", false);
                }}
              />
            </div>
            <div className="lf-auth-chips-desktop" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AUTH_TYPES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => {
                    updateField("apiAuthType", a.value);
                    updateField("apiTested", false);
                  }}
                  style={chipStyle(formData.apiAuthType === a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {formData.apiAuthType === "header" && (
              <input
                type="text"
                value={formData.apiAuthConfig.headerName ?? ""}
                onChange={(e) =>
                  updateField("apiAuthConfig", { ...formData.apiAuthConfig, headerName: e.target.value })
                }
                placeholder="X-API-Key"
                className="lf-input lf-auth-input"
                style={{ height: 42, fontSize: 13.5, padding: "8px 14px", borderRadius: 14, maxWidth: 280 }}
              />
            )}
            {formData.apiAuthType === "query" && (
              <input
                type="text"
                value={formData.apiAuthConfig.queryParam ?? ""}
                onChange={(e) =>
                  updateField("apiAuthConfig", { ...formData.apiAuthConfig, queryParam: e.target.value })
                }
                placeholder="api_key"
                className="lf-input lf-auth-input"
                style={{ height: 42, fontSize: 13.5, padding: "8px 14px", borderRadius: 14, maxWidth: 280 }}
              />
            )}
            {formData.apiAuthType === "basic" && (
              <input
                type="text"
                value={formData.apiAuthConfig.username ?? ""}
                onChange={(e) =>
                  updateField("apiAuthConfig", { ...formData.apiAuthConfig, username: e.target.value })
                }
                placeholder="Username"
                className="lf-input lf-auth-input"
                style={{ height: 42, fontSize: 13.5, padding: "8px 14px", borderRadius: 14, maxWidth: 280 }}
              />
            )}

            {formData.apiAuthType !== "none" && (
              <>
                <label className="lf-label" style={{ marginTop: 4 }}>
                  {formData.apiAuthType === "basic" ? "Password" : "API key / token"}
                </label>
                <input
                  type="password"
                  value={formData.apiCredential}
                  onChange={(e) => {
                    updateField("apiCredential", e.target.value);
                    updateField("apiTested", false);
                  }}
                  placeholder="Paste your key, it is encrypted before storage"
                  className="lf-input lf-auth-input"
                  style={{ height: 42, fontSize: 13.5, padding: "8px 14px", borderRadius: 14, maxWidth: 420 }}
                />
                <p className="lf-desc" style={{ fontSize: "12px", marginTop: -2 }}>
                  Encrypted (AES-256) server-side key. Never exposed.
                </p>
              </>
            )}
          </div>

          {/* ── 2b. Response format + session ───────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="lf-label">How does your endpoint respond?</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "json", label: "JSON response" },
                { value: "sse", label: "Event stream (SSE)" },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    updateField("apiResponseFormat", f.value);
                    updateField("apiTested", false);
                  }}
                  style={chipStyle(formData.apiResponseFormat === f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="lf-desc" style={{ fontSize: "12px", marginTop: -2 }}>
              {formData.apiResponseFormat === "sse"
                ? "Streams text/event-stream until COMPLETE event."
                : "Single JSON response body."}
            </p>

            <label className="lf-label" style={{ marginTop: 6 }}>
              Internal request fields{" "}
              <span className="lf-tag" style={{ fontWeight: 400 }}>(optional JSON)</span>
            </label>
            <input
              type="text"
              value={formData.apiStaticBody}
              onChange={(e) => updateField("apiStaticBody", e.target.value)}
              placeholder='e.g. {"engine_name":"sqlite"}'
              className="lf-input"
              style={{ height: 42, fontFamily: "monospace", fontSize: 13, padding: "8px 14px", borderRadius: 14 }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => updateField("apiSessionEnabled", !formData.apiSessionEnabled)}
                style={chipStyle(formData.apiSessionEnabled)}
              >
                {formData.apiSessionEnabled ? "Session request enabled" : "Needs a session request first"}
              </button>
            </div>

            {formData.apiSessionEnabled && (
              <div
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
                <label className="lf-label" style={{ fontSize: 13 }}>Session URL</label>
                <input
                  type="url"
                  value={formData.apiSessionUrl}
                  onChange={(e) => updateField("apiSessionUrl", e.target.value)}
                  placeholder="https://api.yourproduct.com/api/conversations"
                  className="lf-input"
                  style={{ height: 40, fontSize: 13, padding: "8px 12px", borderRadius: 12 }}
                />
                <label className="lf-label" style={{ fontSize: 13 }}>Session request body (JSON)</label>
                <input
                  type="text"
                  value={formData.apiSessionBody}
                  onChange={(e) => updateField("apiSessionBody", e.target.value)}
                  placeholder='{"title":"aiKart Session","engine_name":"sqlite"}'
                  className="lf-input"
                  style={{ height: 40, fontFamily: "monospace", fontSize: 12.5, padding: "8px 12px", borderRadius: 12 }}
                />
                <label className="lf-label" style={{ fontSize: 13 }}>
                  Values to reuse in your endpoint URL (JSON)
                </label>
                <input
                  type="text"
                  value={formData.apiSessionExtract}
                  onChange={(e) => updateField("apiSessionExtract", e.target.value)}
                  placeholder='{"conversation_id":"id"}'
                  className="lf-input"
                  style={{ height: 40, fontFamily: "monospace", fontSize: 12.5, padding: "8px 12px", borderRadius: 12 }}
                />
                <p className="lf-desc" style={{ fontSize: 12, margin: 0 }}>
                  Map session response parameters (e.g. <code style={{ fontFamily: "monospace" }}>{'{"conversation_id":"id"}'}</code>) to endpoint placeholders.
                </p>
              </div>
            )}
          </div>

          {/* ── 3. Input fields (the UI builder) ────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label className="lf-label">
                Input fields{" "}
                <span className="lf-tag" style={{ fontWeight: 400 }}>
                  (max {MAX_FIELDS})
                </span>
              </label>
              {fields.length === 0 && (
                <p className="lf-desc" style={{ fontSize: "12.5px", marginTop: 4 }}>
                  No fields added yet.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {fields.map((f, i) => (
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
                  <div className="lf-builder-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) =>
                        patchField(i, {
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                        })
                      }
                      placeholder="field_name"
                      className="lf-input lf-builder-name"
                      style={{ width: 150, fontFamily: "monospace", fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12 }}
                    />
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => patchField(i, { label: e.target.value })}
                      placeholder="Display label"
                      className="lf-input lf-builder-label"
                      style={{ flex: "1 1 180px", fontSize: 13.5, height: 40, padding: "8px 12px", borderRadius: 12 }}
                    />
                    <FieldTypeDropdown
                      value={f.type}
                      className="lf-builder-type"
                      onChange={(newType) => {
                        if (newType === "file") {
                          patchField(i, {
                            type: "file",
                            name: f.name || "file",
                            label: f.label || "Upload SQL Database",
                            fileType: "sql",
                            allowedExtension: ".sql",
                            maxSizeMb: f.maxSizeMb ?? 5,
                          });
                        } else {
                          patchField(i, { type: newType });
                        }
                      }}
                    />
                  </div>

                  {f.type === "file" ? (
                    <div className="lf-builder-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div className="lf-builder-file-col" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, color: "#64748b" }}>Accepted File Type</label>
                        <input
                          type="text"
                          value={f.fileType?.toUpperCase() ?? "SQL"}
                          readOnly
                          className="lf-input"
                          style={{ fontSize: 13, height: 38, padding: "6px 12px", borderRadius: 10, background: "#f1f5f9", color: "#475569" }}
                        />
                      </div>
                      <div className="lf-builder-file-col" style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, color: "#64748b" }}>Allowed Extension</label>
                        <input
                          type="text"
                          value={f.allowedExtension ?? ".sql"}
                          readOnly
                          className="lf-input"
                          style={{ fontSize: 13, height: 38, padding: "6px 12px", borderRadius: 10, background: "#f1f5f9", color: "#475569" }}
                        />
                      </div>
                      <div className="lf-builder-file-col" style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, color: "#64748b" }}>Maximum Size (MB)</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={f.maxSizeMb ?? 5}
                          onChange={(e) => patchField(i, { maxSizeMb: Math.max(1, parseInt(e.target.value) || 5) })}
                          className="lf-input"
                          style={{ fontSize: 13, height: 38, padding: "6px 12px", borderRadius: 10 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="lf-builder-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          value={f.placeholder ?? ""}
                          onChange={(e) => patchField(i, { placeholder: e.target.value })}
                          placeholder="Placeholder (optional)"
                          className="lf-input lf-builder-placeholder"
                          style={{ flex: "1 1 160px", fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12 }}
                        />
                        <input
                          type="text"
                          value={f.helpText ?? ""}
                          onChange={(e) => patchField(i, { helpText: e.target.value })}
                          placeholder="Help text (optional)"
                          className="lf-input lf-builder-help"
                          style={{ flex: "1 1 160px", fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12 }}
                        />
                      </div>

                      {f.type === "select" && (
                        <input
                          type="text"
                          value={(f.options ?? []).map((o) => o.value).join(", ")}
                          onChange={(e) =>
                            patchField(i, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .map((v) => ({ label: v, value: v })),
                            })
                          }
                          placeholder="Options, comma separated (e.g. Small, Medium, Large)"
                          className="lf-input"
                          style={{ fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12 }}
                        />
                      )}
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => patchField(i, { required: !f.required })}
                      style={chipStyle(f.required)}
                    >
                      {f.required ? "Required" : "Optional"}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      style={{
                        ...smallBtn,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {fields.length < MAX_FIELDS && (
              <button type="button" onClick={addField} className="lf-pillbtn" style={{ alignSelf: "flex-start" }}>
                + Add Field
              </button>
            )}
          </div>

          {/* ── 4. Buyer preview (same renderer as the live dialog) ─────── */}
          {previewFields.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label className="lf-label">What buyers will see</label>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 18,
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {previewFields.map((f) => (
                  <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 13, color: "#6B7280" }}>
                      {f.label}
                      {f.required && <span style={{ color: "#2563EB" }}> *</span>}
                    </label>
                    {renderField(f, previewValues[f.name] ?? "", (v) =>
                      setPreviewValues((prev) => ({ ...prev, [f.name]: v }))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Test endpoint ────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="lf-label">Test your endpoint</label>
            <button
              type="button"
              onClick={runTest}
              disabled={!formData.apiEndpoint || testState === "testing"}
              className="lf-pillbtn"
              style={{
                alignSelf: "flex-start",
                opacity: !formData.apiEndpoint || testState === "testing" ? 0.6 : 1,
                cursor: !formData.apiEndpoint || testState === "testing" ? "not-allowed" : "pointer",
              }}
            >
              {testState === "testing" ? "Testing…" : "Test Endpoint"}
            </button>

            {testState === "ok" && (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  color: "#166534",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                }}
              >
                Success — HTTP {testMeta?.httpStatus} in {testMeta?.durationMs}ms.{" "}
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  style={{ ...smallBtn, marginLeft: 6, padding: "4px 10px" }}
                >
                  {showRaw ? "Hide response" : "View response"}
                </button>
              </div>
            )}
            {testState === "error" && (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                }}
              >
                {testError}
              </div>
            )}
            {previewOutputs && previewOutputs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label className="lf-label" style={{ fontSize: 13 }}>
                  What buyers will see
                </label>
                {/* Rendered with the same renderOutput() the real Try Me Now uses,
                    so this preview cannot drift from the live buyer experience. */}
                {previewOutputs.map((o, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 14,
                      background: "#ffffff",
                    }}
                  >
                    {o.heading && (
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                        {o.heading}
                      </p>
                    )}
                    {renderOutput(o)}
                  </div>
                ))}
              </div>
            )}
            {previewOutputs && previewOutputs.length === 0 && (
              <p className="lf-desc" style={{ fontSize: 12.5, color: "#b45309" }}>
                The call succeeded but your mapping produced nothing to show. Check the response
                paths below.
              </p>
            )}
            {showRaw && rawResponse !== null && (
              <pre
                style={{
                  background: "#0f172a",
                  color: "#e2e8f0",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 12,
                  overflowX: "auto",
                  maxHeight: 260,
                }}
              >
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            )}
          </div>

          {/* ── 6. Output mapping ───────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="lf-label">What buyers see in the result</label>
            <p className="lf-desc" style={{ fontSize: "12.5px", marginTop: -4 }}>
              Map response fields shown to buyers.
            </p>

            {suggested && (suggested.entries?.length ?? 0) > 0 && (
              <div
                style={{
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  aiKart suggested a mapping from your test response ({suggested.entries.length}{" "}
                  field{suggested.entries.length === 1 ? "" : "s"}). Review it before using it.
                </span>
                <button type="button" onClick={applySuggestion} style={{ ...smallBtn, borderColor: "#bfdbfe" }}>
                  Use suggestion
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(mapping.entries ?? []).map((entry, i) => (
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
                  <div className="lf-mapping-row" style={{ display: "flex", gap: 10, alignItems: "center", width: "100%" }}>
                    {responsePaths.length > 0 ? (
                      <ResponsePathDropdown
                        value={entry.source}
                        options={responsePaths}
                        className="lf-mapping-source"
                        onChange={(val) => patchMappingEntry(i, { source: val })}
                      />
                    ) : (
                      <input
                        type="text"
                        value={entry.source}
                        onChange={(e) => patchMappingEntry(i, { source: e.target.value })}
                        placeholder="response.path"
                        className="lf-input lf-mapping-source"
                        style={{ width: 180, flexShrink: 0, fontFamily: "monospace", fontSize: 13, height: 40, padding: "8px 12px", borderRadius: 12, minWidth: 0 }}
                      />
                    )}
                    <input
                      type="text"
                      value={entry.label ?? ""}
                      onChange={(e) => patchMappingEntry(i, { label: e.target.value })}
                      placeholder="Display label (optional)"
                      className="lf-input lf-mapping-label"
                      style={{ flex: "1 1 180px", fontSize: 13.5, height: 40, padding: "8px 12px", borderRadius: 12, minWidth: 0 }}
                    />
                    <TargetSelectDropdown
                      value={entry.target}
                      className="lf-mapping-target"
                      onChange={(val) => patchMappingEntry(i, { target: val })}
                    />
                  </div>

                  {(formData.apiResponseFormat === "sse" || entry.target === "code" || entry.target === "table") && (
                    <div className="lf-mapping-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
                      {formData.apiResponseFormat === "sse" && (
                        <input
                          type="text"
                          value={entry.event ?? ""}
                          onChange={(e) => patchMappingEntry(i, { event: e.target.value.toUpperCase() })}
                          placeholder="Stream event (e.g. COMPLETE)"
                          title="Which stream event this mapping reads (e.g. COMPLETE, SQL, CHART, ERROR)"
                          className="lf-input lf-mapping-extra"
                          style={{ flex: "1 1 160px", fontFamily: "monospace", fontSize: 12.5, height: 40, padding: "8px 12px", borderRadius: 12 }}
                        />
                      )}
                      {entry.target === "code" && (
                        <input
                          type="text"
                          value={entry.language ?? ""}
                          onChange={(e) => patchMappingEntry(i, { language: e.target.value })}
                          placeholder="Language hint (e.g. sql)"
                          title="Syntax highlighting hint"
                          className="lf-input lf-mapping-extra"
                          style={{ flex: "1 1 160px", fontSize: 12.5, height: 40, padding: "8px 12px", borderRadius: 12 }}
                        />
                      )}
                      {entry.target === "table" && (
                        <>
                          <input
                            type="text"
                            value={entry.columnsSource ?? ""}
                            onChange={(e) => patchMappingEntry(i, { columnsSource: e.target.value })}
                            placeholder="columns path (optional)"
                            className="lf-input lf-mapping-extra"
                            style={{ flex: "1 1 160px", fontFamily: "monospace", fontSize: 12.5, height: 40, padding: "8px 12px", borderRadius: 12 }}
                          />
                          <input
                            type="text"
                            value={entry.rowsSource ?? ""}
                            onChange={(e) => patchMappingEntry(i, { rowsSource: e.target.value })}
                            placeholder="rows path (optional)"
                            className="lf-input lf-mapping-extra"
                            style={{ flex: "1 1 160px", fontFamily: "monospace", fontSize: 12.5, height: 40, padding: "8px 12px", borderRadius: 12 }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "100%", marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => removeMappingEntry(i)}
                      style={{
                        ...smallBtn,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#dc2626",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={addMappingEntry} className="lf-pillbtn" style={{ alignSelf: "flex-start" }}>
                + Map a field
              </button>
              <button
                type="button"
                onClick={() =>
                  updateField("apiOutputMapping", {
                    entries: mapping.entries ?? [],
                    passthrough: !mapping.passthrough,
                  })
                }
                style={chipStyle(!!mapping.passthrough)}
              >
                {mapping.passthrough ? "Showing full response" : "Show full response instead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiEndpointSection;
