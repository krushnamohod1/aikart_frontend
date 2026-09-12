import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api-client/config";

/**
 * fetch() from a Server Component/page to the backend, forwarding the
 * browser's own cookies along.
 *
 * Why this exists: a plain `fetch()` made from Next.js server-side code is a
 * server-to-server request — it does NOT automatically carry the visiting
 * browser's cookies the way a client-side `fetch(..., {credentials:
 * "include"})` does. Every page that used to call `getSessionUser()` /
 * `pool.query()` / etc. directly (because it ran in the same process as the
 * DB) now calls a backend "bundle" endpoint instead, and that endpoint needs
 * to see the same session cookie the browser sent to this frontend server,
 * so it must be read here (via next/headers) and re-attached by hand.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}
