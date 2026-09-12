"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { trackEvent } from "@/lib/gtag";
import { API_BASE } from "@/lib/api-client/config";

export type InputField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: Array<{ label: string; value: string }>;
  default?: string;
  /** Presentation hints supplied by API Endpoint Mode schemas. */
  placeholder?: string;
  helpText?: string;
};

export type RunOutput = { heading?: string; format?: string; response: string; language?: string };

type SecretField = {
  name: string;
  description?: string;
  required?: boolean;
};

type SchemaResponse = {
  runnable?: boolean;
  mode?: "batch" | "server" | "api";
  port?: number;
  name?: string;
  description?: string | null;
  approxTime?: number | string | null;
  agent_type?: string;
  model?: string;
  version?: string;
  tags?: string[];
  fields?: InputField[];
  secrets?: SecretField[];
  rawYaml?: string;
  error?: string;
  /** API Endpoint Mode: whether the seller's endpoint streams (SSE). */
  streaming?: boolean;
  /** API Endpoint Mode: last observed endpoint health. */
  health?: string;
  /** API Endpoint Mode: whether this agent takes a buyer-uploaded database. */
  upload?: {
    enabled: boolean;
    required?: boolean;
    maxBytes?: number;
    accept?: string;
    connected?: boolean;
    tables?: string[];
    expiresAt?: string | null;
  };
};

