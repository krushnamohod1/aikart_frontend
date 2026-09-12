import { NextResponse, type NextRequest } from "next/server";

// ─── Silent session refresh ──────────────────────────────────────────────────
// When the short-lived `access_token` cookie has expired (so it's gone) but a
// long-lived `refresh_token` is still present, transparently mint a fresh access
// token and attach it to both the ongoing request (so the page renders
// as logged-in immediately) and the response (so the browser keeps it).
//
// This is BEST-EFFORT and FAIL-SAFE: on any error it falls through to
// `NextResponse.next()`, i.e. the exact behavior we had before. It can only
// ever keep a session alive, never break one.
//
// aikart-frontend note: this used to call AWS Cognito directly (it only ever
// needed a public client ID, no secret, so that worked fine same-origin).
// After the frontend/backend split, the actual Cognito call moved to the
// backend's POST /api/auth/refresh (see aikart-backend), which keeps all
// Cognito config on that side. This proxy still owns the trigger condition
// and the cookie plumbing — it only runs against requests to the app it's
// defined in, so that part can't move to the backend.
//
// File name/export: Next.js 16 renamed the `middleware.ts` convention to
// `proxy.ts` (the `middleware` export is deprecated) — confirmed against
// this project's bundled Next docs and by testing on the backend twin of
// this file (see aikart-backend/proxy.ts for the empirical detail).

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const COOKIE_OPTS = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" ||
    (process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false),
  sameSite: "lax" as const,
  path: "/",
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};

export async function proxy(request: NextRequest) {
  const hasAccess = request.cookies.get("access_token")?.value;
  const refresh = request.cookies.get("refresh_token")?.value;

  if (hasAccess || !refresh) {
    return NextResponse.next();
  }

  try {
    const r = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!r.ok) return NextResponse.next(); // refresh token rejected → behave as before

    const data = await r.json();
    const access: unknown = data?.accessToken;
    const expiresIn: number = data?.expiresIn ?? 3600;
    if (typeof access !== "string" || !access) return NextResponse.next();

    // Make the new token visible to this request's downstream handlers…
    request.cookies.set("access_token", access);
    const res = NextResponse.next({ request: { headers: request.headers } });
    // …and persist it in the browser for subsequent requests.
    res.cookies.set("access_token", access, { ...COOKIE_OPTS, maxAge: expiresIn });
    return res;
  } catch {
    return NextResponse.next(); // fail-safe
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
