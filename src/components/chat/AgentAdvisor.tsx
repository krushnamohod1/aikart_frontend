"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE } from "@/lib/api-client/config";

type Recommendation = { id: string; title: string; why: string };
type DeepWeb = { name: string; fit: string };
type UIMessage = {
  role: "user" | "assistant";
  content: string;
  options?: string[];
  recommendations?: Recommendation[];
  exactMatch?: boolean;
  deepWeb?: DeepWeb[];
  done?: boolean;
};

const STORAGE_KEY = "aikart_advisor_v1";
// Surface the advisor on explore-agents and custom-agents pages.
const SHOWN_ON = ["/explore", "/custom-agents"];

const GREETING: UIMessage = {
  role: "assistant",
  content:
    "Hi there! 👋 I'm your aiKart Advisor. Tell me the problem you're trying to solve in your own words and I'll figure out the best AI agents for you.",
  options: [
    "Automate customer support",
    "Generate marketing content",
    "Analyze data / reports",
    "Build / code something",
  ],
};

export default function AgentAdvisor() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore session chat history.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist for the session.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  if (!SHOWN_ON.some((p) => pathname?.startsWith(p))) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: UIMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/advisor`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          options: data.options ?? [],
          recommendations: data.recommendations ?? [],
          exactMatch: data.exactMatch ?? false,
          deepWeb: data.deepWeb ?? [],
          done: data.done ?? false,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I hit a snag. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([GREETING]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-[9998] flex items-center h-14 w-14 hover:w-[200px] sm:hover:w-[220px] active:w-[200px] sm:active:w-[220px] focus:w-[200px] sm:focus:w-[220px] pl-[15px] rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4fd0] text-white shadow-[0_8px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.65)] hover:scale-[1.03] overflow-hidden transition-all duration-300 ease-out active:scale-95 cursor-pointer outline-none select-none"
          aria-label="Open AI Advisor"
        >
          <span className="relative shrink-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              support_agent
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          </span>
          <span className="font-bold text-sm whitespace-nowrap ml-2.5 opacity-0 group-hover:opacity-100 group-active:opacity-100 group-focus:opacity-100 transition-opacity duration-200 delay-100">
            Find your AI agent
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-[calc(100vw-3rem)] sm:w-[390px] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-[#2563eb] to-[#1d4fd0] text-white">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15px] leading-tight">Which AI agent do you need?</h3>
              <p className="text-[11px] text-white/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" /> aiKart Advisor · online
              </p>
            </div>
            <button onClick={reset} title="New chat" className="text-white/80 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
            <button onClick={() => setOpen(false)} title="Close" className="text-white/80 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "assistant" ? (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-900 leading-relaxed">
                        {m.content}
                      </div>

                      {/* "Related, not exact" disclaimer */}
                      {m.recommendations && m.recommendations.length > 0 && m.exactMatch === false && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 leading-relaxed">
                          <span className="material-symbols-outlined text-amber-500 text-[16px] mt-px">info</span>
                          <span>There&apos;s no <span className="font-semibold">direct</span> agent for your exact need on aiKart yet, but these might be <span className="font-semibold">related</span> to what you&apos;re looking for:</span>
                        </div>
                      )}

                      {/* Platform recommendations */}
                      {m.recommendations && m.recommendations.length > 0 && (
                        <div className="space-y-1.5">
                          {m.recommendations.map((r) => (
                            <Link
                              key={r.id}
                              href={`/agent/${r.id}`}
                              className="group flex items-start gap-2 bg-white border border-[#2563eb]/30 hover:border-[#2563eb] hover:bg-[#2563eb]/5 rounded-xl px-3 py-2 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[#2563eb] text-[18px] mt-0.5">smart_toy</span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-bold text-gray-900 group-hover:text-[#2563eb] transition-colors">{r.title}</span>
                                <span className="block text-xs text-gray-500 leading-snug">{r.why}</span>
                              </span>
                              <span className="material-symbols-outlined text-gray-300 group-hover:text-[#2563eb] text-[18px] transition-colors">arrow_forward</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Deep web fallback */}
                      {m.deepWeb && m.deepWeb.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-2 text-[#2563eb]">
                            <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Deep Web Vector Search · AI Solutions</span>
                          </div>
                          <ul className="space-y-1.5">
                            {m.deepWeb.map((d, j) => (
                              <li key={j} className="flex gap-2 text-xs leading-relaxed">
                                <span className="text-[#2563eb] mt-px">▸</span>
                                <span className="text-gray-700"><span className="font-bold text-gray-900">{d.name}</span>: {d.fit}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-[10px] text-gray-400 italic">AI-powered external tools, not hosted on aiKart.</p>
                        </div>
                      )}

                      {/* Custom-listing CTA on a final recommendation turn */}
                      {m.done && (
                        <Link
                          href="/custom-agents"
                          className="group flex items-start gap-2 bg-gray-900 hover:bg-black rounded-xl px-3 py-2.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[#2563eb] text-[18px] mt-0.5">add_circle</span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-white leading-snug">Still not finding the right fit?</span>
                            <span className="block text-[11px] text-gray-300 leading-snug">Post a custom AI agent request. Builders can reach out to you directly.</span>
                          </span>
                          <span className="material-symbols-outlined text-gray-500 group-hover:text-[#2563eb] text-[18px] transition-colors">arrow_forward</span>
                        </Link>
                      )}

                      {/* Quick-pick options */}
                      {i === messages.length - 1 && !loading && m.options && m.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {m.options.map((o) => (
                            <button
                              key={o}
                              onClick={() => send(o)}
                              className="text-xs font-medium text-[#2563eb] bg-[#2563eb]/8 border border-[#2563eb]/30 hover:bg-[#2563eb]/15 rounded-full px-3 py-1.5 transition-colors"
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-[#2563eb] text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-relaxed max-w-[80%]">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Describe your problem…"
              className="flex-1 resize-none max-h-28 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563eb] transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4fd0] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform shrink-0"
              aria-label="Send"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