export default function TryMeNow({
  endpoint,
  name,
  listingId,
  mode = "direct",
}: {
  /** Base API path for this agent's run endpoint, e.g. "/api/try/{slug}" or "/api/sandbox/{listingId}". */
  endpoint: string;
  name: string;
  listingId?: string;
  /**
   * "direct" (default): POST returns outputs immediately (Docker sandbox / scraped agent).
   * "n8n": POST returns { executionId }; client polls GET /api/n8n/executions/{id}.
   */
  mode?: "direct" | "n8n";
}) {
  // `endpoint` is always a relative path like "/api/sandbox/{id}" — this
  // component now runs on a different origin from the backend, so every
  // fetch below goes through this absolute-ified version instead, with
  // credentials included so the buyer's session cookie is sent cross-origin.
  const absEndpoint = `${API_BASE}${endpoint}`;
  const [open, setOpen] = useState(false);
  const [schemaData, setSchemaData] = useState<SchemaResponse | null>(null);
  const [fields, setFields] = useState<InputField[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [outputs, setOutputs] = useState<RunOutput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedYaml, setCopiedYaml] = useState(false);

  // Server-mode live preview state
  const [serverRunUrl, setServerRunUrl] = useState<string | null>(null);
  const [serverRunId, setServerRunId] = useState<string | null>(null);
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number>(300);
  const [serverExpired, setServerExpired] = useState<boolean>(false);
  const serverTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buyer SQL upload state (API Endpoint Mode agents that take a database)
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbTables, setDbTables] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // n8n async polling state
  const [n8nStep, setN8nStep] = useState<"sending" | "waiting" | null>(null);
  const n8nPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n8nTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup polling & timers on unmount
  useEffect(() => {
    return () => {
      if (n8nPollRef.current) clearInterval(n8nPollRef.current);
      if (n8nTimeoutRef.current) clearTimeout(n8nTimeoutRef.current);
      if (serverTimerRef.current) clearInterval(serverTimerRef.current);
    };
  }, []);

  // Prevent background scrolling when sandbox modal is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, running]);

  // Chat mode state
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "agent"; text: string; format?: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const isServerMode = process.env.NEXT_PUBLIC_SANDBOX_SERVER_MODE_ENABLED === "true" && schemaData?.mode === "server";

  // Load the form schema the first time the dialog opens.
  useEffect(() => {
    if (!open || fields !== null) return;
    setLoadingSchema(true);
    fetch(absEndpoint, { credentials: "include" })
      .then((r) => r.json())
      .then((d: SchemaResponse) => {
        setSchemaData(d);
        setFields(d.fields ?? []);
        // A database this buyer connected earlier is still live — reflect it so
        // they are not asked to upload again.
        if (d.upload?.connected) {
          setDbConnected(true);
          setDbTables(d.upload.tables ?? []);
        }
        // Pre-populate default values if any
        if (d.fields) {
          const initial: Record<string, string> = {};
          d.fields.forEach((f) => {
            if (f.default) initial[f.name] = f.default;
          });
          if (Object.keys(initial).length > 0) {
            setValues((prev) => ({ ...initial, ...prev }));
          }
        }
      })
      .catch(() => setError("Couldn't load this agent's inputs."))
      .finally(() => setLoadingSchema(false));
  }, [open, fields, endpoint]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatMessages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, running]);

  const isChatAgent =
    schemaData?.agent_type === "chat" ||
    schemaData?.agent_type === "conversational" ||
    (fields !== null &&
      fields.length === 1 &&
      (fields[0].name.toLowerCase().includes("message") ||
        fields[0].name.toLowerCase().includes("prompt") ||
        fields[0].name.toLowerCase().includes("chat")));

  async function executeRun(customInputs?: Record<string, string>) {
    if (listingId) {
      trackEvent('try_me_click', { listing_id: listingId });
    }
    const payloadInputs = customInputs ?? values;
    setRunning(true);
    setHasRun(true);
    setError(null);
    if (!isChatAgent) {
      setOutputs(null);
    }

    // ── n8n async path ────────────────────────────────────────────────────────
    if (mode === "n8n") {
      setN8nStep("sending");
      try {
        const res = await fetch(absEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ inputs: payloadInputs }),
        });
        const data = await res.json();
        if (!res.ok || !data.executionId) {
          const map: Record<string, string> = {
            unauthorized: "Please sign in to run this agent.",
            rate_limited: "Too many requests. Please wait a moment and try again.",
            not_available: "This workflow is not currently available.",
          };
          setError(map[data.error] ?? "Could not start the workflow. Please try again.");
          setRunning(false);
          setN8nStep(null);
          return;
        }
        const executionId = data.executionId as string;
        setN8nStep("waiting");

        // Poll every 2.5 seconds for up to 120 seconds
        const pollStart = Date.now();
        n8nPollRef.current = setInterval(async () => {
          if (Date.now() - pollStart > 120_000) {
            clearInterval(n8nPollRef.current!);
            setError("The workflow took too long to respond. Please try again.");
            setRunning(false);
            setN8nStep(null);
            return;
          }
          try {
            const pollRes = await fetch(`${API_BASE}/api/n8n/executions/${executionId}`, { credentials: "include" });
            const pollData = await pollRes.json();
            if (pollData.status === "done") {
              clearInterval(n8nPollRef.current!);
              setOutputs([{ format: pollData.result?.format ?? "text", response: pollData.result?.response ?? "" }]);
              setRunning(false);
              setN8nStep(null);
            } else if (pollData.status === "error") {
              clearInterval(n8nPollRef.current!);
              setError(pollData.error ?? "The workflow returned an error.");
              setRunning(false);
              setN8nStep(null);
            }
            // "pending" → keep polling
          } catch {
            // network error during poll — keep trying until timeout
          }
        }, 2500);
      } catch {
        setError("Network error. Please try again.");
        setRunning(false);
        setN8nStep(null);
      }
      return; // n8n path done — rest of function is direct mode only
    }

    // ── Server-mode live preview path ──────────────────────────────────────────
    if (isServerMode) {
      try {
        const res = await fetch(absEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ secrets: secretValues }),
        });
        const data = await res.json();
        if (!res.ok || !data.previewUrl) {
          const errMsg = data.detail ? `Sandbox error: ${data.detail}` : "Could not launch live preview server.";
          setError(errMsg);
          setRunning(false);
          return;
        }

        setServerRunUrl(data.previewUrl);
        setServerRunId(data.runId);
        const ttl = data.timeoutSeconds ?? 300;
        setServerSecondsLeft(ttl);
        setServerExpired(false);

        if (serverTimerRef.current) clearInterval(serverTimerRef.current);
        serverTimerRef.current = setInterval(() => {
          setServerSecondsLeft((prev) => {
            if (prev <= 1) {
              if (serverTimerRef.current) clearInterval(serverTimerRef.current);
              setServerExpired(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch {
        setError("Network error starting live server preview. Please try again.");
      } finally {
        setRunning(false);
      }
      return;
    }

    // ── Direct path (Docker sandbox / scraped agent) ───────────────────────────
    try {
      const res = await fetch(absEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs: payloadInputs, secrets: secretValues }),
      });
      const data = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = {
          scraped_agent_timeout: "The agent took too long to respond. Please try again.",
          unauthorized: "Please sign in to run this agent.",
          scraped_agent_unauthorized: "There was an error from the AI agent publisher's end (ERROR 404). Please try again later.",
          scraped_agent_no_output: "The agent finished but returned no output. Try different input.",
          not_runnable: "This agent can't be run here yet.",
          run_failed: data.detail ? `Sandbox error: ${data.detail}` : "The sandbox failed to run. Please try again.",
        };
        const errMsg = map[data.error] ?? `Something went wrong (${data.error ?? res.status}). Please try again.`;
        setError(errMsg);
        if (isChatAgent) {
          setChatMessages((prev) => [
            ...prev,
            { sender: "agent", text: `Error: ${errMsg}` },
          ]);
        }
      } else {
        const resultOutputs: RunOutput[] = data.outputs ?? [];
        setOutputs(resultOutputs);
        if (isChatAgent && resultOutputs.length > 0) {
          resultOutputs.forEach((o) => {
            setChatMessages((prev) => [
              ...prev,
              { sender: "agent", text: o.response, format: o.format },
            ]);
          });
        }
      }
    } catch {
      const netErr = "Network error. Please try again.";
      setError(netErr);
      if (isChatAgent) {
        setChatMessages((prev) => [
          ...prev,
          { sender: "agent", text: `Error: ${netErr}` },
        ]);
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleUpload(file: File) {
    if (!listingId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      // The browser uploads only to aiKart. It never learns the seller's upload
      // URL, and it does not choose a connection name — the server does both.
      const res = await fetch(`${API_BASE}/api/agent-api/${listingId}/upload`, { method: "POST", credentials: "include", body });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.detail ?? "That database could not be uploaded. Please try again.");
      } else {
        setDbConnected(true);
        setDbTables(data.tables ?? []);
      }
    } catch {
      setUploadError("Network error while uploading. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSendChat() {
    if (!chatInput.trim() || running) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: msg }]);

    const chatFieldName = fields && fields.length > 0 ? fields[0].name : "message";
    const newInputs = { ...values, [chatFieldName]: msg };
    setValues(newInputs);
    executeRun(newInputs);
  }

  // An agent that requires an uploaded database cannot run until this buyer has
  // connected one. Agents without upload support are unaffected.
  const uploadSatisfied = !schemaData?.upload?.enabled || !schemaData.upload.required || dbConnected;

  const canRun =
    fields != null &&
    uploadSatisfied &&
    fields.every((f) => !f.required || (values[f.name] ?? "").trim().length > 0);

  // Generate fallback YAML config if rawYaml is not provided
  const yamlContent =
    schemaData?.rawYaml ||
    `apiVersion: aikart.dev/v1
kind: AgentManifest
metadata:
  name: ${schemaData?.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "agent"}
  displayName: "${name}"
runtime:
  type: docker
  image: "aikart/runtime-${schemaData?.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "agent"}:v1"
resources:
  cpu: 1
  memoryMb: 1024
  timeoutSeconds: ${schemaData?.approxTime || 60}
inputs:
${(fields ?? [])
  .map(
    (f) => `  - name: "${f.name}"
    label: "${f.label}"
    type: "${f.type}"
    required: ${f.required}`
  )
  .join("\n") || '  - name: "input"\n    label: "Prompt"\n    type: "text"\n    required: true'}
output:
  format: "markdown"`;

  function copyYamlToClipboard() {
    navigator.clipboard.writeText(yamlContent);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tmn-trigger{ background:#2563eb; color:#ffffff; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .tmn-trigger:hover{ background:#1d4ed8; }
        .tmn-field{ border-radius:14px; border:1px solid #e2e8f0; background:#ffffff; padding:12px 16px; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); outline:none; font-family:var(--font-poppins), 'Poppins', sans-serif; }
        .tmn-field:hover{ border-color:#cbd5e1; }
        .tmn-field:focus{ border-color:#2563eb; outline:none; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
        .tmn-markdown h1 { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 12px; }
        .tmn-markdown h2 { font-size: 17px; font-weight: 600; color: #1D4ED8; margin-bottom: 8px; }
        .tmn-markdown h3 { font-size: 15px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .tmn-markdown h4 { font-size: 14px; font-weight: 500; color: #6B7280; }
        .tmn-markdown strong, .tmn-markdown b { font-weight: 600; color: #111827; }
        .tmn-markdown blockquote { border-left: 3px solid #2563EB; padding-left: 12px; color: #6B7280; font-style: italic; }
        .tmn-markdown hr { border-color: #E5E7EB; margin: 16px 0; }
        .tmn-markdown ul { list-style-type: disc; padding-left: 20px; margin-bottom: 4px; }
        .tmn-markdown ol { list-style-type: decimal; padding-left: 20px; margin-bottom: 4px; }
        .tmn-markdown li { margin-bottom: 4px; }
        .tmn-markdown p { margin-bottom: 8px; line-height: 1.6; }
        .tmn-markdown p:last-child { margin-bottom: 0; }
        .tmn-scroll {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        .tmn-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .tmn-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .tmn-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 9999px;
        }
        .tmn-scroll::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `,
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (listingId) {
            trackEvent('try_me_click', { listing_id: listingId });
          }
          setOpen(true);
        }}
        className="tmn-trigger w-full py-[14px] px-8 rounded-full text-white font-normal text-base hover:bg-[#1d4ed8] transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">play_arrow</span>
        <span>Try Live Sandbox</span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overscroll-contain"
            onClick={() => !running && setOpen(false)}
          >
            <div
              style={{
                borderRadius: "24px",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              }}
              className="bg-white w-[92vw] sm:w-[90vw] max-w-[1080px] max-h-[88vh] overflow-y-auto relative flex flex-col p-6 sm:p-8 tmn-scroll scroll-smooth overscroll-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-5">
                {/* ─── 1. HEADER ─── */}
                <div className="flex items-start justify-between gap-4 pb-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-medium text-[#111827] tracking-tight">{name}</h2>
                    <p className="text-xs sm:text-sm font-normal text-[#6B7280] mt-1 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span>Runs live on aiKart</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !running && setOpen(false)}
                    className="ak-btn-exit"
                    aria-label="Exit"
                  >
                    Exit
                  </button>
                </div>
                {/* ─── 2. INFO BANNER ─── */}
                <div
                  className="flex items-start gap-3 rounded-2xl bg-[#EFF6FF] border border-blue-100/80 p-4"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p className="text-xs font-normal text-[#2563EB] leading-relaxed">
                    Try Me runs on infrastructure provided by the publisher. For any errors or data issues, please contact the provider directly.
                  </p>
                </div>

                {/* ─── AGENT INFO BADGES (TOP) ─── */}
                <div
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="material-symbols-outlined text-base text-[#2563EB]">info</span>
                    <h4 className="text-xs sm:text-sm font-medium text-[#111827]">Agent Info</h4>
                  </div>
                  <div className="flex flex-wrap items-center sm:justify-end gap-2">
                    <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      {/* This label used to be hardcoded to "Docker", so an API
                          Endpoint listing claimed a Docker sandbox it never used.
                          It now reflects how the agent actually executes. */}
                      {schemaData?.mode === "api"
                        ? "Runtime: API Endpoint"
                        : `Runtime: Docker${schemaData?.mode === "server" ? " (Server Mode)" : ""}`}
                    </span>
                    {schemaData?.mode === "api" && schemaData?.streaming && (
                      <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Streaming: SSE
                      </span>
                    )}
                    {schemaData?.mode === "server" && schemaData?.port && (
                      <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Port: {schemaData.port}
                      </span>
                    )}
                    {schemaData?.approxTime && (
                      <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Timeout: {schemaData.mode === "server" ? "300s" : `${schemaData.approxTime}s`}
                      </span>
                    )}
                    {schemaData?.model && (
                      <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Model: {schemaData.model}
                      </span>
                    )}
                    {schemaData?.version && (
                      <span className="bg-[#EFF6FF] text-[#2563EB] rounded-full px-3.5 py-1 text-xs font-medium border border-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        Version: {schemaData.version}
                      </span>
                    )}
                    {(schemaData?.tags ?? []).map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-[#4B5563] rounded-full px-3.5 py-1 text-xs font-medium border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Loading state for schema */}
                {loadingSchema && (
                  <div className="flex items-center gap-3 py-12 justify-center text-[#6B7280] font-normal text-sm">
                    <span className="material-symbols-outlined animate-spin text-[#2563EB]">progress_activity</span>
                    Loading sandbox configuration…
                  </div>
                )}

                {/* ─── SERVER-MODE LIVE PREVIEW UI ─── */}
                {!loadingSchema && isServerMode && (
                  <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Launch state */}
                    {!serverRunUrl && !running && !serverExpired && (
                      <div className="flex flex-col items-center justify-center p-8 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] text-center gap-4 my-auto">
                        <span className="material-symbols-outlined text-4xl text-[#2563EB]">desktop_windows</span>
                        <div>
                          <h3 className="text-base font-semibold text-[#111827]">Live Server Preview</h3>
                          <p className="text-sm text-[#6B7280] max-w-md mt-1">
                            This agent runs a live HTTP server. Launch the container to view the interactive web UI inside a secure sandbox frame.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => executeRun()}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-3 rounded-full text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">play_arrow</span>
                          <span>Launch Live Sandbox</span>
                        </button>
                      </div>
                    )}

                    {/* Launching / Cold Start progress */}
                    {running && (
                      <div className="flex flex-col items-center justify-center p-12 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] text-center gap-3 my-auto animate-pulse">
                        <span className="material-symbols-outlined text-3xl animate-spin text-[#2563EB]">
                          progress_activity
                        </span>
                        <h4 className="text-sm font-medium text-[#111827]">Launching Sandbox Container…</h4>
                        <p className="text-xs text-[#6B7280] max-w-sm">
                          Starting Fargate task and probing HTTP server port... This usually takes ~15–30 seconds.
                        </p>
                      </div>
                    )}

                    {/* Active iframe live preview + countdown */}
                    {serverRunUrl && !serverExpired && (
                      <div className="flex flex-col gap-3 flex-1 min-h-0">
                        <div className="flex items-center justify-between bg-[#EFF6FF] border border-blue-200 rounded-xl px-4 py-2 text-xs text-[#2563EB]">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            Live Preview Active
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="material-symbols-outlined text-sm">timer</span>
                            <span>
                              Expires in {Math.floor(serverSecondsLeft / 60)}:
                              {(serverSecondsLeft % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white shadow-inner">
                          <iframe
                            src={serverRunUrl}
                            sandbox="allow-scripts allow-forms allow-popups"
                            className="w-full h-full border-none rounded-2xl"
                            title={`${name} Live Preview`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expired state */}
                    {serverExpired && (
                      <div className="flex flex-col items-center justify-center p-8 bg-[#FEF2F2] rounded-2xl border border-red-200 text-center gap-3 my-auto">
                        <span className="material-symbols-outlined text-4xl text-red-500">timer_off</span>
                        <h4 className="text-base font-semibold text-[#111827]">Preview Session Expired</h4>
                        <p className="text-xs text-[#6B7280] max-w-md">
                          The 300-second live preview time limit has been reached and the container task was stopped.
                        </p>
                        <button
                          type="button"
                          onClick={() => executeRun()}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 rounded-full text-xs font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer mt-1"
                        >
                          <span className="material-symbols-outlined text-sm">replay</span>
                          <span>Launch New Session</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── UPLOAD GATE (API Endpoint agents that take a database) ─── */}
                {!loadingSchema && schemaData?.upload?.enabled && (
                  <div
                    style={{ borderRadius: "16px", padding: "18px 20px" }}
                    className={`border ${dbConnected ? "bg-[#F0FDF4] border-green-200" : "bg-[#F8F9FA] border-[#E5E7EB]"}`}
                  >
                    {dbConnected ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[#166534] text-sm font-medium">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Database connected</span>
                        </div>
                        {dbTables.length > 0 && (
                          <p className="text-xs text-[#6B7280]">
                            Tables: {dbTables.slice(0, 12).join(", ")}
                            {dbTables.length > 12 ? ` +${dbTables.length - 12} more` : ""}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="self-start text-xs text-[#2563EB] hover:underline cursor-pointer mt-0.5"
                        >
                          Replace database
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#2563EB]">database</span>
                          <h4 className="text-sm font-medium text-[#111827]">Connect your database</h4>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                          Upload a .sql export to ask questions about your own data. Your database is
                          private to you and is removed automatically after
                          {schemaData?.upload?.expiresAt ? " your session expires." : " 24 hours."}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="self-start bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white px-5 py-2.5 rounded-full text-sm font-normal flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {uploading ? "progress_activity" : "upload_file"}
                          </span>
                          <span>{uploading ? "Uploading…" : "Upload SQL Database"}</span>
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={schemaData?.upload?.accept ?? ".sql"}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(file);
                      }}
                    />

                    {uploadError && (
                      <p className="text-xs text-[#EF4444] mt-2.5 whitespace-pre-wrap">{uploadError}</p>
                    )}
                  </div>
                )}

                {/* ─── 3. DYNAMIC INPUT FIELDS OR CHAT THREAD (BATCH MODE) ─── */}
                {!loadingSchema && !isServerMode && fields && (
                  <div className="flex flex-col gap-6">
                    {isChatAgent ? (
                      /* CHAT MODE */
                      <div className="flex flex-col gap-4">
                        <div
                          className="flex flex-col gap-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl p-5 min-h-[220px] max-h-[320px] overflow-y-auto tmn-scroll scroll-smooth"
                        >
                          {chatMessages.length === 0 && (
                            <p className="text-xs font-normal text-[#6B7280] text-center my-auto py-8">
                              Start the conversation below to test this conversational agent live.
                            </p>
                          )}
                          {chatMessages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col ${
                                msg.sender === "user" ? "items-end" : "items-start"
                              }`}
                            >
                              <div
                                style={{ borderRadius: "16px" }}
                                className={`px-4 py-3 max-w-[80%] text-sm font-normal leading-relaxed ${
                                  msg.sender === "user"
                                    ? "bg-[#2563EB] text-white self-end"
                                    : "bg-[#F8F9FA] border border-[#E5E7EB] text-[#111827] self-start"
                                }`}
                              >
                                {msg.sender === "agent" && msg.format ? (
                                  renderOutput({ response: msg.text, format: msg.format })
                                ) : (
                                  <span className="whitespace-pre-wrap">{msg.text}</span>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Loading indicator in chat thread */}
                          {running && (
                            <div
                              style={{ borderRadius: "16px", padding: "16px" }}
                              className="self-start bg-[#F8F9FA] border border-[#E5E7EB] space-y-2 max-w-[70%] animate-pulse"
                            >
                              <div className="h-3 bg-gray-200 rounded-full w-48" />
                              <div className="h-3 bg-gray-200 rounded-full w-32" />
                              <p className="text-xs font-normal text-[#6B7280] pt-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs animate-spin text-[#2563EB]">
                                  progress_activity
                                </span>
                                Running agent...
                              </p>
                            </div>
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Pinned Chat Input Bar */}
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={chatInput}
                            disabled={running}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat();
                              }
                            }}
                            placeholder="Type your message…"
                            className="tmn-field flex-1 text-sm font-normal text-[#111827] placeholder-[#6B7280]"
                          />
                          <button
                            type="button"
                            onClick={handleSendChat}
                            disabled={running || !chatInput.trim()}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-[14px] rounded-full text-sm font-normal transition-all duration-200 ease-in-out flex items-center gap-2 cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">send</span>
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* FORM MODE — Chatbot-style UI */
                      <div className="flex flex-col gap-5">
                        {/* 1. Compact Pill Selectors (Dropdowns: Persona, Model, etc.) */}
                        {fields.filter((f) => f.type === "select" || (f.options && f.options.length > 0)).length > 0 && (
                          <div className="flex flex-wrap items-center gap-3 bg-[#F8F9FA] p-3.5 rounded-2xl border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                            {fields
                              .filter((f) => f.type === "select" || (f.options && f.options.length > 0))
                              .map((f) => (
                                <div key={f.name} className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[#6B7280]">{f.label}:</span>
                                  <CustomSelect
                                    options={f.options}
                                    value={values[f.name] ?? f.default ?? ""}
                                    onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
                                    placeholder={`Select ${f.label}…`}
                                    isPill
                                  />
                                </div>
                              ))}
                          </div>
                        )}

                        {/* 2. Other non-prompt, non-select fields if any */}
                        {fields
                          .filter(
                            (f) =>
                              f.type !== "select" &&
                              (!f.options || f.options.length === 0) &&
                              f.type !== "textarea" &&
                              f.type !== "text" &&
                              f.type !== "list"
                          )
                          .map((f) => (
                            <div key={f.name} className="flex flex-col gap-2">
                              <label className="block text-sm font-normal text-[#6B7280]">
                                {f.label}
                                {f.required && <span className="text-[#2563EB]"> *</span>}
                              </label>
                              {renderField(f, values[f.name] ?? "", (v) =>
                                setValues((prev) => ({ ...prev, [f.name]: v }))
                              )}
                            </div>
                          ))}

                        {/* 3. Chatbot-style Input Box for Task / Prompt / Query */}
                        {!outputs && (
                          <div className="relative w-full rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 pb-14 focus-within:border-[#2563EB] focus-within:bg-white focus-within:shadow-[0_8px_30px_rgb(37,99,235,0.08)] focus-within:ring-4 focus-within:ring-[#2563EB]/10 transition-all duration-200 ease-in-out">
                            {(() => {
                              const promptField =
                                fields.find(
                                  (f) =>
                                    f.type === "textarea" ||
                                    f.type === "text" ||
                                    f.type === "list" ||
                                    f.name.toLowerCase().includes("prompt") ||
                                    f.name.toLowerCase().includes("query") ||
                                    f.name.toLowerCase().includes("task")
                                ) || fields[0];

                              return (
                                <>
                                  <textarea
                                    rows={4}
                                    value={values[promptField.name] ?? ""}
                                    disabled={running}
                                    onChange={(e) =>
                                      setValues((prev) => ({ ...prev, [promptField.name]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (canRun && !running) executeRun();
                                      }
                                    }}
                                    placeholder="Ask anything or describe your task..."
                                    className="w-full bg-transparent text-sm font-normal text-[#111827] placeholder-[#9CA3AF] outline-none border-none resize-none tmn-scroll scroll-smooth leading-relaxed"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => executeRun()}
                                    disabled={!canRun || running}
                                    className="absolute bottom-3 right-3 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-95"
                                  >
                                    {running ? (
                                      <>
                                        <span className="material-symbols-outlined animate-spin text-base">
                                          progress_activity
                                        </span>
                                        <span>Running…</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Send</span>
                                        <span className="material-symbols-outlined text-base">send</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {error && <p className="text-sm font-normal text-[#EF4444]">{error}</p>}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 8. LOADING STATE (FOR FORM MODE) ─── */}
                {running && !isChatAgent && (
                  <div
                    style={{ borderRadius: "16px", padding: "20px" }}
                    className="space-y-3 bg-[#F8F9FA] border border-[#E5E7EB] animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-full w-5/6" />
                    <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                    <div className="flex items-center gap-2 text-sm font-normal text-[#6B7280] pt-2">
                      <span className="material-symbols-outlined text-base animate-spin text-[#2563EB]">
                        progress_activity
                      </span>
                      {/* n8n mode shows step progress; direct mode shows generic spinner */}
                      {mode === "n8n" ? (
                        <span>
                          {n8nStep === "sending" ? (
                            <>Sending to workflow<span className="inline-block animate-pulse">...</span></>
                          ) : (
                            <>Waiting for result<span className="inline-block animate-pulse">...</span></>
                          )}
                        </span>
                      ) : (
                        <span>
                          Running agent<span className="inline-block animate-pulse">...</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── 5. OUTPUT AREA (FOR FORM MODE) ─── */}
                {!isChatAgent && outputs && (
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-normal text-[#6B7280]">Agent Output</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setOutputs(null);
                          setError(null);
                          setHasRun(false);
                        }}
                        className="text-xs font-normal text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">replay</span>
                        Reset Inputs
                      </button>
                    </div>

                    {/* Output Content Area */}
                    <div className="space-y-4">
                      {outputs.map((o, i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: "16px",
                            padding: "24px",
                            backgroundColor: "#ffffff",
                            border: "1px solid #E5E7EB",
                            fontSize: "14px",
                            color: "#111827",
                          }}
                          className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 text-sm text-[#111827]"
                        >
                          {o.heading && <p className="font-semibold text-[#111827] mb-2">{o.heading}</p>}
                          {renderOutput(o)}
                        </div>
                      ))}
                    </div>

                    {/* Edge-to-edge sticky backdrop for Run Again button */}
                    <div className="sticky bottom-0 z-10 pt-4 pb-1 bg-white -mx-5 px-5 sm:-mx-10 sm:px-10 mt-2">
                      <button
                        type="button"
                        onClick={() => executeRun()}
                        disabled={running}
                        className="w-full py-[14px] px-8 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-normal text-base transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">replay</span>
                        <span>Run Again</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── 7. EXTRA INFO BOXES (BOTTOM OF PANEL) ─── */}
                {schemaData?.secrets && schemaData.secrets.length > 0 && (
                  <div className="flex flex-col gap-6 pt-2">
                    {/* API Keys & Credentials Box */}
                    <div
                      style={{ borderRadius: "16px", padding: "20px" }}
                      className="bg-[#F8F9FA] border border-[#E5E7EB] space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#2563EB]">key</span>
                        <h4 className="text-sm font-normal text-[#111827]">API Keys & Credentials</h4>
                      </div>
                      <p className="text-xs font-normal text-[#6B7280]">
                        Optional credentials for live execution. Stored only in session memory.
                      </p>
                      <div className="space-y-4 pt-1">
                        {schemaData.secrets.map((s) => {
                          const sName = s.name.toUpperCase();
                          const isEmailKey =
                            sName.includes("EMAIL") ||
                            sName.includes("MAIL") ||
                            sName === "MY_EMAIL" ||
                            sName === "EMAIL_PASSWORD" ||
                            sName === "EMAIL_PASS";

                          if (isEmailKey) {
                            return (
                              <div key={s.name} className="flex flex-col gap-1.5">
                                <label className="block text-xs font-normal text-[#6B7280]">
                                  {s.name}
                                  {s.required && <span className="text-[#2563EB]"> *</span>}
                                  {s.description && (
                                    <span className="text-[#9CA3AF]"> ({s.description})</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-2.5 text-xs text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-3.5 font-medium leading-snug">
                                  <span className="material-symbols-outlined text-base text-blue-600 shrink-0">lock</span>
                                  <span>AiKart wont show your sandbox as email is needed due to our Terms and Condition</span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={s.name} className="flex flex-col gap-1.5">
                              <label className="block text-xs font-normal text-[#6B7280]">
                                {s.name}
                                {s.required && <span className="text-[#2563EB]"> *</span>}
                                {s.description && (
                                  <span className="text-[#9CA3AF]"> ({s.description})</span>
                                )}
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  type={visibleSecrets[s.name] ? "text" : "password"}
                                  value={secretValues[s.name] ?? ""}
                                  onChange={(e) =>
                                    setSecretValues((prev) => ({
                                      ...prev,
                                      [s.name]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Enter ${s.name}…`}
                                  className="tmn-field w-full pr-10 text-xs font-normal text-[#111827]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisibleSecrets((prev) => ({
                                      ...prev,
                                      [s.name]: !prev[s.name],
                                    }))
                                  }
                                  className="absolute right-4 text-[#6B7280] hover:text-[#111827] p-1 flex items-center cursor-pointer"
                                  aria-label="Toggle secret visibility"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {visibleSecrets[s.name] ? "visibility_off" : "visibility"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  {/* YAML Config Code Box — hidden from UI */}
                  <div
                    style={{
                      display: "none",
                      borderRadius: "16px",
                      padding: "20px",
                    }}
                    className="bg-[#1E293B] text-[#E2E8F0] font-mono text-xs border border-slate-700 space-y-3"
                  >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                        <span className="text-[#94A3B8] text-[11px] font-normal uppercase tracking-wider">
                          manifest.yaml
                        </span>
                        <button
                          type="button"
                          onClick={copyYamlToClipboard}
                          className="bg-slate-700/80 hover:bg-slate-600 text-white rounded-full px-3.5 py-1 text-[11px] font-normal transition-all duration-200 ease-in-out flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {copiedYaml ? "check" : "content_copy"}
                          </span>
                          <span>{copiedYaml ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto overflow-x-auto">
                        <pre className="text-[#E2E8F0] leading-relaxed whitespace-pre font-mono text-xs">
                          {yamlContent}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Renders a Vega-Lite spec inside a fully isolated iframe.
 *
 * sandbox="allow-scripts" WITHOUT allow-same-origin puts the frame on an opaque
 * origin: the chart script can draw, but it cannot read aiKart's DOM, cookies or
 * storage. The spec itself comes from the seller and is therefore untrusted, so
 * it is injected as JSON.parse of a JSON-encoded string rather than interpolated
 * as executable JavaScript.
 */
function ChartOutput({ spec, title }: { spec: string; title?: string }) {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#fff}
#c{padding:8px}#e{padding:16px;color:#6B7280;font-size:13px}</style></head>
<body><div id="c"></div><div id="e" style="display:none">Chart could not be displayed.</div>
<script>
try {
  var spec = JSON.parse(${JSON.stringify(spec)});
  vegaEmbed('#c', spec, {actions:false, renderer:'canvas'})
    .catch(function(){ document.getElementById('e').style.display='block'; });
} catch (err) { document.getElementById('e').style.display='block'; }
</script></body></html>`;
  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="w-full bg-white border border-[#E5E7EB]"
      style={{ minHeight: 320, height: 360, borderRadius: 12 }}
      title={title ?? "Agent chart"}
    />
  );
}

function TableOutput({ payload }: { payload: string }) {
  let columns: string[] = [];
  let rows: string[][] = [];
  try {
    const parsed = JSON.parse(payload);
    columns = Array.isArray(parsed.columns) ? parsed.columns.map(String) : [];
    rows = Array.isArray(parsed.rows) ? parsed.rows.map((r: unknown[]) => (r ?? []).map(String)) : [];
  } catch {
    return <span className="whitespace-pre-wrap">{payload}</span>;
  }
  if (rows.length === 0) {
    return <p className="text-sm text-[#6B7280]">No rows returned.</p>;
  }
  return (
    // Wide result sets scroll inside their own container rather than stretching
    // the dialog.
    <div className="overflow-x-auto tmn-scroll" style={{ maxHeight: 320 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        {columns.length > 0 && (
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderBottom: "1px solid #E5E7EB",
                    background: "#F8FAFC",
                    color: "#374151",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #F1F5F9",
                    color: "#111827",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders one agent output block.
 *
 * Exported so the seller wizard's preview and the admin review screen render
 * output through the SAME code path the buyer sees. Previewing through a
 * different renderer is how a listing gets approved looking fine and then
 * displays differently in production.
 */
export function renderOutput(o: RunOutput) {
  // Structured components produced by API Endpoint Mode's output mapping. These
  // are rendered as data, never as HTML, so seller content cannot inject markup.
  if (o.format === "table") return <TableOutput payload={o.response} />;
  if (o.format === "chart") return <ChartOutput spec={o.response} title={o.heading} />;
  if (o.format === "code") {
    return (
      <div>
        {o.language && (
          <div className="text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
            {o.language}
          </div>
        )}
        <pre
          className="tmn-scroll"
          style={{
            background: "#0F172A",
            color: "#E2E8F0",
            borderRadius: 12,
            padding: 14,
            fontSize: 12.5,
            overflowX: "auto",
            margin: 0,
          }}
        >
          {o.response}
        </pre>
      </div>
    );
  }
  if (o.format === "alert") {
    return (
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
        {o.response}
      </div>
    );
  }

  let body = o.response.trim();
  const fenced = body.match(/^```(?:html)?\s*([\s\S]*?)```$/i);
  if (fenced) body = fenced[1].trim();

  const looksHtml =
    o.format === "iframe" ||
    o.format === "html" ||
    /^<(!doctype|html|table|div|section|body)/i.test(body);

  if (looksHtml) {
    return (
      <iframe
        sandbox=""
        srcDoc={body}
        className="w-full bg-white border border-[#E5E7EB]"
        style={{ minHeight: 280, height: 380, borderRadius: "16px" }}
        title="Agent output"
      />
    );
  }
  return (
    <div className="tmn-markdown text-sm font-normal text-[#111827] leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "12px",
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#1D4ED8",
                marginBottom: "8px",
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "6px",
              }}
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#6B7280",
              }}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong
              style={{
                fontWeight: 600,
                color: "#111827",
              }}
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "3px solid #2563EB",
                paddingLeft: "12px",
                color: "#6B7280",
                fontStyle: "italic",
              }}
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr
              style={{
                borderColor: "#E5E7EB",
                margin: "16px 0",
              }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{
                listStyleType: "disc",
                paddingLeft: "20px",
                marginBottom: "4px",
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                listStyleType: "decimal",
                paddingLeft: "20px",
                marginBottom: "4px",
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              style={{
                marginBottom: "4px",
              }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              style={{
                marginBottom: "8px",
                lineHeight: 1.6,
              }}
              {...props}
            />
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  isPill = false,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isPill?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const [listMaxHeight, setListMaxHeight] = useState<number>(200);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    if (!open && ref.current) {
      const modal = (ref.current.closest(".tmn-scroll") || ref.current.closest(".overflow-y-auto")) as HTMLElement | null;
      const buttonRect = ref.current.getBoundingClientRect();
      const modalRect = modal ? modal.getBoundingClientRect() : null;

      const spaceBelow = modalRect
        ? modalRect.bottom - buttonRect.bottom - 16
        : window.innerHeight - buttonRect.bottom - 16;
      const spaceAbove = modalRect
        ? buttonRect.top - modalRect.top - 16
        : buttonRect.top - 16;

      // Flip up if space below inside modal is tight (< 280px) and space above is greater
      const goUp = spaceBelow < 280 && spaceAbove > spaceBelow;
      setMenuPlacement(goUp ? "up" : "down");

      const availableSpace = goUp ? spaceAbove : spaceBelow;
      // Reserve space for search box (44px) and container margins/padding (24px)
      const optionsSpace = Math.max(110, Math.min(220, Math.floor(availableSpace - 68)));
      setListMaxHeight(optionsSpace);
    }
    setOpen(!open);
    if (open) setSearch("");
  };

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className={`relative ${isPill ? "w-auto min-w-[140px]" : "w-full"}`}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          borderRadius: isPill ? "9999px" : "16px",
          padding: isPill ? "7px 14px" : "14px 16px",
        }}
        className={`w-full flex items-center justify-between gap-2 text-left cursor-pointer border text-xs font-medium transition-all duration-200 ease-in-out ${
          isPill
            ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] hover:bg-[#DBEAFE] shadow-sm"
            : "bg-[#FFFFFF] text-sm font-normal text-[#111827] border-[#E5E7EB] hover:border-[#2563EB]"
        } ${open ? "border-[#2563EB] ring-2 ring-[#2563EB]/15" : ""}`}
      >
        <span className={selectedOption ? (isPill ? "text-[#2563EB]" : "text-[#111827]") : "text-[#9CA3AF]"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-base transition-transform duration-200 ${
            isPill ? "text-[#2563EB]" : "text-[#6B7280]"
          } ${open ? (menuPlacement === "up" ? "rotate-0" : "rotate-180") : ""}`}
        >
          {menuPlacement === "up" ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          style={{
            borderRadius: "16px",
            boxShadow: "0 14px 36px -6px rgba(0, 0, 0, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
            padding: "8px",
          }}
          className={`absolute z-50 bg-white border border-[#E5E7EB] ${
            menuPlacement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${isPill ? "left-0 min-w-[260px] sm:min-w-[300px] w-max max-w-[90vw]" : "left-0 right-0"}`}
        >
          {/* Search Box - only when more than 5 options */}
          {options.length > 5 && (
            <div className="relative mb-2 px-0.5 pt-0.5">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  borderRadius: "12px",
                  padding: "7px 12px 7px 30px",
                  backgroundColor: "#F8F9FA",
                  border: "1px solid #E5E7EB",
                }}
                className="w-full text-xs font-normal text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#2563EB] transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List with smooth scroll and dynamically clamped maxHeight */}
          <div
            style={{ maxHeight: `${listMaxHeight}px` }}
            className="overflow-y-auto tmn-scroll scroll-smooth flex flex-col gap-[2px] pr-0.5 overscroll-contain"
          >
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-3">No options found</p>
            ) : (
              filteredOptions.map((o) => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{ borderRadius: "12px", padding: "9px 12px" }}
                    className={`w-full text-left text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-[#EFF6FF] text-[#2563EB] font-medium"
                        : "text-[#111827] font-normal hover:bg-[#F8F9FA]"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-base text-[#2563EB] shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function renderField(
  f: InputField,
  value: string,
  onChange: (v: string) => void
) {
  const base = "tmn-field w-full text-[#111827] placeholder-[#6B7280] text-sm font-normal";

  if (f.type === "textarea" || f.type === "list") {
    return (
      <textarea
        rows={f.type === "list" ? 4 : 3}
        className={base}
        value={value}
        placeholder={f.type === "list" ? "One per line…" : `Enter ${f.label.toLowerCase()}…`}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (f.type === "boolean") {
    return (
      <CustomSelect
        options={[
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ]}
        value={value}
        onChange={onChange}
        placeholder="Select Yes or No…"
      />
    );
  }
  if (f.options && f.options.length > 0) {
    return (
      <CustomSelect
        options={f.options}
        value={value}
        onChange={onChange}
        placeholder="Select…"
      />
    );
  }
  if (f.type === "file") {
    return (
      <input
        type="file"
        className={base}
        onChange={(e) => {
          const file = e.target.files?.[0];
          onChange(file ? file.name : "");
        }}
      />
    );
  }
  return (
    <input
      type={f.type === "number" ? "number" : f.type === "URL" ? "url" : f.type === "email" ? "email" : "text"}
      className={base}
      value={value}
      min={f.type === "number" ? "0" : undefined}
      placeholder={`Enter ${f.label.toLowerCase()}…`}
      onKeyDown={
        f.type === "number"
          ? (e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") {
                e.preventDefault();
              }
            }
          : undefined
      }
      onChange={(e) => {
        let val = e.target.value;
        if (f.type === "number") {
          if (val.startsWith("-")) return;
          if (val !== "" && Number(val) < 0) val = "0";
        }
        onChange(val);
      }}
      onWheel={f.type === "number" ? (e) => e.currentTarget.blur() : undefined}
    />
  );
}

