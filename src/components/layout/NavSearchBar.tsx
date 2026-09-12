"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { API_BASE } from "@/lib/api-client/config";

type Suggestion = { id: string; title: string; category: string };

// Category → accent colour
const CAT_COLOR: Record<string, string> = {
  Development:       "#2563eb",
  Analytics:         "#2563eb",
  "Customer Support":"#60a5fa",
  Design:            "#60a5fa",
  Security:          "#1d4fd0",
  Marketing:         "#2563eb",
};

// Cinematic staged status messages shown while AI is thinking
const AI_STAGES = [
  "Scanning 1M+ agents across the web",
  "Identifying your intent",
  "Matching capabilities to your problem",
  "Performing deep vector analysis",
  "Ranking the most optimized agents",
];
// Cumulative gaps (ms) to advance from stage i → i+1; holds on the last stage
const STAGE_GAPS = [2400, 3800, 5000, 6400];

export function NavSearchBar({
  maxWidth,
  fullWidth,
  className,
  style,
}: {
  maxWidth?: string | number;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
} = {}) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const inputRef     = useRef<HTMLInputElement>(null);
  const wrapRef      = useRef<HTMLDivElement>(null);

  const urlQuery = searchParams.get("q") ?? "";
  const urlAi    = searchParams.get("ai") === "1";

  const [isPending, startTransition] = useTransition();

  const [focused,     setFocused]     = useState(false);
  // AI mode is enabled by default on the Explore page; elsewhere it follows the URL.
  const aiDefault = pathname === "/explore";
  const [aiMode,      setAiMode]      = useState(urlAi || aiDefault);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDrop,    setShowDrop]    = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);

  // AI thinking-panel state
  const [aiActive,  setAiActive]  = useState(false); // panel mounted
  const [finishing, setFinishing] = useState(false); // collapsing/dissolving
  const [stage,     setStage]     = useState(0);
  const [scanned,   setScanned]   = useState(0);

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPending     = useRef(false);
  const maxTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef    = useRef(0); // increments on each new search to detect stale resolves

  /* ── Sync URL → input (persists typed text after results land) ── */
  /* Also the authoritative "search is done" signal: when URL changes and search was active, clear aiActive */
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = urlQuery;
    setAiMode(urlAi || aiDefault);
    setShowDrop(false);
    setSuggestions([]);

    if (aiActive) {
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      setFinishing(true);
      setStage(AI_STAGES.length);
      const t = setTimeout(() => {
        setAiActive(false);
        setFinishing(false);
        setStage(0);
        setScanned(0);
        wasPending.current = false;
      }, 400);
      return () => clearTimeout(t);
    }
  }, [urlQuery, urlAi, aiDefault, aiActive]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Stage progression while AI panel is active ── */
  useEffect(() => {
    if (!aiActive || finishing) return;
    let acc = 0;
    const timers = STAGE_GAPS.map((g, i) => {
      acc += g;
      return setTimeout(() => setStage((s) => Math.max(s, i + 1)), acc);
    });
    return () => timers.forEach(clearTimeout);
  }, [aiActive, finishing]);

  /* ── Live "agents scanned" counter for flair ── */
  useEffect(() => {
    if (!aiActive || finishing) return;
    const target = 1_280_000;
    const id = setInterval(() => {
      setScanned((v) => {
        if (v >= target) return target;
        const next = v + Math.max(1, Math.round((target - v) * 0.075)) + Math.floor(Math.random() * 600);
        return next > target ? target : next;
      });
    }, 85);
    return () => clearInterval(id);
  }, [aiActive, finishing]);

  /* ── Completion: isPending transition resolves ── */
  useEffect(() => {
    if (isPending) wasPending.current = true;
    // If transition resolves and we were pending — start dissolve
    if (aiActive && wasPending.current && !isPending && !finishing) {
      setFinishing(true);
      setStage(AI_STAGES.length);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      const t = setTimeout(() => {
        setAiActive(false);
        setFinishing(false);
        setStage(0);
        setScanned(0);
        wasPending.current = false;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isPending, aiActive, finishing]);

  /* ── Suggestions fetch (debounced) ── */
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) { setSuggestions([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/suggestions?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data);
        setShowDrop(data.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setShowDrop(false);
      }
    }, 220);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!aiActive) fetchSuggestions(e.target.value);
  }

  function submitQuery(q: string, forceAi = false) {
    if (!q.trim() || aiActive) return;

    // On the Custom Agents board, keep searches there (keyword only — that board
    // has no AI search path).
    if (pathname?.startsWith("/custom-agents")) {
      setShowDrop(false);
      startTransition(() => {
        router.push(`/custom-agents?q=${encodeURIComponent(q)}`);
      });
      return;
    }

    const useAi = forceAi || aiMode;
    setShowDrop(false);
    if (useAi) {
      // Increment search ID — any stale resolves with an old ID will be ignored
      searchIdRef.current += 1;
      const thisSearchId = searchIdRef.current;

      setAiActive(true);
      setFinishing(false);
      setStage(0);
      setScanned(0);
      wasPending.current = false;

      // Safety net: force-clear after 8s regardless of navigation state
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = setTimeout(() => {
        // Only clear if this is still the current search
        if (searchIdRef.current === thisSearchId) {
          setFinishing(true);
          setStage(AI_STAGES.length);
          setTimeout(() => {
            if (searchIdRef.current === thisSearchId) {
              setAiActive(false);
              setFinishing(false);
              setStage(0);
              setScanned(0);
              wasPending.current = false;
            }
          }, 500);
        }
      }, 8000);
    }
    startTransition(() => {
      router.push(
        useAi
          ? `/explore?q=${encodeURIComponent(q)}&ai=1`
          : `/explore?q=${encodeURIComponent(q)}`
      );
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDrop && suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); return; }
      if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        const s = suggestions[activeIdx];
        goToAgent(s);
        return;
      }
    }
    if (e.key === "Enter")  submitQuery((e.target as HTMLInputElement).value);
    if (e.key === "Escape") setShowDrop(false);
  }

  // Clicking (or Enter-selecting) a suggested agent goes straight to that agent's
  // page — no AI search. Real listings have UUID ids (/agent/{id}); the few legacy
  // demo suggestions use slug ids and keep their old /agent/detail route.
  function goToAgent(s: Suggestion) {
    setShowDrop(false);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id);
    startTransition(() => {
      router.push(isUuid ? `/agent/${s.id}` : `/agent/detail?agent=${encodeURIComponent(s.id)}`);
    });
  }

  function selectSuggestion(s: Suggestion) {
    goToAgent(s);
  }

  /* ── derived styles ── */
  const busy = isPending || aiActive;

  return (
    <>
      <div
        ref={wrapRef}
        className={className}
        style={{
          flex: fullWidth ? "1 1 100%" : (maxWidth ? `1 1 ${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth}` : "1 1 520px"),
          minWidth: 260,
          maxWidth: fullWidth ? "100%" : (maxWidth ?? 520),
          width: fullWidth ? "100%" : undefined,
          position: "relative",
          ...style,
        }}
      >
        {/* ── Search pill ── */}
        <div
          onClick={() => !busy && inputRef.current?.focus()}
          style={{
            display:"flex", alignItems:"center", gap:10,
            height:"48px",
            padding:"4px 6px 4px 16px",
            background: "#FFFFFF",
            border: "1px solid #e2e8f0",
            borderRadius: showDrop ? "16px 16px 0 0" : "24px",
            cursor: busy ? "default" : "text",
            transition:"border-color .15s, box-shadow .15s, background .2s, border-radius .1s",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
            position:"relative", zIndex:51,
          }}
        >
          {/* Sparkle / search icon */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!busy) { setAiMode((p) => !p); inputRef.current?.focus(); } }}
            title={aiMode ? "AI mode on, click to switch to keyword" : "Enable AI search"}
            style={{ background:"none", border:"none", padding:0, cursor: busy ? "default" : "pointer", display:"flex", alignItems:"center", flexShrink:0, transition:"transform .2s", transform: aiMode && !busy ? "scale(1.1)" : "scale(1)" }}
          >
            {busy ? (
              <svg width="18" height="18" viewBox="0 0 14 14" style={{ animation:"nsb-spin .7s linear infinite" }}>
                <circle cx="7" cy="7" r="5.5" fill="none" stroke="#dbeafe" strokeWidth="2"/>
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill={aiMode ? "#2563eb" : "none"} stroke="#2563eb"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: aiMode ? "drop-shadow(0 0 4px rgba(37,99,235,0.6))" : "none", transition:"filter .2s, fill .2s" }}
              >
                <path d="M12 2L14.5 7.5L20 10L14.5 12.5L12 18L9.5 12.5L4 10L9.5 7.5L12 2Z"/>
                <path d="M19 15L19.8 17L22 17.8L19.8 18.6L19 21L18.2 18.6L16 17.8L18.2 17L19 15Z"/>
              </svg>
            )}
          </button>

          <input
            ref={inputRef}
            defaultValue={urlQuery}
            placeholder={busy ? "aiKart AI is thinking…" : "Search AI agents..."}
            disabled={busy}
            autoComplete="off"
            onFocus={() => { setFocused(true); if (!aiActive && inputRef.current?.value) fetchSuggestions(inputRef.current.value); }}
            onBlur={() => setFocused(false)}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className="nsb-input"
            style={{
              flex:1, border:"none", background:"transparent",
              fontFamily:"var(--font-inter), 'Inter', sans-serif", fontWeight:400, fontSize:"15px", color:"#0f172a",
              outline:"none", padding:0, minWidth:0,
              opacity: busy ? 0.6 : 1, transition:"opacity .2s",
            }}
          />

          {/* AI badge with official white AI mark logo */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!busy) { setAiMode((p) => !p); inputRef.current?.focus(); } }}
            title={aiMode ? "AI Search active, click to toggle" : "Click to enable AI Search"}
            className="nsb-ai-badge"
            style={{
              width: "44px",
              height: "34px",
              borderRadius: "999px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#2563eb",
              marginRight: "2px",
              cursor: "pointer",
            }}
          >
            <img
              src="/logo/aikart-ai-mark-white.png"
              alt="AI"
              style={{ height: "18px", width: "auto", objectFit: "contain", display: "block" }}
            />
          </button>
        </div>

        {/* ── Suggestions dropdown ── */}
        {showDrop && !aiActive && suggestions.length > 0 && (
          <div style={{
            position:"absolute", top:"100%", left:0, right:0,
            background:"#fff", border:"1px solid #dbeafe", borderTop:"1px solid #bfdbfe",
            borderRadius:"0 0 14px 14px", boxShadow:"0 12px 32px rgba(0,0,0,0.10)",
            zIndex:50, overflow:"hidden",
          }}>
            <div style={{ padding:"7px 14px 5px", display:"flex", alignItems:"center", gap:6, borderBottom:"1px solid #eaf1ff" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span style={{ fontSize:10, fontWeight:600, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                Keyword matches
              </span>
            </div>

            {suggestions.map((s, i) => (
              <div
                key={s.id}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(-1)}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 14px", cursor:"pointer",
                  background: activeIdx === i ? "rgba(37,99,235,0.05)" : "transparent",
                  borderLeft: activeIdx === i ? "2px solid #2563eb" : "2px solid transparent",
                  transition:"background .1s, border-color .1s",
                }}
              >
                <div style={{
                  width:26, height:26, borderRadius:7, flexShrink:0,
                  background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, color: CAT_COLOR[s.category] ?? "#2563eb",
                }}>{s.title.charAt(0)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.title}</div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:1 }}>{s.category}</div>
                </div>
                {activeIdx === i && <span style={{ fontSize:9, color:"#94a3b8", fontWeight:600, flexShrink:0 }}>↵</span>}
              </div>
            ))}

            <div
              onMouseDown={(e) => { e.preventDefault(); const q = inputRef.current?.value ?? ""; if (q.trim()) submitQuery(q, true); }}
              style={{ padding:"8px 14px", borderTop:"1px solid #eaf1ff", display:"flex", alignItems:"center", gap:8, cursor:"pointer", background:"rgba(37,99,235,0.02)", transition:"background .1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,99,235,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(37,99,235,0.02)")}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L14.5 7.5L20 10L14.5 12.5L12 18L9.5 12.5L4 10L9.5 7.5L12 2Z"/>
                <path d="M19 15L19.8 17L22 17.8L19.8 18.6L19 21L18.2 18.6L16 17.8L18.2 17L19 15Z"/>
              </svg>
              <span style={{ fontSize:11, color:"#2563eb", fontWeight:600 }}>Search with AI instead →</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jura:wght@700&display=swap');
        .nsb-input::placeholder { color: #9CA3AF !important; opacity: 1; font-weight: 400; font-size: 15px; }

        .nsb-ai-badge {
          background: #2563eb !important;
          transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }
        .nsb-ai-badge:hover {
          background: #1d4ed8 !important;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        @keyframes nsb-spin  { to { transform: rotate(360deg); } }
        @keyframes nsb-pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }

        .nsb-backdrop {
          position: fixed; inset: 0; z-index: 49;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(4px);
          transition: opacity .4s ease;
          pointer-events: none;
          animation: nsb-fade .35s ease both;
        }
        @keyframes nsb-fade { from { opacity:0 } to { opacity:1 } }

        .nsb-panel {
          position: absolute; top: calc(100% + 9px); left: 0; right: 0; z-index: 50;
          padding: 15px 16px 15px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(240,247,255,0.72), rgba(230,240,255,0.62));
          backdrop-filter: blur(22px) saturate(170%);
          -webkit-backdrop-filter: blur(22px) saturate(170%);
          border: 1px solid rgba(37,99,235,0.18);
          box-shadow:
            0 24px 60px rgba(37,99,235,0.12),
            0 6px 20px rgba(0,0,0,0.07),
            inset 0 1px 0 rgba(255,255,255,0.7);
          overflow: hidden;
          transform-origin: top center;
          animation: nsb-panel-in .46s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes nsb-panel-in {
          from { opacity:0; transform: translateY(-10px) scaleY(.9); filter: blur(5px); }
          to   { opacity:1; transform: translateY(0)     scaleY(1);  filter: blur(0); }
        }
        .nsb-panel-out { animation: nsb-panel-out .6s cubic-bezier(.4,0,.2,1) both; }
        @keyframes nsb-panel-out {
          from { opacity:1; transform: translateY(0)    scaleY(1);   filter: blur(0); }
          to   { opacity:0; transform: translateY(-8px) scaleY(.86); filter: blur(4px); }
        }

        .nsb-sheen {
          position:absolute; top:0; left:0; right:0; height:2px;
          background: linear-gradient(90deg, transparent, rgba(37,99,235,0.9), transparent);
          background-size: 50% 100%;
          animation: nsb-sheen 1.8s ease-in-out infinite;
        }
        @keyframes nsb-sheen {
          0% { background-position: -120% 0; }
          100% { background-position: 220% 0; }
        }

        .nsb-bar { position:relative; height:3px; border-radius:2px; background: rgba(37,99,235,0.12); overflow:hidden; }
        .nsb-bar-fill {
          position:absolute; top:0; bottom:0; width:38%; border-radius:2px;
          background: linear-gradient(90deg, transparent, #2563eb 45%, #60a5fa 60%, transparent);
          animation: nsb-indet 1.25s ease-in-out infinite;
        }
        @keyframes nsb-indet {
          0%   { transform: translateX(-130%); }
          100% { transform: translateX(360%); }
        }

        .nsb-sparkle { display:flex; animation: nsb-twinkle 1.6s ease-in-out infinite; filter: drop-shadow(0 0 5px rgba(37,99,235,0.5)); }
        @keyframes nsb-twinkle {
          0%,100% { transform: rotate(0deg) scale(1); opacity:1; }
          50%     { transform: rotate(20deg) scale(1.12); opacity:.85; }
        }

        .nsb-dots { display:inline-block; width:14px; text-align:left; animation: nsb-pulse 1.2s infinite; }
        .nsb-stage { display:flex; align-items:center; gap:10px; transition: opacity .4s ease; }
        .nsb-pop { animation: nsb-pop .3s cubic-bezier(.34,1.56,.64,1) both; }
        @keyframes nsb-pop { from { transform: scale(.4); opacity:0; } to { transform: scale(1); opacity:1; } }

        .nsb-shimmer {
          background: linear-gradient(90deg, #2563eb 30%, #93c5fd 50%, #2563eb 70%);
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: nsb-shimmer 1.6s linear infinite;
        }
        @keyframes nsb-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>
    </>
  );
}
