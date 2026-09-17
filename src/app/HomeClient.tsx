"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { ToolsWeWorkWith } from "@/components/layout/ToolsWeWorkWith";
import type { CSSProperties } from "react";
import type { HomeData } from "@/lib/home-data";
import { API_BASE } from "@/lib/api-client/config";

const A = "/figma"; // downloaded Figma assets in /public/figma

// All 4 step frames fill the fixed 471×588 bounding box (aspect-ratio ≈ 0.800).
// object-fit:cover fills each frame edge-to-edge with no white space; per-image
// object-position anchors each photo's key subject within the crop window.
// Native image dimensions (for reference — NOT used for sizing):
//   image471: 860 × 1075 (AR 0.800 — nearly matches frame, minimal crop)
//   image475: 1536 × 1024 (AR 1.500 — landscape, crops top+bottom, center anchored)
//   image473: 832 × 1248 (AR 0.667 — tall portrait, crops sides, center anchored)
//   image474: 1254 × 1254 (AR 1.000 — square, crops top+bottom, top-biased anchor)
const STEPS = [
  { img: "/images/earth_low_white_part.jpg", n: "01", title: "Discover", sub: "Search 500+ verified AI solutions by business need.", color: "#aa7a45", imgPos: "center center" },
  { img: "image475.png", n: "02", title: "Compare", sub: "Evaluate features, integrations, pricing & reviews.", color: "#475d56", imgPos: "center 30%" },
  { img: "image473.png", n: "03", title: "Try Sandbox", sub: "Test the AI live before committing a dollar.", color: "#f87531", imgPos: "center 30%" },
  { img: "/images/mobile/aikart-408x230-centered-angled.png", n: "04", title: "Buy", sub: "Purchase securely and deploy in minutes.", color: "#2563eb", imgPos: "center" },
];

const MARKETPLACE = [
  { title: "Live Sandbox Testing", sub: "Try any AI before you buy.", img: "image456.png", light: false, href: "/explore", pos: "top" },
  { title: "Verified AI Providers", sub: "Every seller vetted for quality.", img: "/images/verified-shield-glass.png", light: true, href: "/explore", pos: "bottom-left" },
  { title: "Compare Solutions", sub: "Side-by-side, transparent.", img: "image460.png", light: false, href: "/explore", pos: "top" },
  { title: "Business Use Cases", sub: "Browse by real outcomes.", img: "image458.png", light: false, href: "/explore", pos: "bottom" },
  { title: "Enterprise Ready", sub: "SOC2, SSO & procurement.", img: "image463.png", light: false, href: "/explore", pos: "top" },
];

const NEEDS = [
  { img: "image467.png", title: "Customer Support", sub: "Deflect tickets and resolve issues 24/7.", cat: "Customer Service", round: true },
  { img: "image468.png", title: "Sales Automation", sub: "AI SDRs, lead scoring & pipeline copilots.", cat: "Sales", round: false },
  { img: "image469.png", title: "Marketing", sub: "On-brand content & campaigns at scale.", cat: "Marketing", round: false },
  { img: "image470.png", title: "HR & Recruitment", sub: "Screen, rank and onboard faster.", cat: "HR", round: false },
];

const SELLER = [
  { n: "01", title: "Create Account", color: "#ffa600" },
  { n: "02", title: "Upload Product", color: "#22c55e" },
  { n: "03", title: "Configure Sandbox", color: "#b200ff" },
  { n: "04", title: "Set Pricing", color: "#ef4343" },
  { n: "05", title: "Publish", color: "#05d6c1" },
  { n: "06", title: "Receive Customers", color: "#f87531" },
];

function CustomCompanySizeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "500+", label: "500+ employees" },
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-200 rounded-lg px-4 py-3 w-full text-sm bg-white cursor-pointer flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 text-left transition-colors"
      >
        <span className="text-gray-900 font-normal">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 overflow-hidden animate-in fade-in duration-200 ease-out">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm flex items-center justify-between transition-colors text-gray-800"
              >
                <span className={isSelected ? "font-medium text-blue-600" : "text-gray-700"}>
                  {opt.label}
                </span>
                {isSelected && (
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomeClient({ data }: { data: HomeData }) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string | null } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  /* ── Hero Video (plays once on load and holds on final frame) ── */
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => { });
    }
  }, []);

  /* ── Typewriter search hint ── */
  const [twText, setTwText] = useState("");
  const [twPhraseIdx, setTwPhraseIdx] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

  /* ── Marketplace carousel step-based auto-scroll (1.2s hold + 0.45s slide) ── */
  const mktRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInteractingRef = useRef(false);
  const autoStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollAnimRef = useRef<number | null>(null);

  /** Returns the width of the first marketplace card + gap so scroll increments match actual card size. */
  const getCardStep = useCallback(() => {
    const el = mktRef.current;
    if (!el) return 382;
    const firstCard = el.querySelector<HTMLElement>(".hm-mkt-card");
    return firstCard ? firstCard.offsetWidth + 28 : 382; // 28 = gap
  }, []);

  const smoothScrollTo = useCallback((element: HTMLElement, targetLeft: number, duration = 550) => {
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
    const startLeft = element.scrollLeft;
    const distance = targetLeft - startLeft;
    if (distance === 0) return;
    const startTime = performance.now();

    // Smooth cubic ease-in-out for fluid acceleration and deceleration
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      element.scrollLeft = startLeft + distance * easedProgress;

      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimRef.current = null;
      }
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  }, []);

  const advanceNextCard = useCallback(() => {
    const el = mktRef.current;
    if (!el) return;
    const step = getCardStep();
    let currentIdx = Math.round(el.scrollLeft / step);

    if (currentIdx >= MARKETPLACE.length) {
      el.scrollLeft = (currentIdx % MARKETPLACE.length) * step;
      currentIdx = currentIdx % MARKETPLACE.length;
    }

    const nextIdx = currentIdx + 1;
    smoothScrollTo(el, nextIdx * step, 550);
    setActiveIndex(nextIdx % MARKETPLACE.length);
  }, [getCardStep, smoothScrollTo]);

  const scheduleNextStep = useCallback(() => {
    if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
    // Hold each card for exactly 1.2s (1200ms), then run 550ms smooth ease-in-out transition
    autoStepTimerRef.current = setTimeout(() => {
      if (!isInteractingRef.current) {
        advanceNextCard();
      }
      scheduleNextStep();
    }, 1750); // 1200ms hold + 550ms transition
  }, [advanceNextCard]);

  const pauseInteraction = useCallback((duration = 3500) => {
    isInteractingRef.current = true;
    if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
    autoStepTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      scheduleNextStep();
    }, duration);
  }, [scheduleNextStep]);

  useEffect(() => {
    scheduleNextStep();
    return () => {
      if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [scheduleNextStep]);

  const scrollMkt = (dir: 1 | -1) => {
    const el = mktRef.current;
    if (!el) return;
    pauseInteraction(3500);
    const step = getCardStep();
    let currentIdx = Math.round(el.scrollLeft / step);

    if (dir === 1) {
      if (currentIdx >= MARKETPLACE.length) {
        el.scrollLeft = (currentIdx % MARKETPLACE.length) * step;
        currentIdx = currentIdx % MARKETPLACE.length;
      }
      smoothScrollTo(el, (currentIdx + 1) * step, 550);
      setActiveIndex((currentIdx + 1) % MARKETPLACE.length);
    } else {
      if (currentIdx <= 0) {
        el.scrollLeft += MARKETPLACE.length * step;
        currentIdx += MARKETPLACE.length;
      }
      smoothScrollTo(el, (currentIdx - 1) * step, 550);
      setActiveIndex((currentIdx - 1 + MARKETPLACE.length) % MARKETPLACE.length);
    }
  };

  const onMktMouseEnter = () => {
    isInteractingRef.current = true;
    if (autoStepTimerRef.current) clearTimeout(autoStepTimerRef.current);
  };

  const onMktMouseLeave = () => {
    pauseInteraction(600);
  };

  /* ── Business Need marquee: pause-on-hover/touch handled via React state ── */
  const [needPaused, setNeedPaused] = useState(false);

  /* ── How AIKart Works: Staggered scroll-triggered fade/slide in ── */
  const stepsSectionRef = useRef<HTMLElement>(null);
  const [stepsVisible, setStepsVisible] = useState(false);

  useEffect(() => {
    const el = stepsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStepsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }).then((r) => { if (r.ok) r.json().then(setUser); });
  }, []);

  /* ── Seller step cards: auto-play timed reveal (IntersectionObserver) ── */
  const flowRef = useRef<HTMLDivElement>(null);

  /* ── Seller steps: auto-play timed reveal on viewport entry ───────────────
     Fires an IntersectionObserver on the card grid. On each entry it runs a
     staggered sequence: card 0 at 0ms, card 1 at 620ms … card 5 at 3100ms
     (total ≤ 4 s). On exit it resets all cards to hidden so the animation
     replays the next time the section scrolls back into view.
     Works alongside the scroll-scrub effect — both write opacity/transform
     directly to el.style, so they are compatible (scroll scrub wins once
     the user starts scrolling through the 700vh track).
  ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const flowEl = flowRef.current;
    if (!flowEl) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const cards = Array.from(flowEl.querySelectorAll<HTMLElement>(".hm-scard"));
    const conns = Array.from(flowEl.querySelectorAll<HTMLElement>(".hm-conn"));

    const CARD_DELAY = 400;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const resetCards = () => {
      timers.forEach(clearTimeout);
      timers = [];
      cards.forEach(c => { c.style.opacity = "0"; c.style.transform = "translateX(-40px)"; });
      conns.forEach(c => c.style.setProperty("--t", "0"));
    };

    const playSequence = () => {
      timers.forEach(clearTimeout);
      timers = [];

      if (reduce) {
        // instant reveal, no stagger
        cards.forEach(c => { c.style.opacity = "1"; c.style.transform = "translateX(0)"; });
        conns.forEach(c => c.style.setProperty("--t", "1"));
        return;
      }

      cards.forEach((card, i) => {
        // arrow fires 200ms BEFORE its next card appears
        const connIdx = i - 1;
        if (connIdx >= 0 && conns[connIdx]) {
          timers.push(setTimeout(() => {
            conns[connIdx].style.transition = "--t 0.4s ease-out";
            conns[connIdx].style.setProperty("--t", "1");
          }, i * CARD_DELAY - 200));
        }
        timers.push(setTimeout(() => {
          card.style.transition = "opacity 0.45s ease-out, transform 0.45s ease-out";
          card.style.opacity = "1";
          card.style.transform = "translateX(0)";
        }, i * CARD_DELAY));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            playSequence();
          } else {
            resetCards();
          }
        });
      },
      { threshold: 0.15 } // trigger when 15% of the grid is visible
    );

    resetCards(); // start hidden before first intersection
    observer.observe(flowEl);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  /* ── Search hints: real agent titles first, fallback if DB is empty ── */
  const HINT_FALLBACKS = [
    "ChatSupport",
    "SalesBot",
    "ContentCraft",
    "RecruitAI",
    "CodePilot",
    "LegalMind",
  ];
  const realNames = [...data.featured, ...data.trending]
    .map((a) => a.title?.trim())
    .filter((title): title is string => Boolean(title) && title.length > 0 && title.length <= 14)
    .slice(0, 6);
  const searchHints = realNames.length >= 3 ? realNames : HINT_FALLBACKS;

  /* ── Typewriter hint: letter-by-letter type → pause → delete → next phrase ── */
  useEffect(() => {
    if (searchValue || searchFocused) return; // pause while user interacts
    const phrases = searchHints;
    const current = phrases[twPhraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!twDeleting && twText.length < current.length) {
      // typing forward, one character at a time
      t = setTimeout(() => setTwText(current.slice(0, twText.length + 1)), 50);
    } else if (!twDeleting && twText.length === current.length) {
      // full phrase typed — pause before deleting
      t = setTimeout(() => setTwDeleting(true), 1300);
    } else if (twDeleting && twText.length > 0) {
      // deleting backward, one character at a time
      t = setTimeout(() => setTwText(current.slice(0, twText.length - 1)), 30);
    } else if (twDeleting && twText.length === 0) {
      // move to next phrase
      t = setTimeout(() => {
        setTwDeleting(false);
        setTwPhraseIdx((p) => (p + 1) % phrases.length);
      }, 50);
    }
    return () => clearTimeout(t);
  }, [twText, twDeleting, twPhraseIdx, searchValue, searchFocused, searchHints]);

  // Hero search: logged-in users go to Explore carrying the typed keyword
  // (Enter = keyword search, the "AI" button = AI-powered search). Not-logged-in
  // users are sent to login (redirecting back to a bare Explore afterwards — the
  // query is intentionally dropped).
  const runSearch = (ai: boolean) => {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent("/explore")}`);
      return;
    }
    const q = searchValue.trim();
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (ai && q) sp.set("ai", "1");
    const qs = sp.toString();
    router.push(qs ? `/explore?${qs}` : "/explore");
  };

  const catSet = new Set(data.categories.map((c) => c.category.toLowerCase()));
  const needHref = (preferred: string) =>
    catSet.has(preferred.toLowerCase()) ? `/explore?category=${encodeURIComponent(preferred)}` : "/explore";

  return (
    <div className="hm">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ─── HERO ─── */}
      <section className="hm-hero">
        <div
          className="hm-hero-video-wrap"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          <video
            ref={videoRef}
            src="/hero.mp4"
            autoPlay
            muted
            playsInline
            className="hm-hero-video"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              imageRendering: "high-quality" as CSSProperties["imageRendering"],
            }}
          />
        </div>
        <div className="hm-hero-veil" />
        <div className="hm-hero-fade" />
        <div className="hm-container hm-hero-in">
          <h1 className="ff-redhat hm-hero-title">
            Discover, Test &amp; Buy <span className="hm-grad">AI Solutions</span><br className="hm-hero-br" />for Your Business
          </h1>
          <div className="hm-pills ff-inter">
            <span>
              <span className="hm-pill-check">✓</span>
              Test ai agents for free
            </span>
            <span>
              <span className="hm-pill-check">✓</span>
              Verified providers
            </span>
          </div>
          <div className="hm-search ff-inter" style={{ position: "relative" }}>
            <Image src={`${A}/image484.png`} alt="" width={20} height={20} className="hm-search-ic" style={{ objectFit: "contain", opacity: 0.7 }} />
            <div style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden" }}>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(false); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={searchValue === "" && !searchFocused ? " " : "Search AI agents..."}
                aria-label="Search AI agents"
              />
              {/* Typewriter placeholder overlay — hidden once user focuses or types */}
              {searchValue === "" && !searchFocused && (
                <span className="hm-srch-ph ff-inter" aria-hidden="true">
                  <span className="hm-srch-ph-typed">
                    {twText}
                    <span className="hm-srch-ph-cursor">|</span>
                  </span>
                </span>
              )}
            </div>
            <button type="button" onClick={() => runSearch(true)} className="hm-search-ai" aria-label="Search with AI">
              <img src="/logo/aikart-ai-mark-white.png" alt="AI" style={{ height: "18px", width: "auto", objectFit: "contain", display: "block" }} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── THE MARKETPLACE ─── */}
      <section className="hm-section isolate pt-24 pb-20 lg:pt-28 lg:pb-20">
        <div className="hm-container">
          <div className="hm-mkt-header">
            <div>
              <p className="hm-eyebrow hm-grad" style={{ marginBottom: '14px' }}>THE MARKETPLACE</p>
              <h2 className="ff-redhat hm-h2">Everything you need to buy AI with confidence</h2>
            </div>
            <div className="hm-mkt-arrows">
              <button
                type="button"
                aria-label="Scroll left"
                className={`hm-mkt-arrow${!canScrollLeft ? ' hm-mkt-arrow--disabled' : ''}`}
                disabled={!canScrollLeft}
                onClick={() => scrollMkt(-1)}
              >
                {/* Chevron Left SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                className={`hm-mkt-arrow${!canScrollRight ? ' hm-mkt-arrow--disabled' : ''}`}
                disabled={!canScrollRight}
                onClick={() => scrollMkt(1)}
              >
                {/* Chevron Right SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
            </div>
          </div>
          <div className="hm-mkt-wrap">
            <div
              className="hm-mkt"
              ref={mktRef}
              onMouseEnter={onMktMouseEnter}
              onMouseLeave={onMktMouseLeave}
              onTouchStart={onMktMouseEnter}
              onTouchEnd={onMktMouseLeave}
            >
              {[...MARKETPLACE, ...MARKETPLACE, ...MARKETPLACE].map((c, idx) => {
                const isClone = idx >= MARKETPLACE.length;
                const isActive = (idx % MARKETPLACE.length) === (activeIndex % MARKETPLACE.length);
                return (
                  <Link
                    key={`${c.title}-${idx}`}
                    href={c.href}
                    aria-hidden={isClone ? "true" : undefined}
                    tabIndex={isClone ? -1 : undefined}
                    className={`hm-mkt-card ${c.light ? "hm-mkt-card--light" : ""} ${isActive ? "hm-mkt-card--active" : "hm-mkt-card--peek"} ${c.pos ? `hm-mkt-card--${c.pos}` : ""}`}
                    draggable={false}
                  >
                    {c.title === "Verified AI Providers" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4 sm:pt-6 pb-10 sm:pb-12">
                        <div className="relative w-[360px] h-[360px] max-w-[360px] max-h-[360px] mx-auto">
                          <Image
                            src="/images/verified-shield-glass.png"
                            alt={c.title}
                            fill
                            sizes="360px"
                            style={{ objectFit: "contain" }}
                            className="object-contain"
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="hm-marketplace-image">
                        <Image
                          src={`${A}/${c.img}`}
                          alt=""
                          fill
                          sizes="(max-width:640px) 88vw, 80vw"
                          style={{ objectFit: "cover", objectPosition: "center" }}
                          className="hm-mkt-img"
                          draggable={false}
                        />
                      </div>
                    )}
                    {!c.light && <div className="hm-mkt-shade" />}
                    <div className="hm-mkt-body">
                      <h3 className="ff-poppins">{c.title}</h3>
                      <p className="ff-inter">{c.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── BY BUSINESS NEED ─── */}
      <section
        className="hm-need-sec py-20"
        style={{
          backgroundImage: "linear-gradient(-45deg, #D8E5FF, #E2D1FF, #F5DAFF, #FFF0C7)",
          backgroundSize: "300% 300%",
          animation: "gradientShift 8s ease infinite",
        }}
      >
        <div className="hm-container hm-need-in">
          <div>
            <p className="hm-eyebrow hm-grad">BY BUSINESS NEED</p>
            <h2 className="ff-redhat hm-h2" style={{ color: "#0f172a" }}>Find AI Solutions by Business Need</h2>
          </div>
          <div
            className="hm-need-viewport"
            onMouseEnter={() => setNeedPaused(true)}
            onMouseLeave={() => setNeedPaused(false)}
            onTouchStart={() => setNeedPaused(true)}
            onTouchEnd={() => setNeedPaused(false)}
          >
            <div
              className="hm-need-track"
              style={{ animationPlayState: needPaused ? "paused" : "running" }}
            >
              {[...NEEDS, ...NEEDS].map((c, i) => (
                <Link
                  key={`${c.title}-${i}`}
                  href={needHref(c.cat)}
                  className="hm-need-card flex-shrink-0 shrink-0 flex flex-col items-center text-center justify-center"
                >
                  <div className="hm-need-imgwrap mx-auto flex items-center justify-center">
                    <Image
                      src={`${A}/${c.img}`}
                      alt=""
                      width={120}
                      height={120}
                      className="w-28 h-28 max-w-[112px] max-h-[112px] object-contain mx-auto"
                      style={{ objectFit: "contain", borderRadius: c.round ? "50%" : undefined }}
                    />
                  </div>
                  <h3 className="ff-poppins text-center w-full">{c.title}</h3>
                  <p className="ff-inter text-center w-full">{c.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW AIKART WORKS ─── */}
      <section ref={stepsSectionRef} className="hm-section py-20">
        <div className="hm-container">
          <div className="mb-10">
            <p className="hm-eyebrow hm-grad">HOW AIKART WORKS</p>
            <h2 className="ff-redhat hm-h2">From discovery to deployment in four steps</h2>
          </div>

          {/* Desktop Wrapper (lg:): 4 cards in one row, equal width, staggered entrance */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div
                key={step.n}
                className="group bg-transparent border-none shadow-none lg:w-auto w-[75vw] flex-shrink-0 snap-start flex flex-col"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 120}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 120}ms`,
                }}
              >
                <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] group-hover:-translate-y-1 transition-all duration-300 ease-out">
                  <Image
                    src={step.img.startsWith("/") ? step.img : `${A}/${step.img}`}
                    alt={step.title}
                    fill
                    sizes="(max-width: 1024px) 75vw, 25vw"
                    style={{ objectFit: "cover", objectPosition: step.imgPos }}
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="pt-4 pb-2 px-1 flex-1 flex flex-col bg-transparent">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-[26px] font-medium tracking-tight" style={{ color: step.color }}>{step.n}</span>
                    <h3 className="text-2xl sm:text-[26px] font-semibold tracking-tight leading-snug" style={{ color: step.color }}>{step.title}</h3>
                  </div>
                  <p className="text-sm font-normal text-gray-500 mt-2 leading-relaxed">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Wrapper (below lg:): horizontal swipe scroll, cards peek (75vw each) */}
          <div className="flex lg:hidden flex-row overflow-x-auto gap-4 pb-4 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {STEPS.map((step, idx) => (
              <div
                key={step.n}
                className="group bg-transparent border-none shadow-none w-[75vw] flex-shrink-0 snap-start flex flex-col"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 100}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 100}ms`,
                }}
              >
                <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] group-hover:-translate-y-1 transition-all duration-300 ease-out">
                  <Image
                    src={step.img.startsWith("/") ? step.img : `${A}/${step.img}`}
                    alt={step.title}
                    fill
                    sizes="75vw"
                    style={{ objectFit: "cover", objectPosition: step.imgPos }}
                    className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="pt-4 pb-2 px-1 flex-1 flex flex-col bg-transparent">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-[26px] font-medium tracking-tight" style={{ color: step.color }}>{step.n}</span>
                    <h3 className="text-2xl sm:text-[26px] font-semibold tracking-tight leading-snug" style={{ color: step.color }}>{step.title}</h3>
                  </div>
                  <p className="text-sm font-normal text-gray-500 mt-2 leading-relaxed">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE PROCESS (seller, dark) ─── */}
      <section className="hm-process py-20" data-navbar-theme="dark">
        <div className="hm-container">
          <div className="hm-process-grid">
            <div className="hm-process-left">
              <p className="hm-eyebrow hm-grad">THE PROCESS</p>
              <h2 className="ff-redhat hm-h2" style={{ color: "#fff" }}>Launch in six steps, seller side</h2>
              <p className="ff-inter hm-process-sub">List, configure and start receiving customers the full seller journey, end to end.</p>
            </div>

            <div className="hm-flow" ref={flowRef}>
              {[0, 1].map((row) => (
                <div className="hm-frow" key={row}>
                  {SELLER.slice(row * 3, row * 3 + 3).map((s, i) => {
                    const idx = row * 3 + i;
                    return (
                      <div
                        key={s.n}
                        className="hm-scard"
                        style={{ "--c": s.color, "--i": idx } as CSSProperties}
                      >
                        {i > 0 && (
                          <span
                            className="hm-conn"
                            aria-hidden="true"
                            style={{ "--to": s.color, "--i": idx } as CSSProperties}
                          />
                        )}
                        <span className="ff-inter hm-scard-n">{s.n}</span>
                        <div className="hm-scard-foot">
                          <span className="hm-scard-rule" aria-hidden="true" />
                          <span className="ff-poppins hm-scard-t">{s.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="hm-cta">
            <div>
              <h3 className="ff-redhat">Ready to try AI before you buy?</h3>
              <p className="ff-inter">Explore verified solutions with live sandbox access.</p>
            </div>
            <Link href="/explore" className="hm-cta-btn ff-inter">Explore</Link>
          </div>
        </div>
      </section>

      {/* ─── TOOLS SECTION ─── */}
      <ToolsWeWorkWith />

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}

const CSS = `
.hm{ background:#f4f4f4; color:#0f172a; }
.hm-container{ width:100%; max-width:1200px; margin:0 auto; padding-left:16px; padding-right:16px; }
@media(min-width:640px){ .hm-container{ padding-left:24px; padding-right:24px; } }
@media(min-width:1024px){ .hm-container{ padding-left:40px; padding-right:40px; } }

.ff-redhat{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; }
.ff-inter{ font-family:var(--font-inter),'Inter',sans-serif; }
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ff-sansita{ font-family:'Sansita One','Sansita',cursive; }
.ff-jura{ font-family:var(--font-jura),'Jura',sans-serif; }
.ff-roboto{ font-family:var(--font-roboto),'Roboto',sans-serif; }

@keyframes hm-gradientShift{
  0%{ background-position:0% 50%; }
  100%{ background-position:200% 50%; }
}

/* Single reusable animated text gradient */
.hm-grad,
.hm-grad-exact,
.animatedGradient,
.hm-animated-gradient{
  display:inline-block;
  font-weight:inherit;
  font-family:inherit;
  background:linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%);
  background-size:200% 100%;
  background-position:0% 50%;
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
  animation:hm-gradientShift 6s linear infinite;
}

