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
const MKT_HOLD_MS = 2000; // hold duration per card — change this one value to retune

const STEPS = [
  { img: "/images/earth_low_white_part.jpg", n: "01", title: "Discover", sub: "Search 500+ verified AI solutions by business need.", color: "#aa7a45", imgPos: "center center" },
  { img: "image475.png", n: "02", title: "Compare", sub: "Evaluate features, integrations, pricing & reviews.", color: "#475d56", imgPos: "center 30%" },
  { img: "/images/mobile/panoramic_office_holographic.webp", n: "03", title: "Try Sandbox", sub: "Test the AI live before committing a dollar.", color: "#f87531", imgPos: "40% center" },
  { img: "/images/mobile/aikart-408x230-centered-angled.png", n: "04", title: "Buy", sub: "Purchase securely and deploy in minutes.", color: "#2563eb", imgPos: "center" },
];

const MARKETPLACE = [
  { title: "Live Sandbox Testing", sub: "Try any AI before you buy.", img: "/images/mobile/vertical_minimalist_scene.webp", light: false, href: "/explore", pos: "top" },
  { title: "Verified AI Providers", sub: "Every seller vetted for quality.", img: "/images/verified-shield-glass.png", light: true, href: "/explore", pos: "bottom-left" },
  { title: "Compare Solutions", sub: "Side-by-side, transparent.", img: "/images/mobile/vertical_workspace_collaboration.webp", light: false, href: "/explore", pos: "top" },
  { title: "Business Use Cases", sub: "Browse by real outcomes.", img: "/images/mobile/minimalist_concrete_portrait.webp", light: false, href: "/explore", pos: "bottom" },
  { title: "Enterprise Ready", sub: "SOC2, SSO & procurement.", img: "/images/mobile/cityscape_vertical_portrait.webp", light: false, href: "/explore", pos: "top" },
];

const MARKETPLACE_INFINITE = [...MARKETPLACE, ...MARKETPLACE, ...MARKETPLACE];

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

