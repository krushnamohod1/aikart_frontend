"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useState, useEffect, Suspense } from "react";
import { signIn, signUp, type ActionResult } from "@/lib/api-client/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const initialState: ActionResult = {};
const A = "/figma/auth";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState("");

  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  // The original Server Actions redirected server-side on success; a plain
  // fetch-based action can't do that from an event handler (see
  // lib/api-client/auth.ts), so it returns { redirectTo } instead and this
  // effect performs the navigation — the one bit of new client logic the
  // conversion requires.
  useEffect(() => {
    if (signInState?.redirectTo) router.push(signInState.redirectTo);
  }, [signInState, router]);
  useEffect(() => {
    if (signUpState?.redirectTo) router.push(signUpState.redirectTo);
  }, [signUpState, router]);

  const resetSuccess = searchParams.get("reset") === "success";
  const justVerified = searchParams.get("verified") === "1";
  const redirectTo = searchParams.get("redirect") ?? "";
  const oauthError = searchParams.get("error");
  // OAuth start routes now live on the backend.
  const googleHref = `${API_BASE}/api/auth/google${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;
  const githubHref = `${API_BASE}/api/auth/github${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;
  const twitterHref = `${API_BASE}/api/auth/twitter${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;

  // Which social providers this deployment can actually complete a sign-in
  // with. Starts as "neither" on purpose: a button that 500s is worse than a
  // button that appears a moment late, so we fail towards hiding.
  const [providers, setProviders] = useState<{ google: boolean; github: boolean; twitter: boolean }>({
    google: false,
    github: false,
    twitter: false,
  });
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/providers`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d)
          setProviders({ google: !!d.google, github: !!d.github, twitter: !!d.twitter });
      })
      .catch(() => {
        // Leave all hidden — email/password sign-in still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("tab") === "signup") setTab("signup");
  }, [searchParams]);

  const activeState = tab === "signin" ? signInState : signUpState;
  const isSignin = tab === "signin";

  const handleSignUpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!agreed) {
      e.preventDefault();
      e.stopPropagation();
      setTermsError("Please accept the Terms of Service to continue");
      return;
    }
    setTermsError("");
  };

  return (
    <main className="au-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="au-card">
        {/* Left visual */}
        <div className="au-visual">
          <img src="/images/auth-hero.png" alt="" className="au-visual-img" />
          <Link href="/" className="au-visual-logo" aria-label="aikart home">
            <img src="/logo/aikart-ai-mark.png" alt="ai" style={{ height: 24, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
          </Link>
        </div>

        {/* Right form */}
        <div className="au-form">
          <div className="au-form-inner">
          <h1 className="ff-poppins au-title">
            {isSignin ? "Welcome to " : "Join "}
            <img
              src="/logo/aikart-logo-full.png"
              alt="aikart"
              style={{
                height: 20,
                width: "auto",
                display: "inline-block",
                verticalAlign: "middle",
                background: "transparent",
                border: "none",
                outline: "none",
                boxShadow: "none",
                padding: 0,
                position: "relative",
                top: "-2px"
              }}
            />
          </h1>
          <p className="ff-inter au-sub">
            {isSignin ? (
              <>Create a new account?{" "}
                <button type="button" className="au-link" onClick={() => setTab("signup")}>Sign Up</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button type="button" className="au-link" onClick={() => setTab("signin")}>Sign In</button>
              </>
            )}
          </p>

          {/* status banners */}
          {resetSuccess && <div className="au-banner au-banner--ok"><span className="material-symbols-outlined">check_circle</span><span>Password updated sign in below.</span></div>}
          {justVerified && <div className="au-banner au-banner--ok"><span className="material-symbols-outlined">verified</span><span>Email verified sign in to get started.</span></div>}
          {activeState?.success && <div className="au-banner au-banner--ok"><span className="material-symbols-outlined">mark_email_read</span><span>{activeState.success}</span></div>}
          {activeState?.error && <div className="au-banner au-banner--err"><span className="material-symbols-outlined">error</span><span>{activeState.error}</span></div>}
          {oauthError && <div className="au-banner au-banner--err"><span className="material-symbols-outlined">error</span><span>{oauthError}</span></div>}

          {/* SIGN IN */}
          {isSignin && (
            <form action={signInAction} className="au-fields">
              <input type="hidden" name="redirect" value={redirectTo} />
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signin-email">Email Address</label>
                <input id="signin-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="ff-inter au-input" />
                {signInState?.fieldErrors?.email && <p className="au-err">{signInState.fieldErrors.email[0]}</p>}
              </div>
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signin-password">Password</label>
                <div className="au-inwrap">
                  <input id="signin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" className="ff-inter au-input" />
                  <button type="button" className="au-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                    <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {signInState?.fieldErrors?.password && <p className="au-err">{signInState.fieldErrors.password[0]}</p>}
                <Link href="/auth/forgot-password" className="ff-inter au-forgot">Forgot Password</Link>
              </div>
              <div className="au-divider"><span>or</span></div>
              <div className="au-social-row">
                {/* Google */}
                {providers.google && (
                  <a href={googleHref} className="au-social-icon" aria-label="Continue with Google">
                    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.014 24.014 0 000 21.56l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </a>
                )}

                {/* X (Twitter) */}
                {providers.twitter && (
                  <a
                    href={twitterHref}
                    className="au-social-icon"
                    aria-label="Continue with X"
                    id="btn-signin-twitter"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
              <button id="btn-signin" type="submit" disabled={signInPending} className="ff-inter au-submit">
                {signInPending ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* SIGN UP */}
          {!isSignin && (
            <form action={signUpAction} onSubmit={handleSignUpSubmit} className="au-fields au-fields--signup">
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signup-name">Full Name</label>
                <input id="signup-name" name="fullName" type="text" autoComplete="name" placeholder="Jane Smith" className="ff-inter au-input" />
                {signUpState?.fieldErrors?.fullName && <p className="au-err">{signUpState.fieldErrors.fullName[0]}</p>}
              </div>
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signup-email">Email Address</label>
                <input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" className="ff-inter au-input" />
                {signUpState?.fieldErrors?.email && <p className="au-err">{signUpState.fieldErrors.email[0]}</p>}
              </div>
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signup-password">Password</label>
                <div className="au-inwrap">
                  <input id="signup-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min 8 chars, include a number" className="ff-inter au-input" />
                  <button type="button" className="au-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                    <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {signUpState?.fieldErrors?.password && <p className="au-err">{signUpState.fieldErrors.password[0]}</p>}
              </div>
              <div className="au-field">
                <label className="ff-inter au-label" htmlFor="signup-confirm">Confirm Password</label>
                <div className="au-inwrap">
                  <input id="signup-confirm" name="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" className="ff-inter au-input" />
                  <button type="button" className="au-eye" onClick={() => setShowConfirm(!showConfirm)} aria-label="Toggle password">
                    <span className="material-symbols-outlined">{showConfirm ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {signUpState?.fieldErrors?.confirmPassword && <p className="au-err">{signUpState.fieldErrors.confirmPassword[0]}</p>}
              </div>

              <div className="au-divider"><span>or</span></div>
              <div className="au-social-row">
                {/* Google */}
                {providers.google && (
                  <a href={googleHref} className="au-social-icon" aria-label="Continue with Google">
                    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.014 24.014 0 000 21.56l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </a>
                )}

                {/* X (Twitter) */}
                {providers.twitter && (
                  <a
                    href={twitterHref}
                    className="au-social-icon"
                    aria-label="Continue with X"
                    id="btn-signup-twitter"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>

              <div className="au-terms-group">
                <div className="au-terms-row">
                  <input
                    type="checkbox"
                    id="signup-terms-checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (e.target.checked) setTermsError("");
                    }}
                    className="au-checkbox"
                  />
                  <label htmlFor="signup-terms-checkbox" className="ff-inter au-terms-text">
                    By joining, you agree to the aikart <Link href="/explore" onClick={(e) => e.stopPropagation()}>Terms of Service</Link> and to occasionally receive emails from us. Please read our <Link href="/explore" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link> to learn how we use your personal data.
                  </label>
                </div>
                {termsError && (
                  <p className="au-err au-terms-err" role="alert" aria-live="polite">
                    {termsError}
                  </p>
                )}
              </div>

              <div
                onClick={() => {
                  if (!agreed) {
                    setTermsError("Please accept the Terms of Service to continue");
                  }
                }}
                className="au-submit-wrap"
              >
                <button
                  id="btn-signup"
                  type="submit"
                  disabled={signUpPending || !agreed}
                  onClick={(e) => {
                    if (!agreed) {
                      e.preventDefault();
                      e.stopPropagation();
                      setTermsError("Please accept the Terms of Service to continue");
                    }
                  }}
                  className="ff-inter au-submit"
                >
                  {signUpPending ? "Creating account…" : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {isSignin && (
            <p className="ff-inter au-terms">
              By joining, you agree to the aikart <Link href="/explore">Terms of Service</Link> and to occasionally receive emails from us. Please read our <Link href="/explore">Privacy Policy</Link> to learn how we use your personal data.
            </p>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthPageInner />
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
.au-link{ background:none; border:none; padding:0; cursor:pointer; color:#2563eb; font-weight:600; text-decoration:underline; font-size:14px; }
.au-link:hover{ color:#2563eb; }

.au-social-row{ display:flex; align-items:center; justify-content:center; gap:32px; width:100%; box-sizing:border-box; }
.au-social-icon{ display:flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:50%; background:#fff; border:1px solid #e8ecf1; text-decoration:none; transition:transform .2s, box-shadow .2s, border-color .2s; box-shadow:0 4px 12px rgba(15,23,42,0.10), 0 1px 3px rgba(15,23,42,0.06); cursor:pointer; }
.au-social-icon:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(15,23,42,0.15), 0 2px 6px rgba(15,23,42,0.08); border-color:#d0d5dd; }
.au-social-icon:active{ transform:translateY(0); box-shadow:0 2px 6px rgba(15,23,42,0.08); }
.au-social-icon svg{ flex-shrink:0; display:block; }

.au-divider{ display:flex; align-items:center; gap:12px; margin:0; color:#9aa2b1; font-size:12px; }
.au-divider::before, .au-divider::after{ content:""; flex:1; height:1px; background:#e5e9ef; }

.au-fields{ display:flex; flex-direction:column; gap:18px; }
.au-fields--signup{ gap:13px; }
.au-fields--signup .au-field{ gap:5px; }
.au-fields--signup .au-terms-group{ margin-top:-2px; gap:4px; }
.au-fields--signup .au-submit-wrap{ margin-top:2px; }

.au-field{ display:flex; flex-direction:column; gap:8px; }
.au-label{ font-weight:600; font-size:13px; color:#334155; }
.au-inwrap{ position:relative; }
.au-input{ width:100%; height:48px; border:1px solid #dfe3e9; border-radius:10px; padding:0 15px; font-size:14px; color:#0f172a; background:#fff; outline:none; transition:border-color .2s, box-shadow .2s; }
.au-input::placeholder{ color:#9b9b9b; }
.au-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.au-eye{ position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9aa2b1; display:flex; }
.au-eye .material-symbols-outlined{ font-size:19px; }
.au-forgot{ align-self:flex-end; margin-top:4px; font-weight:500; font-size:13px; color:#2563eb; text-decoration:none; }
.au-forgot:hover{ text-decoration:underline; }
.au-err{ font-size:12px; color:#dc2626; margin:0; }

.au-terms-group{ margin-top:4px; display:flex; flex-direction:column; gap:6px; }
.au-terms-row{ display:flex; align-items:flex-start; gap:10px; }
.au-checkbox{ width:18px; height:18px; border-radius:4px; border:1px solid #dfe3e9; accent-color:#2563eb; cursor:pointer; flex-shrink:0; margin-top:2px; }
.au-terms-text{ font-size:13px; line-height:1.5; color:#6e6e6e; cursor:pointer; margin:0; user-select:none; }
.au-terms-text a{ color:#2563eb; text-decoration:underline; }
.au-terms-err{ font-size:12px; color:#dc2626; margin:0; font-weight:500; }

.au-submit-wrap{ width:100%; margin-top:6px; }
.au-submit{ width:100%; height:50px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:15px; cursor:pointer; transition:filter .2s, transform .1s, opacity .2s; }
.au-submit:hover:not(:disabled){ filter:brightness(1.06); }
.au-submit:active:not(:disabled){ transform:scale(.99); }
.au-submit:disabled{ opacity:.6; cursor:not-allowed; }

.au-terms{ font-size:12px; line-height:1.6; color:#8a94a6; margin:26px 0 0; }
.au-terms a{ color:#2563eb; text-decoration:underline; }

.au-banner{ display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; font-size:14px; margin-bottom:18px; }
.au-banner .material-symbols-outlined{ font-size:20px; }
.au-banner--ok{ background:rgba(34,197,94,0.10); border:1px solid rgba(34,197,94,0.25); color:#15803d; }
.au-banner--err{ background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.22); color:#b91c1c; }
`;
