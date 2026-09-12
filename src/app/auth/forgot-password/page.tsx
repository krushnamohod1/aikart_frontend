"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword, type ActionResult } from "@/lib/api-client/auth";
import Link from "next/link";

const initialState: ActionResult = {};
const A = "/figma/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(
    forgotPassword,
    initialState
  );

  // See auth/page.tsx for why this effect exists — the original Server
  // Action redirected server-side on success; this fetch-based one returns
  // { redirectTo } instead.
  useEffect(() => {
    if (state?.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <main className="au-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="au-card">
        {/* Left visual */}
        <div className="au-visual">
          <img src="/images/auth-hero.png" alt="" className="au-visual-img" />
          <Link href="/" className="au-visual-logo" aria-label="aikart home">
            <img
              src="/logo/aikart-ai-mark.png"
              alt="ai"
              style={{
                height: 24,
                width: "auto",
                background: "transparent",
                border: "none",
                outline: "none",
                boxShadow: "none",
                padding: 0,
              }}
            />
          </Link>
        </div>

        {/* Right form */}
        <div className="au-form">
          <div className="au-form-inner">
            <h1 className="ff-poppins au-title">Reset your password</h1>
            <p className="ff-inter au-sub">
              Enter your account email and we'll send you a reset link.
            </p>

            {/* Status Banners */}
            {state?.success && (
              <div className="au-banner au-banner--ok">
                <span className="material-symbols-outlined">
                  mark_email_read
                </span>
                <span>{state.success}</span>
              </div>
            )}
            {state?.error && (
              <div className="au-banner au-banner--err">
                <span className="material-symbols-outlined">error</span>
                <span>{state.error}</span>
              </div>
            )}

            {!state?.success && (
              <form action={action} className="au-fields">
                <div className="au-field">
                  <label className="ff-inter au-label" htmlFor="fp-email">
                    Email Address
                  </label>
                  <input
                    id="fp-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="ff-inter au-input"
                  />
                  {state?.fieldErrors?.email && (
                    <p className="au-err">{state.fieldErrors.email[0]}</p>
                  )}
                </div>

                <button
                  id="btn-forgot-submit"
                  type="submit"
                  disabled={isPending}
                  className="ff-inter au-btn au-submit"
                >
                  {isPending ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            )}

            <p className="ff-inter au-sub" style={{ marginTop: 24, marginBottom: 0 }}>
              Remembered it?{" "}
              <Link href="/auth" className="au-link">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const CSS = `
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ff-inter{ font-family:var(--font-inter),'Inter',sans-serif; }
.ff-sansita{ font-family:'Sansita One','Sansita',cursive; }

.au-page{ min-height:100vh; width:100%; background:#f4f4f4; display:flex; align-items:center; justify-content:center; padding:32px 24px; }
@media(max-width:640px){ .au-page{ padding:24px 16px; } }
.au-card{ width:100%; max-width:480px; background:#fff; border-radius:24px; box-shadow:0 24px 70px rgba(15,23,42,0.12); display:grid; grid-template-columns:1fr; overflow:hidden; align-items:stretch; }
@media(min-width:860px){ .au-card{ max-width:900px; grid-template-columns:minmax(0,0.92fr) 1fr; padding:16px; gap:0; min-height:680px; } }

/* left visual — stretches to match the form column height */
.au-visual{ position:relative; display:none; }
@media(min-width:860px){ .au-visual{ display:block; border-radius:16px; overflow:hidden; min-height:648px; height:100%; } }
.au-visual-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; }
.au-visual-logo{ position:absolute; bottom:22px; left:22px; display:inline-flex; align-items:center; text-decoration:none; z-index:2; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4)); }

/* right form — content constrained + vertically centered for balance */
.au-form{ display:flex; flex-direction:column; justify-content:center; padding:32px 28px; }
@media(min-width:860px){ .au-form{ padding:32px 52px; } }
.au-form-inner{ width:100%; max-width:380px; margin:0 auto; }
.au-title{ font-weight:600; font-size:27px; line-height:1.2; letter-spacing:-.01em; color:#0f172a; margin:0; }
.au-brand{ font-family:'Sansita One','Sansita',cursive; color:#2563eb; }
.au-sub{ font-size:14px; color:#6d6d6d; margin:8px 0 20px; }
.au-link{ background:none; border:none; padding:0; cursor:pointer; color:#2563eb; font-weight:600; text-decoration:none; font-size:14px; transition:color .2s ease; }
.au-link:hover{ color:#1d4ed8; text-decoration:underline; }

.au-fields{ display:flex; flex-direction:column; gap:18px; }
.au-field{ display:flex; flex-direction:column; gap:8px; }
.au-label{ font-weight:600; font-size:13px; color:#334155; }
.au-input{ width:100%; height:48px; border:1px solid #dfe3e9; border-radius:10px; padding:0 15px; font-size:14px; color:#0f172a; background:#fff; outline:none; transition:border-color .2s, box-shadow .2s; }
.au-input::placeholder{ color:#9b9b9b; }
.au-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.au-err{ font-size:12px; color:#dc2626; margin:0; }

.au-submit, .au-btn{ width:100%; height:50px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:15px; cursor:pointer; transition:filter .2s, transform .1s, opacity .2s; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; }
.au-submit:hover:not(:disabled), .au-btn:hover:not(:disabled){ filter:brightness(1.06); }
.au-submit:active:not(:disabled), .au-btn:active:not(:disabled){ transform:scale(.99); }
.au-submit:disabled, .au-btn:disabled{ opacity:.6; cursor:not-allowed; }

.au-banner{ display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; font-size:14px; margin-bottom:18px; }
.au-banner .material-symbols-outlined{ font-size:20px; }
.au-banner--ok{ background:rgba(34,197,94,0.10); border:1px solid rgba(34,197,94,0.25); color:#15803d; }
.au-banner--err{ background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22); color:#b91c1c; }
`;