export default function HomeClientMobile({ data }: { data: HomeData }) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string | null } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  /* ── Typewriter search hint ── */
  const [twText, setTwText] = useState("");
  const [twPhraseIdx, setTwPhraseIdx] = useState(0);
  const [twDeleting, setTwDeleting] = useState(false);

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

  useEffect(() => {
    if (searchValue || searchFocused) return;
    const phrases = searchHints;
    const current = phrases[twPhraseIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!twDeleting && twText.length < current.length) {
      t = setTimeout(() => setTwText(current.slice(0, twText.length + 1)), 50);
    } else if (!twDeleting && twText.length === current.length) {
      t = setTimeout(() => setTwDeleting(true), 1300);
    } else if (twDeleting && twText.length > 0) {
      t = setTimeout(() => setTwText(current.slice(0, twText.length - 1)), 30);
    } else if (twDeleting && twText.length === 0) {
      t = setTimeout(() => {
        setTwDeleting(false);
        setTwPhraseIdx((p) => (p + 1) % phrases.length);
      }, 50);
    }
    return () => clearTimeout(t);
  }, [twText, twDeleting, twPhraseIdx, searchValue, searchFocused, searchHints]);

  /* ── Marketplace carousel scroll state ── */
  const mktRef = useRef<HTMLDivElement>(null);
  const mktSectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getCardStep = useCallback(() => {
    const el = mktRef.current;
    if (!el) return 0;
    const firstCard = el.querySelector<HTMLElement>(".hm-mob-mkt-card");
    return firstCard ? firstCard.offsetWidth + 16 : el.clientWidth; // 16 = gap
  }, []);

  const checkMktScroll = useCallback(() => {
    const el = mktRef.current;
    if (!el) return;
    const step = getCardStep();
    if (!step) return;
    const rawIdx = Math.round(el.scrollLeft / step);
    setActiveIndex(rawIdx % MARKETPLACE.length);

    // If swiped into first set or beyond third set, seamlessly adjust to middle set
    if (rawIdx >= 2 * MARKETPLACE.length) {
      el.scrollLeft = (MARKETPLACE.length + (rawIdx % MARKETPLACE.length)) * step;
    } else if (rawIdx < MARKETPLACE.length && el.scrollLeft <= 10) {
      el.scrollLeft = (MARKETPLACE.length + (rawIdx % MARKETPLACE.length)) * step;
    }
  }, [getCardStep]);

  useEffect(() => {
    const el = mktRef.current;
    if (!el) return;

    // Start in the middle set for infinite scroll in both directions
    const initScroll = () => {
      const step = getCardStep();
      if (step > 0 && el.scrollLeft === 0) {
        el.scrollLeft = MARKETPLACE.length * step;
      }
    };
    initScroll();
    const frameId = requestAnimationFrame(initScroll);

    el.addEventListener("scroll", checkMktScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener("scroll", checkMktScroll);
    };
  }, [checkMktScroll, getCardStep]);

  /* ── Marketplace carousel auto-advance ── */
  useEffect(() => {
    const el = mktRef.current;
    const section = mktSectionRef.current;
    if (!el || !section) return;

    // Respect reduced-motion preference, and listen for live changes
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionMq.matches) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let resumeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isUserInteracting = false;
    let isSectionVisible = false;
    let isTabVisible = !document.hidden;

    const advance = () => {
      if (isUserInteracting || !isSectionVisible || !isTabVisible) return;
      const stepWidth = getCardStep();
      if (!stepWidth) return;
      
      const currentIdx = Math.round(el.scrollLeft / stepWidth);
      let baseIdx = currentIdx;
      
      // If we reach the end of the middle set, silently jump back to the start of middle set
      if (currentIdx >= 2 * MARKETPLACE.length) {
        baseIdx = MARKETPLACE.length + (currentIdx % MARKETPLACE.length);
        el.scrollLeft = baseIdx * stepWidth;
      }

      const nextIdx = baseIdx + 1;
      el.scrollTo({ left: nextIdx * stepWidth, behavior: "smooth" });
      setActiveIndex(nextIdx % MARKETPLACE.length);
    };

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(advance, MKT_HOLD_MS);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const maybeStart = () => {
      if (!isUserInteracting && isSectionVisible && isTabVisible) startInterval();
      else stopInterval();
    };

    // Pause on user touch/pointer, resume 2s after idle
    const onInteractionStart = () => {
      isUserInteracting = true;
      stopInterval();
      if (resumeTimeoutId !== null) clearTimeout(resumeTimeoutId);
    };
    const onInteractionEnd = () => {
      if (resumeTimeoutId !== null) clearTimeout(resumeTimeoutId);
      resumeTimeoutId = setTimeout(() => {
        isUserInteracting = false;
        maybeStart();
      }, 2000);
    };

    el.addEventListener("touchstart", onInteractionStart, { passive: true });
    el.addEventListener("pointerdown", onInteractionStart, { passive: true });
    el.addEventListener("touchend", onInteractionEnd, { passive: true });
    el.addEventListener("scrollend", onInteractionEnd, { passive: true });

    // Pause when section scrolls out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionVisible = entry.isIntersecting;
        maybeStart();
      },
      { threshold: 0.2 }
    );
    observer.observe(section);

    // Pause when tab is hidden
    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      maybeStart();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Pause when reduced-motion preference changes at runtime
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) stopInterval();
      else maybeStart();
    };
    motionMq.addEventListener("change", onMotionChange);

    return () => {
      stopInterval();
      if (resumeTimeoutId !== null) clearTimeout(resumeTimeoutId);
      el.removeEventListener("touchstart", onInteractionStart);
      el.removeEventListener("pointerdown", onInteractionStart);
      el.removeEventListener("touchend", onInteractionEnd);
      el.removeEventListener("scrollend", onInteractionEnd);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionMq.removeEventListener("change", onMotionChange);
    };
  }, [getCardStep]); // dependencies updated

  /* ── Business Need marquee ── */
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
    <div className="hm-mobile">
      <style dangerouslySetInnerHTML={{ __html: MOBILE_CSS }} />

      {/* ─── HERO (Mobile: Edge-to-Edge Image, No Video) ─── */}
      <section className="hm-mob-hero">
        <div className="hm-mob-hero-veil" />
        <div className="hm-mob-hero-in">
          <h1 className="ff-redhat hm-mob-hero-title">
            Discover, Test &amp; Buy <span className="hm-grad">AI Solutions</span> for Your Business
          </h1>
          <div className="hm-mob-pills ff-inter">
            <span>
              <span className="hm-pill-check">✓</span>
              Test ai agents for free
            </span>
            <span>
              <span className="hm-pill-check">✓</span>
              Verified providers
            </span>
          </div>
          <div className="hm-mob-search ff-inter">
            <Image src={`${A}/image484.png`} alt="" width={18} height={18} className="hm-mob-search-ic" />
            <div className="hm-mob-search-input-wrap">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(false); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={searchValue === "" && !searchFocused ? " " : "Search AI agents..."}
                aria-label="Search AI agents"
              />
              {searchValue === "" && !searchFocused && (
                <span className="hm-mob-srch-ph ff-inter" aria-hidden="true">
                  <span>
                    {twText}
                    <span className="hm-srch-ph-cursor">|</span>
                  </span>
                </span>
              )}
            </div>
            <button type="button" onClick={() => runSearch(true)} className="hm-mob-search-ai" aria-label="Search with AI">
              <img src="/logo/aikart-ai-mark-white.png" alt="AI" style={{ height: "18px", width: "auto", objectFit: "contain", display: "block" }} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── THE MARKETPLACE (Mobile: Horizontal Swipeable 90vw Cards) ─── */}
      <section ref={mktSectionRef} className="hm-mob-sec hm-mob-sec--mkt">
        <div className="hm-mob-container">
          <div className="hm-mob-mkt-header">
            <p className="hm-mob-eyebrow hm-grad">THE MARKETPLACE</p>
            <h2 className="ff-redhat hm-mob-h2">Everything you need to buy AI with confidence</h2>
          </div>
        </div>
        <div className="hm-mob-mkt-wrap">
          <div className="hm-mob-mkt" ref={mktRef}>
            {MARKETPLACE_INFINITE.map((c, idx) => {
              const isActive = (idx % MARKETPLACE.length) === activeIndex;
              return (
                <Link
                  key={`${c.title}-${idx}`}
                  href={c.href}
                  className={`hm-mob-mkt-card ${c.light ? "hm-mob-mkt-card--light" : ""} ${isActive ? "hm-mob-mkt-card--active" : ""}`}
                  draggable={false}
                >
                  {c.title === "Verified AI Providers" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4 pb-12">
                      <div className="relative w-[260px] h-[260px] max-w-[75%] max-h-[55%] mx-auto">
                        <Image
                          src="/images/verified-shield-glass.png"
                          alt={c.title}
                          fill
                          sizes="260px"
                          style={{ objectFit: "contain" }}
                          className="object-contain"
                          draggable={false}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="hm-mob-mkt-imgwrap">
                      <Image
                        src={c.img}
                        alt={c.title}
                        fill
                        sizes="90vw"
                        style={{
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                        className="hm-mob-mkt-img"
                        draggable={false}
                      />
                    </div>
                  )}
                  <div className="hm-mob-mkt-body">
                    <h3 className="ff-poppins">{c.title}</h3>
                    <p className="ff-inter">{c.sub}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BY BUSINESS NEED (Mobile: Faster Marquee, Smaller Cards) ─── */}
      <section className="hm-mob-need-sec">
        <div className="hm-mob-container">
          <p className="hm-mob-eyebrow hm-grad">BY BUSINESS NEED</p>
          <h2 className="ff-redhat hm-mob-h2">Find AI Solutions by Business Need</h2>
        </div>
        <div
          className="hm-mob-need-viewport"
          onMouseEnter={() => setNeedPaused(true)}
          onMouseLeave={() => setNeedPaused(false)}
          onTouchStart={() => setNeedPaused(true)}
          onTouchEnd={() => setNeedPaused(false)}
        >
          <div
            className="hm-mob-need-track"
            style={{ animationPlayState: needPaused ? "paused" : "running" }}
          >
            {[...NEEDS, ...NEEDS].map((c, i) => (
              <Link key={`${c.title}-${i}`} href={needHref(c.cat)} className="hm-mob-need-card">
                <div className="hm-mob-need-imgwrap">
                  <Image
                    src={`${A}/${c.img}`}
                    alt=""
                    width={120}
                    height={120}
                    style={{ objectFit: "cover", borderRadius: c.round ? "50%" : undefined }}
                  />
                </div>
                <h3 className="ff-poppins">{c.title}</h3>
                <p className="ff-inter">{c.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW AIKART WORKS (Mobile: Vertical Stack) ─── */}
      <section ref={stepsSectionRef} className="hm-mob-sec hm-mob-sec--steps">
        <div className="hm-mob-container">
          <div className="mb-6">
            <p className="hm-mob-eyebrow hm-grad">HOW AIKART WORKS</p>
            <h2 className="ff-redhat hm-mob-h2">From discovery to deployment in four steps</h2>
          </div>

          <div className="hm-mob-steps-list">
            {STEPS.map((step, idx) => (
              <div
                key={step.n}
                className="hm-mob-step-card"
                style={{
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 120}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 120}ms`,
                }}
              >
                <div className="hm-mob-step-imgwrap">
                  <Image
                    src={step.img.startsWith("/") ? step.img : `${A}/${step.img}`}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw"
                    style={{ objectFit: "cover", objectPosition: step.imgPos }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hm-mob-step-body">
                  <div className="flex items-baseline gap-2">
                    <span className="hm-mob-step-title" style={{ color: step.color }}>{step.n}</span>
                    <h3 className="hm-mob-step-title" style={{ color: step.color }}>{step.title}</h3>
                  </div>
                  <p className="hm-mob-step-sub">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE PROCESS (seller, dark) ─── */}
      <section className="hm-mob-process-sec" data-navbar-theme="dark">
        <div className="hm-mob-container">
          <p className="hm-mob-eyebrow hm-grad">THE PROCESS</p>
          <h2 className="ff-redhat hm-mob-h2" style={{ color: "#fff" }}>Launch in six steps, seller side</h2>
          <p className="ff-inter hm-mob-process-sub">List, configure and start receiving customers the full seller journey, end to end.</p>

          <div className="hm-mob-seller-grid">
            {SELLER.map((s) => (
              <div key={s.n} className="hm-mob-scard" style={{ "--c": s.color } as CSSProperties}>
                <span className="ff-inter hm-mob-scard-n">{s.n}</span>
                <div className="hm-mob-scard-foot">
                  <span className="hm-mob-scard-rule" aria-hidden="true" />
                  <span className="ff-poppins hm-mob-scard-t">{s.title}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hm-mob-cta">
            <div>
              <h3 className="ff-redhat">Ready to try AI before you buy?</h3>
              <p className="ff-inter">Explore verified solutions with live sandbox access.</p>
            </div>
            <Link href="/explore" className="hm-mob-cta-btn ff-inter">Explore</Link>
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

const MOBILE_CSS = `
/* ─── Global Mobile Container Reset ─── */
.hm-mobile {
  position: relative;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  background: #f4f4f4;
  color: #0f172a;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: #1C1410 transparent;
}

.hm-mobile::after {
  content: "";
  position: fixed;
  top: 0;
  right: 0;
  width: 3px;
  height: 100vh;
  height: 100dvh;
  background: linear-gradient(to left, rgba(28, 20, 16, 0.16), rgba(28, 20, 16, 0.04) 2px, transparent);
  pointer-events: none;
  z-index: 9998;
}

.hm-mobile ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
  display: block;
}

.hm-mobile ::-webkit-scrollbar-track {
  background: transparent;
}

.hm-mobile ::-webkit-scrollbar-thumb {
  background: #1C1410;
  border-radius: 9999px;
}

.hm-mob-container {
  width: 100%;
  max-width: 100%;
  padding-left: 16px;
  padding-right: 16px;
  box-sizing: border-box;
}

.ff-redhat { font-family: var(--font-red-hat), 'Red Hat Display', sans-serif; }
.ff-inter { font-family: var(--font-inter), 'Inter', sans-serif; }
.ff-poppins { font-family: var(--font-poppins), 'Poppins', sans-serif; }
.ff-sansita { font-family: 'Sansita One', 'Sansita', cursive; }
.ff-jura { font-family: var(--font-jura), 'Jura', sans-serif; }
.ff-roboto { font-family: var(--font-roboto), 'Roboto', sans-serif; }

@keyframes hm-gradientShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.hm-grad {
  display: inline-block;
  background: linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%);
  background-size: 200% 100%;
  background-position: 0% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: hm-gradientShift 6s linear infinite;
}

.hm-mob-eyebrow {
  font-family: var(--font-inter), sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: .15em;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.hm-mob-h2 {
  font-weight: 500;
  font-size: clamp(20px, 5.5vw, 26px);
  line-height: 1.25;
  letter-spacing: -.01em;
  color: #0f172a;
  margin: 0 0 20px;
}

.hm-mob-sec {
  padding: 64px 0;
  overflow: hidden;
}

/* ─── Hero Section ─── */
.hm-mob-hero {
  position: relative;
  width: 100vw;
  min-height: 100svh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background-image: url('/office_team_portrait.webp');
  background-size: cover;
  background-position: center top;
}

.hm-mob-hero-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.04) 0%,
    rgba(0,0,0,0.12) 45%,
    rgba(0,0,0,0.48) 78%,
    rgba(0,0,0,0.76) 100%
  );
  z-index: 1;
}

.hm-mob-hero-in {
  position: relative;
  z-index: 2;
  width: 100%;
  padding-top: min(70svh, calc(100svh - 260px));
  padding-right: 16px;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
  padding-left: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hm-mob-hero-title {
  font-size: clamp(22px, 6.5vw, 30px);
  line-height: 1.25;
  color: #ffffff;
  margin: 0;
  text-align: left;
  font-weight: 500;
}

.hm-mob-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
  margin-bottom: 7px;
}

.hm-mob-pills > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  color: white;
  font-size: 11px;
  white-space: nowrap;
}

.hm-pill-check {
  color: white;
  font-size: 11px;
}

.hm-mob-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 48px;
  background: #ffffff;
  border-radius: 999px;
  padding: 0 6px 0 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.hm-mob-search-ic {
  object-fit: contain;
  opacity: 0.7;
  flex-shrink: 0;
}

.hm-mob-search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.hm-mob-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  padding: 0 8px;
}

.hm-mob-search input::placeholder {
  color: transparent;
}

@keyframes hm-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

.hm-mob-srch-ph {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 8px;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  font-size: 14px;
  color: #94a3b8;
}

.hm-srch-ph-cursor {
  display: inline-block;
  margin-left: 1px;
  animation: hm-blink 1.06s step-end infinite;
}

.hm-mob-search-ai {
  height: 36px;
  min-width: 46px;
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
.hm-mob-search-ai:hover {
  background: #1d4fd0;
  transform: scale(1.03);
}

/* ─── Marketplace Carousel (Mobile) ─── */
.hm-mob-mkt-wrap {
  width: 100%;
  overflow-x: clip;
  overflow-y: visible;
}

.hm-mob-sec--mkt {
  padding: 60px 0 40px;
  display: block;
}

.hm-mob-mkt {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 0 16px 14px;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.hm-mob-mkt-card {
  width: calc(100vw - 32px);
  flex: 0 0 calc(100vw - 32px);
  max-width: calc(100vw - 32px);
  height: clamp(420px, 62svh, 620px);
  border-radius: 18px;
  position: relative;
  overflow: hidden;
  scroll-snap-align: start;
  background: #0f172a;
  text-decoration: none;
  display: block;
}

.hm-mob-mkt-card--light {
  background: #bfe0ff;
}

.hm-mob-mkt-imgwrap {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hm-mob-mkt-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hm-mob-mkt-body {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 22px;
  z-index: 2;
  color: #ffffff;
  pointer-events: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7), 0 1px 3px rgba(0, 0, 0, 0.9);
}

.hm-mob-mkt-card--light .hm-mob-mkt-body {
  color: #0b2559;
  text-shadow: none;
}

.hm-mob-mkt-card--light .hm-mob-mkt-body h3 {
  color: #0b2559;
  text-shadow: none;
}

.hm-mob-mkt-card--light .hm-mob-mkt-body p {
  color: #1e3a70;
  text-shadow: none;
}

.hm-mob-mkt-dots-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}

.hm-mob-mkt-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d1d5db;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.hm-mob-mkt-dot--active {
  background: #2563eb;
}

.hm-mob-mkt-body h3 {
  font-size: clamp(19px, 5.2vw, 23px);
  line-height: 1.25;
  font-weight: 600;
  margin: 0 0 6px;
  color: #ffffff;
}

.hm-mob-mkt-body p {
  font-size: clamp(13.5px, 3.6vw, 15px);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
}

/* ─── Business Need Marquee ─── */
.hm-mob-need-sec {
  padding: 68px 0 72px;
  overflow: hidden;
  background: linear-gradient(to bottom right, #8fa8f5, #c3b3ee, #f2c99a);
}

.hm-mob-need-viewport {
  overflow: hidden;
  width: 100%;
}

@keyframes hm-mob-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.hm-mob-need-track {
  display: flex;
  gap: 10px;
  width: max-content;
  animation: hm-mob-marquee 14s linear infinite;
  will-change: transform;
}

.hm-mob-need-card {
  flex: 0 0 58vw;
  width: 58vw;
  aspect-ratio: 1 / 1;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 14px 12px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
}

.hm-mob-need-imgwrap {
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hm-mob-need-card h3 {
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
}

.hm-mob-need-card p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* ─── How AIKart Works (Vertical Stack) ─── */
.hm-mob-works-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.hm-mob-work-item {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.hm-mob-work-imgframe {
  position: relative;
  width: 100%;
  height: 200px;
}

.hm-mob-work-text {
  padding: 16px;
}

.hm-mob-work-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
}

.hm-mob-work-text p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

/* ─── Process Section ─── */
.hm-mob-process-sec {
  position: relative;
  background: #08080a;
  color: #ffffff;
  padding: 72px 0;
  overflow: hidden;
}

.hm-mob-process-sec::before {
  content: "";
  position: absolute;
  top: -150px;
  left: 50%;
  width: 600px;
  height: 360px;
  transform: translateX(-50%);
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(37,99,235,0.12), rgba(37,99,235,0) 72%);
}

.hm-mob-process-sub {
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.6;
  margin: -10px 0 28px;
}

.hm-mob-seller-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.hm-mob-scard {
  position: relative;
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 22px 18px;
  min-height: 156px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease,
              background 0.3s ease;
}

.hm-mob-scard:hover,
.hm-mob-scard:active {
  transform: translateY(-4px);
  background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025));
  border-color: rgba(255,255,255,0.22);
  box-shadow: 0 16px 36px rgba(0,0,0,0.55), 0 0 24px color-mix(in srgb, var(--c, #2563eb) 22%, transparent);
}

.hm-mob-scard-n {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: .16em;
  color: rgba(255,255,255,0.32);
  font-variant-numeric: tabular-nums;
  transition: color 0.3s ease;
}

.hm-mob-scard:hover .hm-mob-scard-n,
.hm-mob-scard:active .hm-mob-scard-n {
  color: rgba(255,255,255,0.65);
}

.hm-mob-scard-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 62px;
  justify-content: flex-start;
}

.hm-mob-scard-rule {
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: var(--c, #2563eb);
  box-shadow: 0 0 10px var(--c, #2563eb);
  opacity: .9;
  flex-shrink: 0;
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.hm-mob-scard:hover .hm-mob-scard-rule,
.hm-mob-scard:active .hm-mob-scard-rule {
  width: 48px;
  box-shadow: 0 0 16px var(--c, #2563eb);
}

.hm-mob-scard-t {
  font-weight: 500;
  font-size: 17px;
  line-height: 1.25;
  letter-spacing: -.01em;
  color: #fafafa;
  display: block;
  transition: color 0.3s ease;
}

.hm-mob-scard:hover .hm-mob-scard-t,
.hm-mob-scard:active .hm-mob-scard-t {
  color: #ffffff;
}

/* ─── CTA Box ─── */
.hm-mob-cta {
  margin-top: 52px;
  margin-bottom: 36px;
  border-radius: 24px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 18px;
  background: linear-gradient(90deg, rgba(0,80,255,0.22) 0%, rgba(127,117,149,0.18) 25%, rgba(255,174,0,0.16) 50%, rgba(127,117,149,0.18) 75%, rgba(0,80,255,0.22) 100%);
  background-size: 200% 100%;
  background-position: 0% 50%;
  animation: hm-gradientShift 6s linear infinite;
  border: 1px solid rgba(255,255,255,0.12);
}

.hm-mob-cta h3 {
  font-weight: 500;
  font-size: 19px;
  color: #ffffff;
  margin: 0 0 6px;
  text-align: left;
}

.hm-mob-cta p {
  font-size: 13.5px;
  color: rgba(255,255,255,0.82);
  margin: 0;
  text-align: left;
}

.hm-mob-cta-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: #ffffff;
  border: none;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 36px;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.hm-mob-sec--steps {
  padding: 68px 0;
}

.hm-mob-steps-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hm-mob-step-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.hm-mob-step-card:hover,
.hm-mob-step-card:active {
  transform: translateY(-4px);
}

.hm-mob-step-imgwrap {
  position: relative;
  width: 100%;
  height: 230px;
  border-radius: 18px;
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.hm-mob-step-card:hover .hm-mob-step-imgwrap,
.hm-mob-step-card:active .hm-mob-step-imgwrap {
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
}

.hm-mob-step-imgwrap img {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.hm-mob-step-card:hover .hm-mob-step-imgwrap img,
.hm-mob-step-card:active .hm-mob-step-imgwrap img {
  transform: scale(1.04);
}

.hm-mob-step-body {
  padding-top: 14px;
  padding-left: 2px;
  padding-right: 2px;
}

.hm-mob-step-title {
  font-size: 26px;
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.375;
}

.hm-mob-step-sub {
  font-size: 16px;
  color: #6b7280;
  margin-top: 8px;
  line-height: 1.625;
}
`;
