"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/lib/api-client/auth";
import { API_BASE } from "@/lib/api-client/config";
import { NavAvatarMenu } from "./NavAvatarMenu";
import { NavLink } from "./NavLink";
import type { NavLinkKey } from "./navVisibility";

type AuthUser = { id: string; email: string; full_name?: string; role?: string; avatar_url?: string | null };
const AUTH_STORAGE_KEY = "aikart_auth_user";
let cachedUser: AuthUser | null | undefined = undefined;
let authPromise: Promise<AuthUser | null> | null = null;

function readStoredUser(): AuthUser | null | undefined {
  if (typeof window === "undefined") return undefined;
  if (cachedUser !== undefined) return cachedUser;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      cachedUser = JSON.parse(raw);
      return cachedUser;
    }
  } catch {}
  return undefined;
}

function writeStoredUser(userData: AuthUser | null) {
  cachedUser = userData;
  if (typeof window === "undefined") return;
  try {
    if (userData) {
      const serialized = JSON.stringify(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
}

export function Navbar({
  hiddenLinks = [],
  extra,
  minimal = false,
  showBecomeSellerButton = false,
  initialUser,
}: {
  /** Links to omit on this page — see navVisibility.ts for the route → link map. */
  hiddenLinks?: NavLinkKey[];
  /** Slot for page-specific additions (e.g. a search bar) without editing this component. */
  extra?: ReactNode;
  /** Logo only — no links, no auth CTAs. For chromeless flows like auth/onboarding. */
  minimal?: boolean;
  /** Whether to show the mail/inbox icon next to avatar (defaults to false, set to true on Explore page) */
  showInbox?: boolean;
  /** Whether to show the Become Seller button on the right side (defaults to false, set to true on Explore page) */
  showBecomeSellerButton?: boolean;
  /** Optional server-passed user */
  initialUser?: AuthUser | null;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Initial state must match between server and client hydration passes, so it can only
  // depend on `initialUser` (a prop, identical on both) — never on localStorage, which is
  // unavailable during SSR but already populated by the time the client hydrates. The
  // mount effect below re-syncs from storage immediately after hydration completes.
  const [user, setUser] = useState<AuthUser | null>(() => initialUser ?? null);
  const [authLoading, setAuthLoading] = useState<boolean>(() => initialUser === undefined);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const [customDropdownOpen, setCustomDropdownOpen] = useState(false);
  const [mobileCustomOpen, setMobileCustomOpen] = useState(false);
  const customDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileCustomOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    function checkTheme() {
      const navIn = document.querySelector(".gnav-in");
      if (!navIn) return;
      const rect = navIn.getBoundingClientRect();
      const checkX = rect.left + rect.width / 2;
      const checkY = rect.top + rect.height / 2;

      const elements = document.elementsFromPoint(checkX, checkY);
      let dark = false;

      for (const el of elements) {
        if (el.closest(".gnav")) continue;

        const darkAttr = el.getAttribute("data-navbar-theme") || el.closest("[data-navbar-theme]")?.getAttribute("data-navbar-theme");
        if (darkAttr === "dark") {
          dark = true;
          break;
        }
        if (darkAttr === "light") {
          dark = false;
          break;
        }

        if (
          el.classList.contains("hm-process") ||
          el.closest(".hm-process") ||
          el.classList.contains("bg-black") ||
          el.closest(".bg-black") ||
          el.classList.contains("bg-gray-900") ||
          el.closest(".bg-gray-900")
        ) {
          dark = true;
          break;
        }

        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness < 128) {
              dark = true;
            }
            break;
          }
        }
      }

      setIsDarkTheme(dark);
    }

    checkTheme();
    window.addEventListener("scroll", checkTheme, { passive: true });
    window.addEventListener("resize", checkTheme, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkTheme);
      window.removeEventListener("resize", checkTheme);
    };
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    let active = true;

    // Immediately sync stored user if available
    const stored = readStoredUser();
    if (stored !== undefined) {
      setUser(stored);
      setAuthLoading(false);
    }

    async function loadUser() {
      try {
        if (!authPromise) {
          authPromise = fetch(`${API_BASE}/api/auth/me`, { credentials: "include" })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                writeStoredUser(data);
                return data;
              } else {
                writeStoredUser(null);
                return null;
              }
            })
            .catch(() => {
              return cachedUser ?? null;
            })
            .finally(() => {
              authPromise = null;
            });
        }
        const data = await authPromise;
        if (active) {
          setUser(data);
          setAuthLoading(false);
        }
      } catch {
        if (active) {
          setAuthLoading(false);
        }
      }
    }
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleAvatarUpdated(e: Event) {
      const avatarUrl = (e as CustomEvent<{ avatarUrl: string | null }>).detail?.avatarUrl ?? null;
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, avatar_url: avatarUrl };
        writeStoredUser(updated);
        return updated;
      });
    }
    window.addEventListener("aikart:avatar-updated", handleAvatarUpdated);
    return () => window.removeEventListener("aikart:avatar-updated", handleAvatarUpdated);
  }, []);

  // Close custom dropdown and mobile custom menu on route navigation
  useEffect(() => {
    setCustomDropdownOpen(false);
    setMobileCustomOpen(false);
  }, [pathname]);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customDropdownRef.current && !customDropdownRef.current.contains(e.target as Node)) {
        setCustomDropdownOpen(false);
      }
    }
    if (customDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [customDropdownOpen]);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  if (minimal) {
    return (
      <header className="gnav">
        <style dangerouslySetInnerHTML={{ __html: GNAV_CSS }} />
        <div className="gnav-in">
          <Link href="/" className="gnav-logo" aria-label="aikart home">
            <img src="/logo/aikart-logo-full.png" alt="aikart" className="gnav-logo-desktop" style={{ height: 28, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
            <img src="/logo/aikart-ai-mark.png" alt="ai" className="gnav-logo-mobile" style={{ height: 38, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
          </Link>
        </div>
      </header>
    );
  }

  const initials = user?.full_name
    ? user.full_name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const gated = (target: string) => (mounted && user ? target : `/auth?redirect=${encodeURIComponent(target)}`);

  const showExplore = !hiddenLinks.includes("explore");
  const showBecomeSeller = !hiddenLinks.includes("becomeSeller");
  const showCustomSolution = !hiddenLinks.includes("customSolution");
  const showLinks = showExplore || showBecomeSeller || showCustomSolution;

  const handleSignOut = async () => {
    writeStoredUser(null);
    setUser(null);
    // signOut() no longer redirects itself (it's a plain fetch call now, not
    // a Server Action — see lib/api-client/auth.ts) — it returns
    // { redirectTo } and this caller navigates, same destination as before.
    const result = await signOut();
    router.push(result.redirectTo || "/auth");
  };

  return (
    <header className="gnav">
      <style dangerouslySetInnerHTML={{ __html: GNAV_CSS }} />
      <div className={`gnav-in ${isDarkTheme ? "gnav-dark-theme" : ""}`}>
        <Link href="/" className="gnav-logo" aria-label="aikart home">
          <img src="/logo/aikart-logo-full.png" alt="aikart" className="gnav-logo-desktop gnav-logo-dark" style={{ height: 34, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
          <img src="/logo/aikart-logo-light.png" alt="aikart" className="gnav-logo-desktop gnav-logo-light" style={{ height: 34, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
          <img src="/logo/aikart-ai-mark.png" alt="ai" className="gnav-logo-mobile" style={{ height: 38, width: "auto", background: "transparent", border: "none", outline: "none", boxShadow: "none", padding: 0 }} />
        </Link>

        {showLinks && (
          <nav className="gnav-links">
            {showExplore && <NavLink href="/explore">Explore</NavLink>}
            {showBecomeSeller && <NavLink href={gated("/seller/profile")}>Become Seller</NavLink>}
            {showCustomSolution && (
              <div className="relative inline-flex items-center" ref={customDropdownRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCustomDropdownOpen((prev) => !prev);
                  }}
                  className={`gnav-link gnav-custom-trigger ${customDropdownOpen ? "gnav-link-active" : ""}`}
                  aria-label="Toggle Custom menu"
                  aria-expanded={customDropdownOpen}
                >
                  <span>Custom</span>
                  <span className={`gnav-custom-arrow ${customDropdownOpen ? "gnav-custom-arrow--open" : ""}`}>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="gnav-custom-arrow-icon"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {customDropdownOpen && (
                  <div className="gnav-custom-dropdown">
                    <Link
                      href={gated("/custom-agents")}
                      onClick={() => setCustomDropdownOpen(false)}
                      className="gnav-dropdown-card"
                      title="Agent Solution Request"
                      aria-label="Agent Solution Request"
                    >
                      <div className="gnav-dropdown-icon">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="gnav-dropdown-title">Agent Solution Request</span>
                    </Link>

                    <div className="gnav-dropdown-divider" />

                    <Link
                      href={gated("/custom-ml-models")}
                      onClick={() => setCustomDropdownOpen(false)}
                      className="gnav-dropdown-card"
                      title="Custom ML Models"
                      aria-label="Custom ML Models"
                    >
                      <div className="gnav-dropdown-icon gnav-dropdown-icon--purple">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="gnav-dropdown-title">Custom ML Models</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
            <button type="button" className="gnav-link gnav-contact-btn" onClick={() => window.dispatchEvent(new CustomEvent("open-contact-modal"))}>Contact Us</button>
          </nav>
        )}

        <div className="gnav-right flex items-center gap-3">
          {extra}
          {showBecomeSellerButton && (
            <Link
              href={gated("/seller/profile")}
              className="gnav-become-seller-btn"
            >
              Become Seller
            </Link>
          )}


          <Link
            href="/inbox"
            className="backdrop-blur-md bg-white/20 border border-white/30 rounded-full p-2 flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/30"
            aria-label="Inbox"
          >
            <img
              src="/icons/mail.png"
              alt="Inbox"
              className="w-5 h-5 object-contain"
            />
          </Link>

          {user ? (
            <NavAvatarMenu initials={initials} avatarUrl={user.avatar_url} isAdmin={user.role?.toLowerCase() === "admin"} signOutAction={handleSignOut} />
          ) : (!mounted || authLoading) ? (
            <div className="gnav-auth-container hidden sm:flex items-center gap-3 opacity-0 pointer-events-none" aria-hidden="true">
              <div className="w-[36px] h-[36px]" />
            </div>
          ) : (
            <div className="gnav-auth-container hidden sm:flex items-center gap-3">
              <Link
                href="/auth"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap px-1"
              >
                Login
              </Link>
              <Link
                href="/auth?tab=signup"
                className="bg-white text-blue-600 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-sm transition-all duration-200 whitespace-nowrap inline-flex items-center justify-center"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Hamburger button visible on mobile with animated 3-line to X transformation */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`gnav-hamburger ${mobileMenuOpen ? "gnav-hamburger--open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="gnav-hamburger-box">
              <span className="gnav-hamburger-line gnav-hamburger-line--1" />
              <span className="gnav-hamburger-line gnav-hamburger-line--2" />
              <span className="gnav-hamburger-line gnav-hamburger-line--3" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer (smooth slide-in from right with glassmorphism) */}
      <div
        className={`gnav-drawer-backdrop ${mobileMenuOpen ? "gnav-drawer-backdrop--open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />
      <div
        ref={menuRef}
        className={`gnav-drawer-panel ${mobileMenuOpen ? "gnav-drawer-panel--open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-white text-xl rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all border border-white/20 cursor-pointer"
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="mt-12 flex flex-col gap-1 px-4">
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 active:bg-white/15 transition-all duration-200"
          >
            Explore
          </Link>
          <Link
            href={gated("/seller/profile")}
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 active:bg-white/15 transition-all duration-200"
          >
            Become Seller
          </Link>
          {showCustomSolution && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setMobileCustomOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 active:bg-white/15 transition-all duration-200 bg-transparent border-none cursor-pointer text-left"
                aria-expanded={mobileCustomOpen}
              >
                <span>Custom</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`opacity-70 transition-transform duration-200 ${
                    mobileCustomOpen ? "rotate-90" : ""
                  }`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {mobileCustomOpen && (
                <div className="flex flex-col gap-2 pl-3 pr-1 py-1.5 animate-fadeIn">
                  <Link
                    href={gated("/custom-agents")}
                    onClick={() => {
                      setMobileCustomOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/15 active:scale-[0.98] border border-white/10 transition-all text-decoration-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="font-medium text-white text-sm">Agent Solution Request</span>
                  </Link>

                  <Link
                    href={gated("/custom-ml-models")}
                    onClick={() => {
                      setMobileCustomOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/15 active:scale-[0.98] border border-white/10 transition-all text-decoration-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-white text-sm">Custom ML Models</span>
                  </Link>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new CustomEvent("open-contact-modal"));
            }}
            className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 active:bg-white/15 transition-all duration-200 text-left w-full cursor-pointer bg-transparent border-none"
          >
            Contact Us
          </button>
          <div className="border-t border-white/20 my-4" />

          {!mounted || authLoading ? (
            <div className="h-[96px] w-full" aria-hidden="true" />
          ) : !user ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-3 px-4 rounded-full border border-white/30 text-white font-medium hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                Login
              </Link>
              <Link
                href="/auth?tab=signup"
                onClick={() => setMobileMenuOpen(false)}
                onTouchStart={() => {}}
                className="block text-center py-3 px-4 rounded-full border border-red-400/60 text-red-400 font-medium hover:bg-red-400/10 active:bg-red-400/20 active:scale-[0.97] transition-all duration-200 bg-transparent select-none"
                style={{
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/inbox"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Inbox
              </Link>
              {user.role?.toLowerCase() === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-white text-lg font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  Admin Portal
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="gnav-drawer-logout block w-full text-center py-3 px-4 rounded-full border border-red-400/60 text-red-400 font-medium hover:bg-red-400/10 transition-colors bg-transparent cursor-pointer"
              >
                Sign Out
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const GNAV_CSS = `
.gnav{
  position:fixed; top:16px; left:0; right:0; z-index:1000; padding:0 24px;
  font-family:var(--font-inter),'Inter',sans-serif;
}
@media(max-width:899px){
  .gnav{ padding:0 16px; top:12px; }
}
@media(min-width:1024px){ .gnav{ padding:0 50px; } }

.gnav-in{
  position:relative;
  /* NO overflow:hidden or transform layer trap — allows backdrop-filter to composite properly */
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  gap:16px;
  height:74px;
  max-width:1340px;
  margin:0 auto;
  padding:0 24px;
  border-radius:50px;
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.10);
}
@media(max-width:899px){
  .gnav-in{
    display:flex;
    justify-content:space-between;
    height:62px;
    padding:0 16px;
    border-radius:40px;
  }
}

.glass-effect-shine{
  display:none;
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))){
  .gnav-in{ background: #ffffff !important; }
  .gnav-dark-theme{ background: #0f172a !important; }
}
.gnav-logo, .gnav-links, .gnav-right{
  position:relative; z-index:1;
}
.gnav-logo{
  font-size:22px; line-height:1; text-decoration:none; flex-shrink:0;
  display:inline-flex; align-items:center; width:fit-content;
  justify-self:start; background:transparent; border:none; padding:0; margin:0;
}
.gnav-links{ display:none; align-items:center; gap:28px; justify-content:center; justify-self:center; }
@media(min-width:1024px){ .gnav-links{ display:flex; min-width:0; } }
.gnav-logo-desktop { display: none !important; }
.gnav-logo-mobile { display: inline-block !important; height: 38px; width: auto; object-fit: contain; background: transparent !important; }

@media(min-width: 640px) {
  .gnav-logo-desktop.gnav-logo-dark { display: inline-block !important; height: 34px; width: auto; }
  .gnav-logo-desktop.gnav-logo-light { display: none !important; height: 34px; width: auto; }
  .gnav-dark-theme .gnav-logo-desktop.gnav-logo-dark { display: none !important; }
  .gnav-dark-theme .gnav-logo-desktop.gnav-logo-light { display: inline-block !important; }
  .gnav-logo-mobile { display: none !important; }
}

.gnav-link{ color:#0f172a; text-decoration:none; font-size:15px; font-weight:400; white-space:nowrap; transition:color 0.3s ease, opacity 0.3s ease, text-shadow 0.3s ease; text-shadow:0 1px 2px rgba(0,0,0,0.28); background:transparent; border:none; padding:0; cursor:pointer; font-family:inherit; }
.gnav-link:hover{ color:#2563eb; }
.gnav-link-active{ color:#2563eb !important; font-weight:400; }

.gnav-dark-theme .gnav-link{ color:#ffffff !important; text-shadow:0 1px 4px rgba(0,0,0,0.6) !important; }
.gnav-dark-theme .gnav-link:hover{ color:#60a5fa !important; }
.gnav-dark-theme .gnav-link-active{ color:#60a5fa !important; }
.gnav-dark-theme .gnav-hamburger{ color:#ffffff !important; }
.gnav-dark-theme .gnav-auth-container a:first-child{ color:#ffffff !important; }

.gnav-custom-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}
.gnav-custom-trigger:hover .gnav-custom-arrow {
  background: #2563eb;
  color: #ffffff;
}
.gnav-dark-theme .gnav-custom-trigger:hover .gnav-custom-arrow {
  background: #60a5fa;
  color: #0f172a;
}
.gnav-custom-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.gnav-custom-arrow-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.gnav-custom-arrow:hover,
.gnav-custom-arrow--open {
  background: #2563eb;
  color: #ffffff;
}
.gnav-custom-arrow--open .gnav-custom-arrow-icon {
  transform: rotate(180deg);
}
.gnav-dark-theme .gnav-custom-arrow {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
.gnav-dark-theme .gnav-custom-arrow:hover,
.gnav-dark-theme .gnav-custom-arrow--open {
  background: #60a5fa;
  color: #0f172a;
}

.gnav-custom-dropdown {
  position: absolute;
  top: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.35) inset;
  z-index: 1050;
  transform-origin: top center;
  animation: gnavDropFromArrow 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.gnav-dark-theme .gnav-custom-dropdown {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(28px) saturate(190%);
  -webkit-backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

@keyframes gnavDropFromArrow {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.92);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
    filter: blur(0px);
  }
}

.gnav-dropdown-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 50px;
  text-decoration: none;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.gnav-dropdown-card:hover {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px -2px rgba(0, 0, 0, 0.08);
}

.gnav-dark-theme .gnav-dropdown-card {
  background: transparent;
  border: 1px solid transparent;
}

.gnav-dark-theme .gnav-dropdown-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 3px 10px -2px rgba(0, 0, 0, 0.3);
}

.gnav-dropdown-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  margin: 0 1px;
  transition: opacity 0.25s ease;
}

.gnav-dark-theme .gnav-dropdown-divider {
  background: rgba(255, 255, 255, 0.14);
}

.gnav-dropdown-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
  flex-shrink: 0;
  transition: transform 0.2s ease, background 0.2s ease;
}

.gnav-dropdown-icon--purple {
  background: rgba(147, 51, 234, 0.12);
  color: #9333ea;
}

.gnav-dark-theme .gnav-dropdown-icon {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.gnav-dark-theme .gnav-dropdown-icon--purple {
  background: rgba(192, 132, 252, 0.2);
  color: #c084fc;
}

.gnav-dropdown-card:hover .gnav-dropdown-icon {
  transform: scale(1.08);
}

.gnav-dropdown-text {
  display: flex;
  flex-direction: column;
}

.gnav-dropdown-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.2;
  white-space: nowrap;
  display: inline-block;
  transition: max-width 0.32s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              margin 0.28s ease;
}

.gnav-dark-theme .gnav-dropdown-title {
  color: #f8fafc;
}

.gnav-dropdown-sub {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.3;
}

.gnav-dark-theme .gnav-dropdown-sub {
  color: #94a3b8;
}

.gnav-become-seller-btn{
  display:inline-flex; align-items:center; justify-content:center;
  padding:8px 18px; background:transparent; color:#0f172a;
  font-family:var(--font-inter),'Inter',sans-serif;
  font-weight:500; font-size:14px; border-radius:50px;
  border:1.5px solid #cbd5e1; text-decoration:none; white-space:nowrap;
  box-shadow:none;
  transition:all 0.3s ease;
}
@media(max-width:1023px){
  .gnav-become-seller-btn{ display:none; }
}
.gnav-become-seller-btn:hover{
  border-color:#2563eb;
  color:#2563eb;
  background:rgba(37,99,235,0.04);
  transform:translateY(-1px);
}
.gnav-dark-theme .gnav-become-seller-btn{ color:#ffffff !important; border-color:rgba(255,255,255,0.4) !important; }
.gnav-dark-theme .gnav-become-seller-btn:hover{ border-color:#60a5fa !important; color:#60a5fa !important; background:rgba(255,255,255,0.1) !important; }

.gnav-right{ display:flex; align-items:center; gap:12px; flex-shrink:0; justify-self:end; }
@media(min-width:900px){ .gnav-right{ gap:18px; } }
.gnav-login{ color:#0f172a; font-weight:400; font-size:15px; text-decoration:none; padding:8px 4px; transition:opacity .2s ease; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,0.28); }
.gnav-login:hover{ opacity:0.8; }
.gnav-signup{
  display:inline-flex; align-items:center; justify-content:center;
  padding:14px 32px; background:#ffffff; color:#2563eb;
  font-weight:500; font-size:15px; border-radius:50px; text-decoration:none;
  white-space:nowrap;
  box-shadow:0 4px 14px rgba(0,0,0,0.1);
  transition:transform .2s ease, filter .2s ease;
}
.gnav-signup:hover{ transform:translateY(-1px); filter:brightness(0.96); }

.gnav-hamburger{
  display:none;
  background:transparent;
  border:none;
  padding:6px;
  cursor:pointer;
  outline:none;
  align-items:center;
  justify-content:center;
  color:#111827;
  transition:color 0.3s ease, opacity 0.2s ease;
}

.gnav-hamburger-box {
  width: 22px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.gnav-hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  border-radius: 2px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, background-color 0.3s ease;
  transform-origin: center;
}

.gnav-hamburger--open .gnav-hamburger-line--1 {
  transform: translateY(7px) rotate(45deg);
}

.gnav-hamburger--open .gnav-hamburger-line--2 {
  opacity: 0;
  transform: scaleX(0);
}

.gnav-hamburger--open .gnav-hamburger-line--3 {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile View Adjustments (<= 768px) */
@media (max-width: 768px) {
  .gnav {
    top: 0;
    left: 0;
    right: 0;
    padding: 0;
  }
  .gnav-in {
    height: 60px !important;
    padding: 0 16px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-radius: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box !important;
    background: rgba(255, 255, 255, 0.10) !important;
    backdrop-filter: blur(32px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(32px) saturate(180%) !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    border-bottom: 1px solid rgba(28, 20, 16, 0.18) !important;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.10) !important;
  }
  .gnav-in.gnav-dark-theme,
  .gnav-dark-theme .gnav-in {
    border-bottom: 1px solid rgba(255, 255, 255, 0.35) !important;
  }
  .gnav-logo img {
    height: 33px !important;
    width: auto !important;
  }
  /* Hide all non-essential nav items on mobile */
  .gnav-schedule-btn,
  .gnav-auth-container,
  .gnav-become-seller-btn,
  .gnav-links {
    display: none !important;
  }
  /* Keep only: logo, avatar (if logged in), hamburger */
  .gnav-hamburger {
    display: flex !important;
    z-index: 200 !important;
    position: relative !important;
    color: #0f172a !important;
    pointer-events: auto !important;
    cursor: pointer !important;
  }
  .gnav-in.gnav-dark-theme .gnav-hamburger,
  .gnav-dark-theme .gnav-hamburger {
    color: #ffffff !important;
  }
  /* Avatar still shows on mobile */
  .gnav-right {
    gap: 10px !important;
    z-index: 100 !important;
    position: relative !important;
    pointer-events: auto !important;
  }
}

/* Mobile Drawer Styles */
.gnav-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}

.gnav-drawer-backdrop.gnav-drawer-backdrop--open {
  opacity: 1;
  pointer-events: auto;
}

.gnav-drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 290px;
  max-width: 85vw;
  height: 100vh;
  height: 100dvh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: rgba(12, 16, 26, 0.72);
  backdrop-filter: blur(36px) saturate(190%);
  -webkit-backdrop-filter: blur(36px) saturate(190%);
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: none;
  transform: translate3d(100%, 0, 0);
  visibility: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
  overflow-y: auto;
  pointer-events: none;
  will-change: transform;
}

.gnav-drawer-panel.gnav-drawer-panel--open {
  transform: translate3d(0, 0, 0);
  visibility: visible;
  box-shadow: -12px 0 36px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}

.gnav-drawer-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #334155;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.gnav-drawer-close:hover {
  background: #f1f5f9;
}

.gnav-drawer-links {
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gnav-drawer-link {
  display: block;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 500;
  color: #0f172a;
  text-decoration: none;
  border-radius: 12px;
  transition: background 0.2s ease, color 0.2s ease;
}

.gnav-drawer-link:hover {
  background: #f8fafc;
  color: #2563eb;
}

.gnav-drawer-auth {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gnav-drawer-login {
  display: block;
  text-align: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  border: 1.5px solid #cbd5e1;
  border-radius: 50px;
  text-decoration: none;
}

.gnav-drawer-signup {
  display: block;
  text-align: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background: #2563eb;
  border-radius: 50px;
  text-decoration: none;
}

.gnav-drawer-logout {
  display: block;
  width: 100%;
  text-align: center;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #ef4444;
  border: 1.5px solid #fca5a5;
  border-radius: 50px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gnav-drawer-logout:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.gnav-avatar-wrap{ position:relative; display:inline-flex; align-items:center; }
.gnav-avatar{
  width:36px; height:36px; border-radius:50%;
  background:#2563eb; color:#fff;
  font-size:13px; font-weight:600;
  display:inline-flex; align-items:center; justify-content:center;
  border:none; cursor:pointer; flex-shrink:0;
  transition:opacity .2s ease;
}
.gnav-avatar:hover{ opacity:0.85; }
.gnav-menu{
  min-width:180px;
  background:#ffffff;
  border:1px solid #e2e8f0;
  border-radius:14px;
  box-shadow:0 8px 30px rgba(0,0,0,0.12);
  padding:6px;
  display:flex;
  flex-direction:column;
}
.gnav-menu-item{
  display:block; width:100%;
  padding:10px 14px;
  font-size:14px; font-weight:400;
  color:#0f172a; text-decoration:none;
  border-radius:8px; border:none;
  background:transparent; cursor:pointer;
  text-align:left;
  transition:background .15s ease;
}
.gnav-menu-item:hover{ background:#f1f5f9; }
.gnav-menu-item--danger{ color:#ef4444; }
.gnav-menu-item--danger:hover{ background:#fef2f2; }
.gnav-menu-divider{
  height:1px; background:#e2e8f0; margin:4px 0;
}

@keyframes gnavModalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes gnavModalScaleUp {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: gnavModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-scaleUp {
  animation: gnavModalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;