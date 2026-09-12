// Converted from the single-repo app's src/app/actions/auth.ts Server
// Actions. Same function names, signatures, and return shape as before, so
// every page that already does `useActionState(signIn, initialState)` +
// `<form action={signInAction}>` needs no JSX changes.
//
// What's different, and why (see the plan's "Server Action → API conversion"
// section): a real Server Action could call next/navigation's redirect() on
// success and Next.js would perform the navigation for you. A plain
// fetch-based function has no equivalent — per the Next.js docs, redirect()
// "can be called in Client Components during the rendering process but not
// in event handlers," and a useActionState action function is the latter.
// So on success these now return `{ redirectTo }` as data instead of
// redirecting themselves — the calling page's useEffect (added alongside
// each form) performs `router.push(redirectTo)`.
//
// FormData is forwarded to the backend as-is (fetch supports a FormData body
// directly), so the backend route handlers can keep parsing it exactly like
// the original Server Action did (`formData.get("email")`, etc.) — no JSON
// (de)serialization step introduced.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type ActionResult = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
};

async function postForm(path: string, formData: FormData): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include", // cross-origin cookie (see plan section 2)
      body: formData,
    });
    return await res.json();
  } catch {
    return { error: "Could not reach the server. Please try again." };
  }
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/signup", formData);
}

export async function verifyEmail(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/verify-email", formData);
}

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/signin", formData);
}

export async function forgotPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/forgot-password", formData);
}

export async function resetPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/reset-password", formData);
}

export async function verifyResetCode(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return postForm("/api/auth/verify-reset-code", formData);
}

/**
 * Unlike the rest, this isn't wired to a form — Navbar.tsx calls it directly
 * from a click handler (`await signOut()`). It returns { redirectTo } like
 * the others; the caller is responsible for navigating (e.g.
 * `router.push(result.redirectTo)`), since redirect() from next/navigation
 * cannot be used in an event handler either way (that was already true even
 * before this conversion — see signout/route.ts on the backend).
 */
export async function signOut(): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signout`, {
      method: "POST",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { redirectTo: "/auth" };
  }
}