.hm-hero .hm-grad{
  text-shadow:none;
  filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4)) drop-shadow(0 0px 12px rgba(0,0,0,0.25));
}

@media (prefers-reduced-motion: reduce){
  .hm-grad, .hm-grad-exact, .animatedGradient, .hm-animated-gradient, .hm-hero .hm-grad, .hm-need-band, .hm-cta{
    animation:none !important;
    background-position:0% 50% !important;
  }
}

.hm-eyebrow{ font-family:var(--font-inter),sans-serif; font-weight:600; font-size:14px; letter-spacing:.18em; text-transform:uppercase; margin:0 0 14px; }
.hm-h2{ font-weight:500; font-size:clamp(28px,3.2vw,40px); line-height:1.14; letter-spacing:-.01em; color:#0f172a; margin:0 0 44px; max-width:640px; }

/* HERO */
.hm-hero{ position:relative; min-height:600px; display:block; overflow:hidden; }
.hm-hero-video-wrap{
  position:absolute; inset:0; width:100%; height:100%; z-index:1; pointer-events:none;
  will-change:transform; backface-visibility:hidden; -webkit-backface-visibility:hidden;
}
.hm-hero-video{
  width:100%; height:100%; object-fit:cover; object-position:center;
  pointer-events:none;
  image-rendering:high-quality;
  image-rendering:-webkit-optimize-contrast;
  transition:filter 0.5s ease;
}
.hm-hero-video--frozen{
  filter:brightness(0.98);
}
.hm-hero-veil{ position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.48) 75%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0) 100%); z-index:2; }
.hm-hero-fade{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:120px;
  background:linear-gradient(to bottom, rgba(244,244,244,0) 0%, rgba(244,244,244,0) 25%, rgba(244,244,244,0.35) 55%, rgba(244,244,244,0.85) 82%, #f4f4f4 100%);
  z-index:3;
  pointer-events:none;
}
.hm-hero-in{ position:relative; min-height:inherit; padding-top:472px; padding-bottom:80px; padding-left:12px; padding-right:97px; z-index:4; }
.hm-hero-title{ max-width:800px; width:100%; height:auto; overflow:visible; font-weight:500; color:#fff; font-size:48px; line-height:64px; letter-spacing:0; margin:0; text-shadow:0 1px 4px rgba(0,0,0,0.25); }

.hm-pills{ display:flex; flex-wrap:wrap; gap:12px; margin-top:7px; margin-bottom:24px; }
.hm-pills > span, .hm-pill{
  display:inline-flex; align-items:center; gap:7px; padding:7px 16px;
  background:rgba(255, 255, 255, 0.10);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  border:1.5px solid rgba(255, 255, 255, 0.7);
  border-radius:50px;
  color:white;
  font-size:13px;
  font-weight:400;
  white-space:nowrap;
}
.hm-pill-check{
  color:white;
  font-weight:400;
  font-size:13px;
  background:transparent !important;
  border:none !important;
  padding:0 !important;
  margin:0 !important;
  border-radius:0 !important;
  box-shadow:none !important;
  display:inline !important;
}

.hm-search{ display:flex; align-items:center; gap:6px; width:567px; max-width:567px; height:54px; margin-top:0px; background:#fff; border-radius:999px; padding:0 7px 0 22px; box-shadow:0 18px 50px rgba(6,15,40,0.28); }
.hm-search-ic{ width:20px; height:20px; object-fit:contain; opacity:.7; }
.hm-search input{ width:100%; border:none; outline:none; background:transparent; font-size:16px; color:#0f172a; padding:0 14px; }
.hm-search input::placeholder{ color:transparent; }

@keyframes hm-blink{ 0%,50%{ opacity:1; } 51%,100%{ opacity:0; } }
.hm-srch-ph{ position:absolute; inset:0; display:flex; align-items:center; padding:0 14px; pointer-events:none; user-select:none; white-space:nowrap; overflow:hidden; max-width:100%; font-size:16px; color:#94a3b8; font-weight:400; }
.hm-srch-ph-static{ color:inherit; font-weight:inherit; }
.hm-srch-ph-typed{ color:inherit; font-weight:inherit; }
.hm-srch-ph-cursor{ display:inline-block; margin-left:1px; animation:hm-blink 1.06s step-end infinite; }
.hm-hero-br{ display:inline; }
.hm-search-ai{ height:40px; padding:0 20px; border:1.5px solid #2563eb; border-radius:999px; background:#2563eb; color:#ffffff; font-weight:700; font-size:15px; cursor:pointer; transition:all 0.2s ease; }
.hm-search-ai:hover{ background:#ffffff; color:#2563eb; border:1.5px solid #2563eb; }

@media(max-width:768px){
  /* ─── GLOBAL MOBILE RESET ─── */
  *, *::before, *::after {
    box-sizing: border-box !important;
    max-width: 100% !important;
  }
   
  html, body {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .hm {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }

  /* ─── CONVERT ALL FIXED WIDTHS TO RELATIVE & STACK ─── */

  /* Hero */
  .hm-hero {
    width: 100% !important;
    max-width: 100% !important;
    min-height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    position: relative !important;
    display: block !important;
  }

  .hm-hero-video-wrap {
    display: none !important;
    width: 100% !important;
    max-width: 100% !important;
    left: 0 !important;
    right: 0 !important;
  }

  .hm-hero::before {
    content: '' !important;
    position: absolute !important;
    inset: 0 !important;
    background-image: url('/office_team_portrait.webp') !important;    background-size: cover !important;
    background-position: center top !important;
    z-index: 0 !important;
    width: 100vw !important;
    min-width: 100vw !important;
    max-width: 100vw !important;
    left: 0 !important;
    right: 0 !important;
  }

  .hm-hero-veil {
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.25) 0%,
      rgba(0,0,0,0.60) 100%
    ) !important;
    z-index: 1 !important;
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
  }

  .hm-hero-in {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 20px !important;
    padding-right: 20px !important;
    box-sizing: border-box !important;
    position: relative !important;
    z-index: 2 !important;
    padding-top: 0 !important;
    padding-bottom: 48px !important;
    min-height: 100dvh !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-end !important;
    align-items: flex-start !important;
    gap: 14px !important;
    flex: 1 !important;
  }

  /* All containers */
  .hm-container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 16px !important;
    box-sizing: border-box !important;
  }

  /* Marketplace */
  .hm-mkt-wrap {
    width: 100% !important;
    overflow: hidden !important;
  }
  .hm-mkt {
    width: 100% !important;
    max-width: 100vw !important;
    margin: 0 !important;
    padding: 0 16px 12px !important;
    box-sizing: border-box !important;
    display: flex !important;
    gap: 14px !important;
    overflow-x: auto !important;
  }
  .hm-mkt-card {
    width: 85vw !important;
    flex: 0 0 85vw !important;
    max-width: 85vw !important;
    aspect-ratio: 16 / 10 !important;
    border-radius: 18px !important;
    scroll-snap-align: start !important;
  }
  .hm-mkt-body {
    top: 16px !important;
    left: 16px !important;
    right: 16px !important;
  }
  .hm-mkt-card--bottom .hm-mkt-body,
  .hm-mkt-card--bottom-left .hm-mkt-body {
    bottom: 16px !important;
    top: auto !important;
  }
  .hm-mkt-header {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    align-items: flex-start !important;
    gap: 8px !important;
    margin-bottom: 16px !important;
  }
  .hm-mkt-body h3 {
    font-size: 18px !important;
    line-height: 24px !important;
  }
  .hm-mkt-body p {
    font-size: 14px !important;
    line-height: 20px !important;
  }

  /* Business Need */
  .hm-need-sec {
    width: 100% !important;
    overflow: hidden !important;
    padding: 40px 0 !important;
  }
  .hm-need-in {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  .hm-need-viewport {
    overflow: hidden !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .hm-need-track {
    animation-duration: 15s !important;
    display: flex !important;
    gap: 22px !important;
    width: max-content !important;
  }
  .hm-need-card {
    flex: 0 0 70vw !important;
    width: 70vw !important;
    height: 280px !important;
    border-radius: 16px !important;
    padding: 14px 12px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
  }
  .hm-need-imgwrap {
    width: 120px !important;
    height: 120px !important;
    border-radius: 50% !important;
    margin-bottom: 10px !important;
    position: static !important;
  }
  .hm-need-card h3 {
    font-size: 18px !important;
    margin-bottom: 4px !important;
    text-align: center !important;
    position: static !important;
    width: 100% !important;
  }
  .hm-need-card p {
    width: 100% !important;
    max-width: 190px !important;
    font-size: 14px !important;
    line-height: 20px !important;
    text-align: center !important;
    position: static !important;
  }

  /* How Aikart Works */
  .hm-works-outer {
    width: 100% !important;
    height: auto !important;
  }
  .hm-works-sticky {
    position: relative !important;
    height: auto !important;
    width: 100% !important;
    padding: 40px 0 !important;
  }
  .hm-works-sticky .hm-h2 {
    font-size: clamp(18px, 5vw, 26px) !important;
    margin-bottom: 12px !important;
    line-height: 1.3 !important;
  }
  .hm-works-sticky .hm-eyebrow {
    font-size: clamp(10px, 3vw, 14px) !important;
  }
  .hm-works-panel {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    gap: 24px !important;
  }
  /* Show ALL 4 step frames on mobile */
  .hm-works-imgframe {
    position: relative !important;
    opacity: 1 !important;
    visibility: visible !important;
    height: 200px !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    margin-bottom: 0 !important;
    pointer-events: auto !important;
  }
  .hm-works-step {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    position: static !important;
    padding: 16px !important;
    background: rgba(255,255,255,0.7) !important;
    border-radius: 16px !important;
    margin-bottom: 0 !important;
    pointer-events: auto !important;
  }
  /* Stack image + text pairs together */
  .hm-works-imgcol {
    width: 100% !important;
    max-width: 100% !important;
    height: 220px !important;
    border-radius: 16px !important;
  }
  .hm-works-textcol {
    width: 100% !important;
  }
  .hm-works-steps-wrapper {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }
  .hm-works-dots {
    display: none !important;
  }

  /* CSS Order hack for pairing image + text vertically */
  .hm-works-imgcol,
  .hm-works-textcol,
  .hm-works-steps-wrapper {
    display: contents !important;
  }
  .hm-works-imgframe:nth-child(1) { order: 1 !important; }
  .hm-works-step:nth-child(1) { order: 2 !important; }
  .hm-works-imgframe:nth-child(2) { order: 3 !important; }
  .hm-works-step:nth-child(2) { order: 4 !important; }
  .hm-works-imgframe:nth-child(3) { order: 5 !important; }
  .hm-works-step:nth-child(3) { order: 6 !important; }
  .hm-works-imgframe:nth-child(4) { order: 7 !important; }
  .hm-works-step:nth-child(4) { order: 8 !important; }

  /* Process Section */
  .hm-process {
    padding: 40px 0 !important;
  }
  .hm-process-grid {
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: 1fr !important;
    width: 100% !important;
    gap: 32px !important;
  }
  .hm-process-left .hm-h2 {
    font-size: clamp(18px, 5vw, 26px) !important;
  }
  .hm-process-sub {
    font-size: 14px !important;
    max-width: 100% !important;
    margin-bottom: 24px !important;
  }
  .hm-flow {
    gap: 12px !important;
  }
  .hm-frow {
    grid-template-columns: 1fr !important;
    width: 100% !important;
    gap: 12px !important;
  }
  .hm-scard {
    width: 100% !important;
    opacity: 1 !important;
    transform: none !important;
    min-height: auto !important;
    padding: 20px 18px !important;
    box-sizing: border-box !important;
  }
  .hm-conn {
    display: none !important;
  }

  /* Search bar */
  .hm-search {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    height: 48px !important;
    margin-top: 0 !important;
    padding: 0 6px 0 14px !important;
  }
  .hm-search input {
    font-size: 14px !important;
    padding: 0 6px !important;
  }
  .hm-search-ic {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    flex: 0 0 18px !important;
  }
  .hm-srch-ph {
    font-size: 14px !important;
    padding: 0 6px !important;
  }

  /* Stacking general multi-columns */
  .hm-cta {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    padding: 24px 20px !important;
    border-radius: 20px !important;
  }
  .hm-cta h3 {
    font-size: 18px !important;
  }
  .hm-cta p {
    font-size: 14px !important;
  }
  .hm-cta-btn {
    width: 100% !important;
    text-align: center !important;
    font-size: 14px !important;
  }

  /* NAVBAR OVERRIDES (mobile) */
  .gnav {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    padding: 0 !important;
    margin: 0 !important;
    z-index: 100 !important;
    box-sizing: border-box !important;
  }
  .gnav-in {
    height: 56px !important;
    padding: 0 16px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    border-radius: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
  }
  .gnav-logo {
    display: flex !important;
    align-items: center !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    background-color: transparent !important;
  }
  .gnav-logo img {
    height: 32px !important;
    width: auto !important;
    background: transparent !important;
    background-color: transparent !important;
  }
  .gnav-hamburger {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ffffff !important;
    background: transparent !important;
    font-size: 24px !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    z-index: 200 !important;
    cursor: pointer !important;
  }
  .gnav-schedule-btn,
  .gnav-auth-container,
  .gnav-become-seller-btn,
  .gnav-links {
    display: none !important;
  }

  .hm-logo img,
  nav img,
  header img {
    background: transparent !important;
    background-color: transparent !important;
    mix-blend-mode: normal !important;
  }

  /* ─── TYPOGRAPHY — clamp relative units (mobile) ─── */
  .hm h1, .hm-hero-title {
    font-size: clamp(22px, 6vw, 32px) !important;
    line-height: 1.3 !important;
  }
  .hm h2, .hm-h2 {
    font-size: clamp(18px, 5vw, 26px) !important;
    line-height: 1.3 !important;
  }
  .hm h3, .hm-mkt-body h3, .hm-need-card h3, .hm-works-title, .hm-scard-t, .hm-cta h3 {
    font-size: 18px !important;
    line-height: 24px !important;
  }
  .hm p, .hm-mkt-body p, .hm-need-card p, .hm-works-sub, .hm-process-sub, .hm-cta p, .hm-address, .hm-copyright {
    font-size: 14px !important;
    line-height: 20px !important;
  }
  .hm-eyebrow {
    font-size: clamp(10px, 3vw, 14px) !important;
  }

  /* ─── IMAGES — relative overrides ─── */
  img {
    width: 100% !important;
    height: auto !important;
    max-width: 100% !important;
    object-fit: cover !important;
  }
  /* Keep specific heights for step, need, and marketplace images */
  .hm-works-imgframe img, .hm-mkt-img, .hm-need-imgwrap img {
    height: 100% !important;
  }
  .hm-pills {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    margin-top: 10px !important;
    margin-bottom: 6px !important;
  }
  .hm-pills > span, .hm-pills span {
    padding: 5px 12px !important;
    font-size: 11px !important;
  }
}

.hm-search-ai {
  height: 38px;
  min-width: 48px;
  padding: 0 12px;
  border: 1.5px solid #2563eb;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease;
}
.hm-search-ai:hover {
  background: #1d4fd0;
  transform: scale(1.03);
}

/* SECTION */
.hm-section{ position:relative; z-index:10; isolation:isolate; padding:96px 0 80px; margin-top:0; overflow:hidden; }

/* MARKETPLACE cards */
.hm-mkt-header{ display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:0; }
.hm-mkt-header .hm-eyebrow{ font-family:var(--font-inter),'Inter',sans-serif; font-weight:600; font-size:14px; line-height:1.4; letter-spacing:.18em; margin:0 0 6px; }
.hm-mkt-header .hm-h2{ margin-bottom:44px; }
.hm-mkt-arrows{ display:flex; gap:12px; flex-shrink:0; margin-bottom:44px; }
@media(max-width:767px){ .hm-mkt-arrows{ display:none; } }
.hm-mkt-arrow{ width:44px; height:44px; border-radius:50%; border:1.5px solid #cbd5e1; background:#fff; color:#334155; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s, color .2s, border-color .2s, opacity .2s; }
.hm-mkt-arrow:hover:not(:disabled){ background:#2563eb; color:#fff; border-color:#2563eb; }
.hm-mkt-arrow--disabled{ opacity:.35; pointer-events:none; cursor:default; }

/* Carousel wrap */
.hm-mkt-wrap{ position:relative; z-index:2; isolation:isolate; overflow:visible; box-shadow:none; filter:none; }

/* Scroll container */
.hm-mkt{ display:flex; gap:28px; overflow-x:auto; padding-bottom:12px; scroll-snap-type:none; margin:0 calc(50% - 50vw) 0 -4px; padding-left:4px; padding-right:calc(50vw - 50% + 4px); -webkit-overflow-scrolling:touch; scrollbar-width:none; box-shadow:none; filter:none; }
.hm-mkt::-webkit-scrollbar{ display:none; }
.hm-mkt-card{ position:relative; z-index:1; isolation:isolate; flex:0 0 auto; width:calc(88% - 16px); aspect-ratio:1087 / 588; border-radius:22px; overflow:hidden; box-shadow:none; text-decoration:none; color:inherit; display:block; transition:box-shadow .25s, opacity 1.2s ease; }
@media(max-width:640px){ .hm-mkt-card{ width:calc(88% - 12px); border-radius:20px; } }

/* Dedicated image container — exact Figma ratio 1087×588, used ONLY in this marketplace carousel */
.hm-marketplace-image{ position:absolute; inset:0; width:100%; height:100%; aspect-ratio:1087 / 588; overflow:hidden; }
.hm-mkt-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; filter:none !important; transition:transform 1.2s ease, opacity 1.2s ease; }

/* Keep cards fully sharp/crisp at all times, no motion blur filter */
.hm-mkt-card--peek .hm-mkt-img{ filter:none !important; opacity:1; }
.hm-mkt-card--peek{ opacity:1; }

/* Active card: crystal clear, fully in focus */
.hm-mkt-card--active .hm-mkt-img{ filter:none !important; opacity:1; }
.hm-mkt-card--active{ opacity:1; }
.hm-mkt-card--active:hover{ box-shadow:none; }
.hm-mkt-card--active:hover .hm-mkt-img{ transform:scale(1.04); }

.hm-mkt-card--light{ background:#bfe0ff; }
.hm-mkt-card--light .hm-mkt-img{ object-fit:contain; object-position:center; }

/* Text Overlay & Gradient Scrim — per-card text overlay positioning matching Figma spec */
.hm-mkt-shade{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(6,15,40,0.82) 0%, rgba(6,15,40,0) 45%); pointer-events:none; z-index:1; }
.hm-mkt-body{ position:absolute; top:39px; left:39px; right:39px; pointer-events:none; z-index:2; text-align:left; }
.hm-mkt-card--bottom .hm-mkt-body,
.hm-mkt-card--bottom-left .hm-mkt-body{ top:auto; bottom:39px; }
.hm-mkt-card--bottom .hm-mkt-shade,
.hm-mkt-card--bottom-left .hm-mkt-shade{ background:linear-gradient(0deg, rgba(6,15,40,0.82) 0%, rgba(6,15,40,0) 45%); }
.hm-mkt-body h3{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:36px; line-height:41px; letter-spacing:0; margin:0 0 6px; color:#ffffff; text-shadow:0 2px 8px rgba(0,0,0,0.4); text-align:left; }
.hm-mkt-body p{ font-family:var(--font-inter),'Inter',sans-serif; font-weight:400; font-size:24px; line-height:41px; letter-spacing:0; margin:0; color:#ffffff; text-shadow:0 1px 4px rgba(0,0,0,0.4); text-align:left; }
.hm-mkt-card--light .hm-mkt-body h3{ color:#0b2559; text-shadow:none; }
.hm-mkt-card--light .hm-mkt-body p{ color:#1e3a70; text-shadow:none; }
@media(max-width:640px){
  .hm-mkt-body h3{ font-size:20px; line-height:26px; }
  .hm-mkt-body p{ font-size:14px; line-height:20px; }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* BUSINESS NEED */
.hm-need-sec{ position:relative; padding:80px 0; margin-top:0; }
.hm-need-in{ position:relative; }
.hm-need-in .hm-eyebrow{ font-weight:600; }

/* Marquee viewport: clips the scrolling track, no manual scroll */
.hm-need-viewport{ overflow:hidden; }

/* Marquee track: duplicated card set animates translateX(-50%) → translateX(0) for left-to-right movement */
@keyframes hm-need-marquee{ from{ transform:translateX(0); } to{ transform:translateX(-50%); } }
.hm-need-track{ display:flex; gap:22px; width:max-content; animation:hm-need-marquee 32s linear infinite; will-change:transform; }

.hm-need-card{ position:relative; flex:0 0 280px; width:280px; min-width:280px; flex-shrink:0; background:rgba(255,255,255,0.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.6); border-radius:22px; text-decoration:none; overflow:hidden; transition:box-shadow .25s ease, background .25s ease, border-color .25s ease; display:flex; flex-direction:column; align-items:center; padding:22px 20px 24px; box-sizing:border-box; }
.hm-need-card:hover{ background:rgba(255,255,255,0.8); border-color:rgba(255,255,255,0.95); box-shadow:0 16px 36px rgba(37,99,235,0.08); }
.hm-need-imgwrap{ position:static; width:120px; height:120px; border-radius:110px; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-bottom:14px; margin-left:auto; margin-right:auto; }
.hm-need-imgwrap img{ width:120px; height:120px; max-width:120px; max-height:120px; object-fit:contain; border-radius:110px; transition:transform .3s ease; }
.hm-need-card:hover .hm-need-imgwrap img{ transform:scale(1.05); }
.hm-need-card h3{ position:static; font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:19px; line-height:1.2; color:#0443cc; margin:0 0 6px; text-align:center; white-space:nowrap; width:100%; }
.hm-need-card p{ position:static; font-family:var(--font-inter),'Inter',sans-serif; font-weight:300; font-size:13.5px; line-height:19px; color:#334155; margin:0; text-align:center; width:100%; max-width:260px; }

/* HOW IT WORKS — sticky scrollytelling */
/* Outer wrapper: 500vh tall sticky scroll container, elevated z-index & solid background to prevent preceding section bleed-through */
.hm-works-outer{ height:500vh; position:relative; z-index:10; background:#f4f4f4; padding-bottom:0; margin-top:0; }
/* Sticky inner panel: locks in viewport — reduced vertical padding so heading + image + text all
   sit comfortably within a typical viewport without clipping at top or bottom. */
/* MATH: sticky container = 100vh. Fixed nav overlaps top ~92px.
   Content stack: pad-top(24) + eyebrow(~30) + h2(~81) + gap-to-panel(0) + image + pad-bot(40).
   Heading block total ≈ 175px. Image cap = 100vh - 175px - 45px_breathing = 100vh - 220px.
   At 1080px: cap=860px → image uses 460px (max). At 700px: cap=480px → image=480px. At 640px: cap=420px → image shrinks to 420px. Always fits. */
.hm-works-sticky{ position:sticky; top:0; height:100vh; display:flex; flex-direction:column; justify-content:center; background:#f4f4f4; padding:clamp(20px, 3vh, 40px) 0 0px; box-sizing:border-box; overflow:hidden; }
.hm-works-sticky .hm-container{ max-width:1214px; width:100%; }
.hm-works-sticky .hm-eyebrow{ font-family:var(--font-inter),'Inter',sans-serif; font-weight:600; font-size:18px; line-height:1.3; letter-spacing:0; margin:0 0 4px; text-align:left; }
.hm-works-sticky .hm-h2{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; font-weight:500; font-size:clamp(30px, 3.2vw, 38px); line-height:1.2; letter-spacing:0; color:#0f172a; max-width:720px; height:auto; margin:0 0 clamp(18px, 2.5vh, 28px); text-align:left; }

/* Two-column desktop layout — image column LEFT, text 1fr RIGHT with clean gap in between. */
.hm-works-panel{ display:grid; grid-template-columns:min(400px, 38vw) 1fr; gap:clamp(40px, 5vw, 70px); align-items:center; text-align:left; }

/* Image column bounds: viewport-relative height scaling (max 400px wide, fits strictly inside column 1). */
.hm-works-imgcol{ position:relative; width:100%; max-width:400px; aspect-ratio:471 / 588; height:auto; max-height:calc(100vh - 220px); flex:none; display:flex; align-items:center; justify-content:center; margin:0; border-radius:20px; overflow:hidden; }

/* Step image frame: fills the bounding box with no clipping at top or bottom. */
.hm-works-imgframe{ position:absolute; inset:0; width:100%; height:100%; border-radius:20px; overflow:hidden; box-shadow:0 18px 40px rgba(6,15,40,0.12); transition:opacity .45s ease, visibility .45s ease; }
.hm-works-imgframe img{ width:100%; height:100%; object-fit:cover; display:block; object-position: center 20%; }

/* Text column: fills remaining width (1fr). Clean flex layout without negative margin shifts. */
.hm-works-textcol{ position:relative; display:flex; flex-direction:column; justify-content:center; align-self:center; text-align:left; align-items:flex-start; overflow:visible; margin-top:0; }
.hm-works-steps-wrapper{ display:grid; grid-template-columns:1fr; grid-template-rows:1fr; width:100%; text-align:left; }
.hm-works-step{ grid-area:1 / 1; width:100%; max-width:520px; display:flex; flex-direction:column; align-items:flex-start; text-align:left; transition:opacity .45s ease, transform .45s ease, visibility .45s ease; }
.hm-works-n{ font-weight:700; font-size:22px; opacity:.5; display:block; margin-bottom:6px; text-align:left; }
.hm-works-title{ font-family:var(--font-poppins),'Poppins',sans-serif; font-weight:500; font-size:clamp(34px, 3.8vw, 48px); line-height:1.2; letter-spacing:0; width:100%; max-width:520px; margin:0 0 12px; text-align:left; }
.hm-works-sub{ font-family:var(--font-inter),'Inter',sans-serif; font-weight:400; font-size:clamp(16px, 1.8vw, 22px); line-height:1.45; letter-spacing:0; color:#000000; margin:0; width:100%; max-width:487px; text-align:left; }

/* Step dots: 4 small dots synced to active stepIdx, positioned cleanly below step text */
.hm-works-dots{ display:none; }
.hm-works-dot{ width:10px; height:10px; border-radius:999px; background:#cbd5e1; transition:all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.hm-works-dot--active{ width:28px; height:10px; border-radius:999px; }

/* Mobile: works sticky scroll overrides removed in favor of consolidated media query */

/* PROCESS — sticky scroll-locked
   Section scrolls normally — no sticky, no scroll-jacking.
   Cards are revealed by the IntersectionObserver auto-play effect. */
.hm-process{
  background:#08080a;
  padding:80px 0;
  margin-top:0;
}
.hm-process::before{
  content:""; position:absolute; top:-200px; left:50%; width:1000px; height:460px;
  transform:translateX(-52%); pointer-events:none;
  background:radial-gradient(closest-side, rgba(37,99,235,0.12), rgba(37,99,235,0) 72%);
}
.hm-process > *{ position:relative; z-index:1; width:100%; }
.hm-process-grid{ display:grid; grid-template-columns:1fr; gap:44px; }
@media(min-width:960px){ .hm-process-grid{ grid-template-columns:360px 1fr; gap:64px; align-items:center; } }
.hm-process-left .hm-h2{ margin-bottom:18px; }
.hm-process-sub{ color:#a1a1aa; font-size:15.5px; line-height:1.65; margin:0 0 30px; max-width:340px; }
.hm-become{
  background:#fff; color:#2563eb; border:none; font-weight:600; font-size:15px;
  padding:13px 30px; border-radius:999px; cursor:pointer;
  box-shadow:0 8px 22px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.9);
  transition:transform .2s, box-shadow .2s;
}
.hm-become:hover{ transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,0,0,0.5); }
.hm-become:focus-visible{ outline:2px solid #fff; outline-offset:3px; }

/* rows */
.hm-flow{ display:flex; flex-direction:column; gap:26px; }
.hm-frow{
  --g:26px;
  position:relative; display:grid; grid-template-columns:repeat(3,1fr);
  gap:var(--g);
}
/* connectors — --t (0→1) is set by JS per connector */
.hm-conn{
  position:absolute; top:50%; right:100%; width:var(--g); height:10px;
  margin-top:-5px; pointer-events:none; display:flex; align-items:center;
}
.hm-conn::before{
  content:""; flex:1; height:1px; transform-origin:left center;
  background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%);
  transform:scaleX(var(--t)); transition:background .3s ease;
}
.hm-conn::after{
  content:""; width:6px; height:6px; margin-left:-3px; flex-shrink:0;
  border-top:1px solid rgba(255,255,255,0.55);
  border-right:1px solid rgba(255,255,255,0.55);
  transform:rotate(45deg);
  opacity:clamp(0, calc((var(--t) - .7) / .3), 1);
  transition:border-color .3s ease;
}
.hm-scard:hover .hm-conn::before{
  background:linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--to) 100%);
}
.hm-scard:hover .hm-conn::after{
  border-top-color:var(--to); border-right-color:var(--to);
}
/* cards — opacity and transform set by JS; CSS only handles hover + border */
.hm-scard{
  position:relative;
  background:linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012));
  border:1px solid rgba(255,255,255,0.08);
  border-radius:18px; padding:26px 22px; min-height:168px;
  display:flex; flex-direction:column; justify-content:space-between;
  transition:border-color .35s ease, box-shadow .35s ease;
  opacity:0; /* JS sets this */
}
.hm-scard:hover{
  transform:translateY(-3px) !important;
  border-color:rgba(255,255,255,0.16);
  box-shadow:0 22px 48px rgba(0,0,0,0.55);
}
.hm-scard-n{
  font-weight:600; font-size:15px; letter-spacing:.16em;
  color:rgba(255,255,255,0.32); font-variant-numeric:tabular-nums;
}
.hm-scard-foot{ display:flex; flex-direction:column; gap:12px; min-height:68px; justify-content:flex-start; }
.hm-scard-rule{ width:24px; height:2px; border-radius:2px; background:var(--c,#2563eb); box-shadow:0 0 10px var(--c,#2563eb); opacity:.9; transition:width .35s ease; flex-shrink:0; }
.hm-scard:hover .hm-scard-rule{ width:44px; }
.hm-scard-t{ font-weight:500; font-size:19px; line-height:1.25; letter-spacing:-.01em; color:#fafafa; display:block; }

@media(max-width:760px){
  .hm-frow{ grid-template-columns:repeat(2,1fr); }
  .hm-conn{ display:none; }
  .hm-flow{ gap:18px; }
}

/* CTA */
.hm-cta{
  margin-top:56px;
  border-radius:24px;
  padding:28px 36px;
  display:flex;
  flex-direction:column;
  gap:16px;
  background:linear-gradient(90deg, rgba(0,80,255,0.22) 0%, rgba(127,117,149,0.18) 25%, rgba(255,174,0,0.16) 50%, rgba(127,117,149,0.18) 75%, rgba(0,80,255,0.22) 100%);
  background-size:200% 100%;
  background-position:0% 50%;
  animation:hm-gradientShift 6s linear infinite;
  border:1px solid rgba(255,255,255,0.12);
}
@media(min-width:760px){ .hm-cta{ flex-direction:row; align-items:center; justify-content:space-between; } .hm-cta-btn{ align-self:center; margin-top:4px; } }
.hm-cta h3{ font-weight:500; font-size:22px; color:#fff; margin:0 0 6px; }
.hm-cta p{ font-size:15px; color:rgba(255,255,255,0.82); margin:0; }
.hm-cta-btn{ align-self:center; display:inline-flex; align-items:center; justify-content:center; background:#2563eb; color:#fff; border:none; font-weight:600; font-size:16px; padding:12px 32px; border-radius:999px; cursor:pointer; transition:transform .2s, background .2s; white-space:nowrap; margin-top:4px; }
.hm-cta-btn:hover{ background:#1d4fd0; transform:translateY(-1px); }

/* FOOTER */
.hm-footer{ background:#f4f4f4; padding:72px 0 30px; }
.hm-footer-in{ display:flex; flex-wrap:wrap; gap:48px; justify-content:space-between; }
.hm-footer-brand{ max-width:320px; }
.hm-footer-brand .hm-logo{ font-size:26px; }
.hm-address{ font-weight:300; font-size:14px; line-height:1.7; color:#64748b; margin:16px 0 20px; }
.hm-socials{ display:flex; gap:12px; }
.hm-social{ width:40px; height:40px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; color:#2563eb; box-shadow:0 3px 12px rgba(0,0,0,0.07); transition:all .25s; }
.hm-social:hover{ background:#2563eb; color:#fff; transform:translateY(-2px); }
.hm-social svg{ width:20px; height:20px; }
.hm-footer-nav{ display:flex; flex-direction:column; gap:14px; }
.hm-footer-h{ font-weight:600; font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
.hm-footer-nav a, .hm-footer-nav button{ font-size:15px; color:#334155; text-decoration:none; background:none; border:none; cursor:pointer; text-align:left; padding:0; transition:color .2s; }
.hm-footer-nav a:hover, .hm-footer-nav button:hover{ color:#2563eb; }
.hm-divider{ height:1px; background:#e2e8f0; margin:44px 0 24px; }
.hm-copyright{ text-align:center; font-size:13px; color:#94a3b8; margin:0; }

/* PhonePe / Paytm style success animation */
@keyframes akSuccessFadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes akCircleScale {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes akCircleDraw {
  0% { stroke-dashoffset: 230; }
  100% { stroke-dashoffset: 0; }
}

@keyframes akCircleFill {
  0% { fill-opacity: 0; }
  60% { fill-opacity: 0; }
  100% { fill-opacity: 1; }
}

@keyframes akCheckDraw {
  0% { stroke-dashoffset: 60; opacity: 0; }
  35% { stroke-dashoffset: 60; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}

.ak-success-wrap {
  animation: akSuccessFadeIn 0.3s ease-out forwards;
}

.ak-success-svg {
  transform-origin: center;
  animation: akCircleScale 0.6s ease-out forwards;
}

.ak-success-circle {
  stroke-dasharray: 230;
  stroke-dashoffset: 230;
  animation: akCircleDraw 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.ak-success-fill {
  fill-opacity: 0;
  animation: akCircleFill 0.6s ease-out 0.25s forwards;
}

.ak-success-check {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: akCheckDraw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
}
`;
