// Converted from the single-repo app's src/app/actions/storage.ts's getUploadUrl Server Action.
import { API_BASE } from "./config";

export async function getUploadUrl(
  bucket: string,
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch(`${API_BASE}/api/storage/upload-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, key, contentType }),
  });
  return res.json();
}
