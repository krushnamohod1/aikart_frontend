"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useState, useEffect, Suspense } from "react";
import { resetPassword, type ActionResult } from "@/lib/api-client/auth";

const initialState: ActionResult = {};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, action, isPending] = useActionState<ActionResult, FormData>(
    resetPassword,
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
            <h1 className="ff-poppins au-title">Set a new password</h1>
            <p className="ff-inter au-sub">
              Enter the 6-digit code sent to{" "}
              <strong style={{ color: "#0f172a" }}>{email || "your email"}</strong> and choose your new password.
            </p>

            {/* Status Banners */}
            {state?.error && (
              <div className="au-banner au-banner--err">
                <span className="material-symbols-outlined">error</span>
                <span>{state.error}</span>
              </div>
            )}

            <form action={action} className="au-fields">
              <input type="hidden" name="email" value={email} />

              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="rp-code">
                  Verification Code
                </label>
                <input
                  id="rp-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  className="ff-inter au-input au-code-input"
                />
                {state?.fieldErrors?.code && (
                  <p className="au-err">{state.fieldErrors.code[0]}</p>
                )}
              </div>

              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="rp-password">
                  New Password
                </label>
                <div className="au-inwrap">
                  <input
                    id="rp-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 chars, include a number"
                    autoComplete="new-password"
                    className="ff-inter au-input"
                  />
                  <button
                    type="button"
                    className="au-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {state?.fieldErrors?.password && (
                  <p className="au-err">{state.fieldErrors.password[0]}</p>
                )}
              </div>

              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="rp-confirm">
                  Confirm New Password
                </label>
                <div className="au-inwrap">
                  <input
                    id="rp-confirm"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className="ff-inter au-input"
                  />
                  <button
                    type="button"
                    className="au-eye"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle password"
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {state?.fieldErrors?.confirmPassword && (
                  <p className="au-err">{state.fieldErrors.confirmPassword[0]}</p>
                )}
              </div>

              <button
                id="btn-reset-submit"
                type="submit"
                disabled={isPending}
                className="ff-inter au-btn au-submit"
              >
                {isPending ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Updating Password…
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>

            <p className="ff-inter au-sub" style={{ marginTop: 22, marginBottom: 0 }}>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
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

/* left visual */
.au-visual{ position:relative; display:none; }
@media(min-width:860px){ .au-visual{ display:block; border-radius:16px; overflow:hidden; min-height:648px; height:100%; } }
.au-visual-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; }
.au-visual-logo{ position:absolute; bottom:22px; left:22px; display:inline-flex; align-items:center; text-decoration:none; z-index:2; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4)); }

/* right form */
.au-form{ display:flex; flex-direction:column; justify-content:center; padding:32px 28px; }
@media(min-width:860px){ .au-form{ padding:32px 52px; } }
.au-form-inner{ width:100%; max-width:380px; margin:0 auto; }

.au-title{ font-weight:600; font-size:27px; line-height:1.2; letter-spacing:-.01em; color:#0f172a; margin:0; }
.au-sub{ font-size:14px; color:#6d6d6d; margin:8px 0 20px; line-height:1.55; }
.au-link{ background:none; border:none; padding:0; cursor:pointer; color:#2563eb; font-weight:600; text-decoration:underline; font-size:14px; }
.au-link:hover{ color:#1d4ed8; }

.au-fields{ display:flex; flex-direction:column; gap:16px; }
.au-field{ display:flex; flex-direction:column; gap:6px; }
.au-label{ font-weight:600; font-size:13px; color:#334155; }
.au-inwrap{ position:relative; }
.au-input{ width:100%; height:48px; border:1px solid #dfe3e9; border-radius:10px; padding:0 15px; font-size:14px; color:#0f172a; background:#fff; outline:none; transition:border-color .2s, box-shadow .2s; }
.au-input::placeholder{ color:#9b9b9b; }
.au-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.au-code-input{ text-align:center; letter-spacing:0.3em; font-weight:700; font-size:18px; }
.au-eye{ position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9aa2b1; display:flex; }
.au-eye .material-symbols-outlined{ font-size:19px; }
.au-err{ font-size:12px; color:#dc2626; margin:0; }

.au-submit, .au-btn{ width:100%; height:50px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:15px; cursor:pointer; transition:filter .2s, transform .1s, opacity .2s; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; margin-top:4px; }
.au-submit:hover:not(:disabled), .au-btn:hover:not(:disabled){ filter:brightness(1.06); }
.au-submit:active:not(:disabled), .au-btn:active:not(:disabled){ transform:scale(.99); }
.au-submit:disabled, .au-btn:disabled{ opacity:.6; cursor:not-allowed; }

.au-banner{ display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; font-size:13.5px; line-height:1.5; margin-bottom:16px; }
.au-banner .material-symbols-outlined{ font-size:20px; flex-shrink:0; margin-top:1px; }
.au-banner--ok{ background:rgba(34,197,94,0.10); border:1px solid rgba(34,197,94,0.25); color:#15803d; }
.au-banner--err{ background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22); color:#b91c1c; }
`;
