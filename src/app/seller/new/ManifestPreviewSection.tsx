"use client";

import React, { useState, useEffect, useRef } from "react";
import { renderField, InputField } from "@/app/agent/[id]/TryMeNow";
import { API_BASE } from "@/lib/api-client/config";

interface ManifestPreviewSectionProps {
  yamlFile: File | null;
  yamlName: string;
}

export function ManifestPreviewSection({ yamlFile, yamlName }: ManifestPreviewSectionProps) {
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "active" | "error">("idle");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    mode: "batch" | "server";
    fields?: InputField[];
    previewUrl?: string;
    runId?: string;
    timeoutSeconds?: number;
  } | null>(null);

  // Batch mode test execution state
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testRunning, setTestRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<{ ok: boolean; response?: string; error?: string } | null>(null);

  // Server mode timer state
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number>(90);
  const [serverExpired, setServerExpired] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartPreview = async () => {
    if (!yamlFile) return;

    setPreviewStatus("loading");
    setPreviewError(null);
    setPreviewData(null);
    setTestOutput(null);

    try {
      const text = await yamlFile.text();
      const res = await fetch(`${API_BASE}/api/sandbox/preview-manifest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yamlText: text }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => null);
      }

      if (!res.ok || !data?.ok) {
        setPreviewStatus("error");
        setPreviewError(
          data?.error ||
          (res.status === 404
            ? "Preview endpoint (/api/sandbox/preview-manifest) is not available on this branch."
            : `Server returned error (${res.status} ${res.statusText}).`)
        );
        return;
      }

      setPreviewData(data);
      setPreviewStatus("active");

      if (data.mode === "batch" && data.fields) {
        const initial: Record<string, string> = {};
        data.fields.forEach((f: InputField) => {
          if (f.default) initial[f.name] = f.default;
        });
        setTestValues(initial);
      }

      if (data.mode === "server") {
        const ttl = data.timeoutSeconds || 90;
        setServerSecondsLeft(ttl);
        setServerExpired(false);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setServerSecondsLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              setServerExpired(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e: any) {
      setPreviewStatus("error");
      setPreviewError(e.message || "An unexpected error occurred during preview launch.");
    }
  };

  const handleRunBatchTest = async () => {
    if (!yamlFile) return;

    setTestRunning(true);
    setTestOutput(null);

    try {
      const text = await yamlFile.text();
      const res = await fetch(`${API_BASE}/api/sandbox/preview-run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yamlText: text, inputs: testValues }),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => null);
      }

      if (!res.ok || !data?.ok) {
        setTestOutput({
          ok: false,
          error: data?.error || (res.status === 404 ? "Endpoint /api/sandbox/preview-run not found on this branch." : `Test run failed (${res.status} ${res.statusText}).`),
        });
      } else {
        setTestOutput({ ok: true, response: data.response });
      }
    } catch (e: any) {
      setTestOutput({ ok: false, error: e.message || "Execution error" });
    } finally {
      setTestRunning(false);
    }
  };

  const handleClosePreview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPreviewStatus("idle");
    setPreviewData(null);
    setTestOutput(null);
  };

  return (
    <div
      style={{
        marginTop: 14,
        padding: "20px 24px",
        borderRadius: 25,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02)",
      }}
    >
      <style>{`
        .tmn-field,
        input.tmn-field,
        textarea.tmn-field,
        button.tmn-field {
          font-family: var(--font-poppins), 'Poppins', sans-serif !important;
          border-radius: 14px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #0f172a !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .tmn-field:focus,
        input.tmn-field:focus,
        textarea.tmn-field:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
          outline: none !important;
        }
        .tmn-field::placeholder,
        input.tmn-field::placeholder,
        textarea.tmn-field::placeholder {
          color: #94a3b8 !important;
        }
        textarea.tmn-field {
          min-height: 80px;
          resize: vertical;
        }
        /* CustomSelect trigger button override inside preview */
        div[class*="relative"] > button[class*="cursor-pointer"] {
          background: #ffffff !important;
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 14px !important;
          padding: 12px 16px !important;
          font-family: var(--font-poppins), 'Poppins', sans-serif !important;
          font-size: 14px !important;
          color: #0f172a !important;
        }
        div[class*="relative"] > button[class*="cursor-pointer"]:hover {
          border-color: #2563eb !important;
        }
        div[class*="relative"] > div[class*="absolute"] {
          border-radius: 16px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#0f172a",
              display: "block",
            }}
          >
            Manifest Live Preview
          </span>
          <p
            style={{
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontSize: 13,
              color: "#64748b",
              margin: "2px 0 0",
            }}
          >
            Test your agent&apos;s UI and container before submitting your listing.
          </p>
        </div>
        <div>
          {previewStatus !== "active" ? (
            <button
              type="button"
              onClick={handleStartPreview}
              disabled={previewStatus === "loading"}
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                padding: "0 24px",
                height: 42,
                fontSize: 14,
                fontWeight: 600,
                color: "#ffffff",
                background: previewStatus === "loading" ? "#94a3b8" : "linear-gradient(135deg, #2563eb 0%, #1d4fd0 100%)",
                borderRadius: 999,
                border: "none",
                cursor: previewStatus === "loading" ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: previewStatus === "loading" ? "none" : "0 4px 14px rgba(37,99,235,0.25)",
                transition: "all 0.2s ease",
              }}
            >
              {previewStatus === "loading" ? (
                <>
                  <span className="animate-spin" style={{ display: "inline-block" }}>⚙</span>
                  Launching Preview…
                </>
              ) : (
                <>
                  <span>▶</span> Preview Agent
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClosePreview}
              style={{
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                padding: "0 20px",
                height: 38,
                fontSize: 13,
                fontWeight: 600,
                color: "#475569",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 999,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Close Preview
            </button>
          )}
        </div>
      </div>

      {previewError && (
        <div
          style={{
            marginTop: 14,
            padding: "14px 18px",
            borderRadius: 16,
            background: "#fef2f2",
            border: "1px solid #fca5a5",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", margin: 0 }}>Preview Error</p>
          <p
            style={{
              fontSize: 12,
              color: "#991b1b",
              marginTop: 4,
              marginBottom: 0,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {previewError}
          </p>
        </div>
      )}

      {previewStatus === "active" && previewData && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed #cbd5e1" }}>
          {previewData.mode === "batch" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Form Preview (Batch Mode)
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563eb",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    padding: "4px 12px",
                    borderRadius: 999,
                  }}
                >
                  Client Rendered Form
                </span>
              </div>

              {previewData.fields && previewData.fields.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {previewData.fields.map((f) => (
                    <div key={f.name}>
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
                        {f.label} {f.required && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      {renderField(f, testValues[f.name] || "", (v: string) => setTestValues({ ...testValues, [f.name]: v }))}
                    </div>
                  ))}

                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={handleRunBatchTest}
                      disabled={testRunning}
                      style={{
                        fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                        height: 44,
                        padding: "0 26px",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#ffffff",
                        background: testRunning
                          ? "#94a3b8"
                          : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        borderRadius: 999,
                        border: "none",
                        cursor: testRunning ? "not-allowed" : "pointer",
                        boxShadow: testRunning ? "none" : "0 4px 12px rgba(5,150,105,0.22)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {testRunning ? "Running Test…" : "Run Test with Sample Input"}
                    </button>
                  </div>

                  {testOutput && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "14px 18px",
                        borderRadius: 16,
                        background: testOutput.ok ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${testOutput.ok ? "#86efac" : "#fca5a5"}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: testOutput.ok ? "#15803d" : "#b91c1c",
                          margin: 0,
                        }}
                      >
                        {testOutput.ok ? "✓ Test Output" : "✗ Execution Error"}
                      </p>
                      <pre
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          marginBottom: 0,
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          color: "#1e293b",
                          lineHeight: 1.5,
                        }}
                      >
                        {testOutput.response || testOutput.error}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#64748b" }}>No input fields declared in manifest.</p>
              )}
            </div>
          )}

          {previewData.mode === "server" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Seller Live Preview Fargate Spot
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: serverExpired ? "#dc2626" : "#2563eb",
                    background: serverExpired ? "#fef2f2" : "#eff6ff",
                    border: `1px solid ${serverExpired ? "#fca5a5" : "#bfdbfe"}`,
                    padding: "4px 14px",
                    borderRadius: 999,
                  }}
                >
                  {serverExpired
                    ? "Preview Expired (90s TTL)"
                    : `Time remaining: ${Math.floor(serverSecondsLeft / 60)}:${String(serverSecondsLeft % 60).padStart(2, "0")}`}
                </span>
              </div>

              {serverExpired ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    background: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                    The 90-second preview TTL expired and the container was stopped.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartPreview}
                    style={{
                      marginTop: 12,
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#2563eb",
                      border: "1px solid #93c5fd",
                      borderRadius: 999,
                      background: "#eff6ff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Re-launch Preview
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 440,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
                  }}
                >
                  <iframe
                    src={previewData.previewUrl}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title="Seller Agent Preview"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
