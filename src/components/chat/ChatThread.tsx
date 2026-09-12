"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ConvStatus } from "@/lib/chat";
import { API_BASE } from "@/lib/api-client/config";

// Reusable message list + composer. Polls every ~3.5s while mounted.
// Used both in the full Inbox and in the floating chat popup.
export function ChatThread({
  conversationId,
  onActivity,
  compact = false,
}: {
  conversationId: string;
  onActivity?: () => void;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConvStatus>("accepted");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        setMessages(data.messages);
        setStatus(data.status);
        setLoaded(true);
        onActivity?.();
      } catch {
        /* polling — ignore transient errors */
      }
    };
    load();
    const t = setInterval(load, 3500);
    return () => {
      active = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const m = await res.json();
        setMessages((prev) => [...prev, m]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  };

  const lastMine = [...messages].reverse().find((m) => m.mine);

  return (
    <div className="flex flex-col h-full min-h-0">
      <style dangerouslySetInnerHTML={{ __html: `
        .chat-composer-input:focus{ border-color:#2563eb; background:#ffffff; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
        .chat-send-btn{ background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
        .chat-send-btn:hover{ background:linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); }
      ` }} />
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-2.5 ${compact ? "p-3.5" : "p-6"}`}>
        {!loaded ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] ${m.mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
                    m.mine
                      ? "rounded-br-sm shadow-sm"
                      : "bg-white text-slate-800 rounded-bl-sm border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  }`}
                  style={m.mine ? { background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff" } : undefined}
                >
                  {m.body}
                </div>
                {m.mine && m.id === lastMine?.id && (
                  <span className="text-[10px] text-slate-400 pr-1 mt-0.5 font-medium">
                    {m.readAt ? "Seen" : "Sent"}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer / status banner */}
      {status === "accepted" ? (
        <form
          onSubmit={send}
          className={`flex items-center gap-2 border-t border-slate-200/80 bg-white ${
            compact ? "p-2.5 px-3" : "p-4"
          }`}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
            rows={1}
            placeholder="Type a message…"
            className="chat-composer-input flex-1 resize-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white px-4 py-2 rounded-full border border-slate-200 text-[13px] text-slate-800 focus:outline-none transition-all"
            style={{ minHeight: "38px", maxHeight: "80px", lineHeight: "20px" }}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="chat-send-btn w-9 h-9 shrink-0 rounded-full text-white flex items-center justify-center transition-all shadow-sm hover:shadow hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      ) : (
        <div className="border-t border-slate-200/80 bg-white p-3.5 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            {status === "pending"
              ? "Waiting for the provider to accept your request. You'll be able to chat once they do."
              : "This conversation isn't active."}
          </p>
        </div>
      )}
    </div>
  );
}
