// Converted from the single-repo app's src/app/actions/admin.ts Server Actions.
import { API_BASE } from "./config";

export async function getAdminListings(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/admin/listings`, { credentials: "include" });
  return res.json();
}

export type AdminSandboxTestResult =
  | { ok: true; format: string; response: string }
  | { error: string };

export async function adminTestSandbox(
  listingId: string,
  inputs: Record<string, string>
): Promise<AdminSandboxTestResult> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}/test-sandbox`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs }),
  });
  return res.json();
}

export type AdminApiPreviewResult =
  | {
      ok: true;
      outputs: { heading?: string; format: string; response: string; language?: string }[];
      durationMs: number;
      httpStatus: number;
    }
  | { error: string };

export async function adminTestApiEndpoint(
  listingId: string,
  inputs: Record<string, string>
): Promise<AdminApiPreviewResult> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}/test-api-endpoint`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs }),
  });
  return res.json();
}

export async function adminGetApiPreviewSchema(listingId: string): Promise<
  | {
      ok: true;
      enabled: boolean;
      streaming: boolean;
      requiresUpload: boolean;
      health: string;
      fields: { name: string; label: string; type: string; required: boolean; options: { label: string; value: string }[]; placeholder?: string; helpText?: string }[];
      outputMapping: { event?: string; source: string; target: string; label?: string }[];
    }
  | { error: string }
> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}/api-preview-schema`, {
    credentials: "include",
  });
  return res.json();
}
