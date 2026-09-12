"use client";

// Reviewer-facing preview for API Endpoint Mode listings.
//
// Docker listings already had "Test This Agent (Sandbox)" on this screen, but an
// API-mode listing had nothing: a reviewer could read the endpoint config and the
// output mapping, yet never see what a buyer would actually get back. Since the
// buyer route only serves approved listings, there was no way to try it before
// approving it.
//
// This renders through the SAME pieces the buyer's Try Me Now uses — renderField
// for inputs, renderOutput for results — so what a reviewer approves is what a
// buyer gets. The endpoint URL and credentials stay server-side; nothing here
// ever receives them.

import { useCallback, useEffect, useState } from "react";
import { renderField, renderOutput, type InputField, type RunOutput } from "@/app/agent/[id]/TryMeNow";
import { adminGetApiPreviewSchema, adminTestApiEndpoint } from "@/lib/api-client/admin";

type PreviewSchema = {
  streaming: boolean;
  requiresUpload: boolean;
  health: string;
  fields: InputField[];
  outputMapping: { event?: string; source: string; target: string; label?: string }[];
};

const TARGET_LABELS: Record<string, string> = {
  text: "Text",
  markdown: "Formatted text",
  number: "Number",
  status: "Status",
  list: "List",
  json: "Raw JSON",
  code: "Code block",
  table: "Table",
  chart: "Chart",
  alert: "Error / alert",
};

export function ApiPreviewPanel({ listingId }: { listingId: string }) {
  const [schema, setSchema] = useState<PreviewSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [outputs, setOutputs] = useState<RunOutput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ durationMs: number; httpStatus: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await adminGetApiPreviewSchema(listingId);
      if (cancelled) return;
      if ("error" in result) setSchema(null);
      else
        setSchema({
          streaming: result.streaming,
          requiresUpload: result.requiresUpload,
          health: result.health,
          fields: result.fields as InputField[],
          outputMapping: result.outputMapping,
        });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setOutputs(null);
    setMeta(null);
    try {
      const result = await adminTestApiEndpoint(listingId, values);
      if ("error" in result) setError(result.error);
      else {
        setOutputs(result.outputs as RunOutput[]);
        setMeta({ durationMs: result.durationMs, httpStatus: result.httpStatus });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Preview run failed.");
    } finally {
      setRunning(false);
    }
  }, [listingId, values]);

  // Not an API-mode listing — render nothing so the Docker/n8n review flow is
  // completely unchanged for every existing listing.
  if (loading || !schema) return null;

  const canRun =
    !schema.requiresUpload &&
    schema.fields.every((f) => !f.required || (values[f.name] ?? "").trim().length > 0);

  const healthColor =
    schema.health === "healthy"
      ? "text-emerald-600"
      : schema.health === "offline"
        ? "text-rose-600"
        : schema.health === "degraded"
          ? "text-amber-600"
          : "text-gray-500";

  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="px-3.5 py-2.5 bg-gray-50 border-b border-[#E5E7EB] text-xs font-bold text-gray-700 flex items-center justify-between gap-2">
        <span>Preview This Agent (API Endpoint)</span>
        <span className="flex items-center gap-2 font-semibold">
          {schema.streaming && <span className="text-[11px] text-blue-600">Streaming: SSE</span>}
          <span className={`text-[11px] ${healthColor}`}>Health: {schema.health}</span>
        </span>
      </div>

      <div className="p-3.5 space-y-3">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Runs the seller&apos;s live endpoint through aiKart&apos;s proxy and renders the result
          exactly as a buyer will see it. Nothing is saved and no run is recorded.
        </p>

        {/* What the buyer will be shown — part of what is being approved. */}
        {schema.outputMapping.length > 0 && (
          <div className="rounded-lg bg-gray-50 border border-[#E5E7EB] p-2.5">
            <p className="text-[11px] font-bold text-gray-600 mb-1.5">Buyer will see</p>
            <ul className="space-y-1">
              {schema.outputMapping.map((m, i) => (
                <li key={i} className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800">{m.label || m.source}</span>
                  <span className="text-gray-400">·</span>
                  <span>{TARGET_LABELS[m.target] ?? m.target}</span>
                  {m.event && (
                    <span className="font-mono text-[10px] bg-white border border-[#E5E7EB] rounded px-1 text-gray-500">
                      {m.event}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {schema.requiresUpload ? (
          <p className="text-[11px] text-amber-600 leading-relaxed">
            This agent asks the buyer to upload their own database before running, so it cannot be
            executed from this screen. Review the input fields and output mapping above instead.
          </p>
        ) : (
          <>
            {schema.fields.map((f) => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">
                  {f.label}
                  {f.required && <span className="text-rose-500"> *</span>}
                </label>
                {renderField(f, values[f.name] ?? "", (v) =>
                  setValues((prev) => ({ ...prev, [f.name]: v }))
                )}
                {f.helpText && <p className="text-[10px] text-gray-400">{f.helpText}</p>}
              </div>
            ))}

            <button
              type="button"
              onClick={run}
              disabled={!canRun || running}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {running ? "Running…" : "Run preview"}
            </button>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5">
            <p className="text-[11px] font-bold text-rose-700 mb-0.5">Preview failed</p>
            {/* Reviewers are staff, so they get the seller-facing diagnostic. */}
            <p className="text-[11px] text-rose-700 whitespace-pre-wrap leading-relaxed">{error}</p>
          </div>
        )}

        {outputs && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-600">
              Buyer-facing result
              {meta && (
                <span className="font-normal text-gray-400">
                  {" "}
                  · HTTP {meta.httpStatus} · {meta.durationMs}ms
                </span>
              )}
            </p>
            {outputs.length === 0 && (
              <p className="text-[11px] text-amber-600">
                The run succeeded but produced no output blocks — check the output mapping.
              </p>
            )}
            {outputs.map((o, i) => (
              <div key={i} className="rounded-lg border border-[#E5E7EB] bg-white p-3">
                {o.heading && (
                  <p className="text-[11px] font-bold text-gray-700 mb-1.5">{o.heading}</p>
                )}
                {renderOutput(o)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
