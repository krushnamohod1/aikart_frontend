"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, Suspense } from "react";
import { verifyEmail, type ActionResult } from "@/lib/api-client/auth";

const A = "/figma/auth";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const name = searchParams.get("name") ?? "";

  const [state, action, isPending] = useActionState<ActionResult, FormData>(
    verifyEmail,
    {}
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
            <div className="au-email-icon">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mark_email_read
              </span>
            </div>

            <h1 className="ff-poppins au-title">Check your email</h1>
            <p className="ff-inter au-sub">
              We sent a 6-digit verification code to{" "}
              <strong style={{ color: "#0f172a" }}>
                {email || "your email"}
              </strong>
              .{name && <span> Welcome, {name}!</span>}
            </p>

            {/* Warning banner */}
            <div className="au-banner au-banner--warn">
              <span className="material-symbols-outlined">report</span>
              <span>
                Please check your <u>spam / junk folder</u> too, the code
                sometimes lands there.
              </span>
            </div>

            {/* Error banner */}
            {state.error && (
              <div className="au-banner au-banner--err">
                <span className="material-symbols-outlined">error</span>
                <span>{state.error}</span>
              </div>
            )}

            <form action={action} className="au-fields">
              <input type="hidden" name="email" value={email} />

              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="code">
                  Verification Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  className="ff-inter au-input au-code-input"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="ff-inter au-btn au-submit"
              >
                {isPending ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Verifying…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <p className="ff-inter au-sub" style={{ marginTop: 24, marginBottom: 0 }}>
              Didn't receive the code?{" "}
              <Link href="/auth?tab=signup" className="au-link">
                Try signing up again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
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

/* email icon */
.au-email-icon{ width:60px; height:60px; border-radius:50%; background:rgba(37,99,235,0.10); color:#2563eb; display:flex; align-items:center; justify-content:center; margin:0 0 20px 0; }
.au-email-icon .material-symbols-outlined{ font-size:30px; }

.au-title{ font-weight:600; font-size:27px; line-height:1.2; letter-spacing:-.01em; color:#0f172a; margin:0; }
.au-sub{ font-size:14px; color:#6d6d6d; margin:8px 0 20px; line-height:1.55; }
.au-link{ background:none; border:none; padding:0; cursor:pointer; color:#0f172a; font-weight:700; text-decoration:underline; font-size:14px; }
.au-link:hover{ color:#2563eb; }

.au-fields{ display:flex; flex-direction:column; gap:18px; }
.au-field{ display:flex; flex-direction:column; gap:8px; }
.au-label{ font-weight:600; font-size:13px; color:#334155; text-transform:uppercase; letter-spacing:.06em; }
.au-input{ width:100%; height:48px; border:1.5px solid #dfe3e9; border-radius:10px; padding:0 15px; font-size:14px; color:#0f172a; background:#fff; outline:none; transition:border-color .2s, box-shadow .2s; }
.au-input::placeholder{ color:#9b9b9b; }
.au-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.au-code-input{ text-align:center; letter-spacing:0.3em; font-weight:700; font-size:18px; }
.au-err{ font-size:12px; color:#dc2626; margin:0; }

.au-submit, .au-btn{ width:100%; height:50px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:15px; cursor:pointer; transition:filter .2s, transform .1s, opacity .2s; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; }
.au-submit:hover:not(:disabled), .au-btn:hover:not(:disabled){ filter:brightness(1.06); }
.au-submit:active:not(:disabled), .au-btn:active:not(:disabled){ transform:scale(.99); }
.au-submit:disabled, .au-btn:disabled{ opacity:.6; cursor:not-allowed; }

.au-banner{ display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; font-size:13.5px; line-height:1.5; margin-bottom:20px; }
.au-banner .material-symbols-outlined{ font-size:20px; flex-shrink:0; margin-top:1px; }
.au-banner--ok{ background:rgba(34,197,94,0.10); border:1px solid rgba(34,197,94,0.25); color:#15803d; }
.au-banner--err{ background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22); color:#b91c1c; }
.au-banner--warn{ background:#EFF6FF; border:1px solid #BFDBFE; color:#1e40af; }
`;
