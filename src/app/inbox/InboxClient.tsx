"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChatThread } from "@/components/chat/ChatThread";
import type { ConversationSummary } from "@/lib/chat";
import { API_BASE } from "@/lib/api-client/config";

/**
 * What to call the other party in a thread.
 *
 * Falls back to the anonymous handle whenever the API withheld a name — either
 * the request is still pending, it is a Custom Requirement thread (which stays
 * anonymous by design), or the account simply has no name set.
 */
function displayName(c: { otherName?: string | null; otherHandle: string }): string {
  return c.otherName?.trim() || c.otherHandle;
}

export function InboxClient() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, { cache: "no-store", credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        return false;
      }
      if (!res.ok) return true;
      const data = await res.json();
      setConversations(data.conversations || []);
      setLoaded(true);
      return true;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    load().then((authed) => {
      if (authed !== false) {
        timer = setInterval(async () => {
          const stillAuthed = await load();
          if (stillAuthed === false && timer) clearInterval(timer);
        }, 10000);
      }
    });
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [load]);

  const act = async (id: string, action: "accept" | "decline") => {
    setActing(id);
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${id}/${action}`, { method: "POST", credentials: "include" });
      if (res.ok) {
        await load();
        if (action === "accept") setSelectedId(id);
      }
    } finally {
      setActing(null);
    }
  };

  const requests = conversations.filter(
    (c) => c.role === "provider" && c.status === "pending"
  );
  const threads = conversations.filter(
    (c) => c.status === "accepted" || (c.role === "buyer" && c.status === "pending")
  );
  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-background">
          Inbox
        </h1>
        <p className="text-on-surface-variant text-sm">
          Anonymous conversations about your agents and the ones you&apos;re exploring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 h-[calc(100vh-220px)] min-h-[480px]">
        {/* Left: list */}
        <div className="bg-surface border border-outline-variant rounded-2xl flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {!loaded ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">forum</span>
                <p className="text-sm text-on-surface-variant">
                  No conversations yet. Start one from any agent&apos;s page.
                </p>
                <Link href="/explore" className="text-primary text-sm font-semibold hover:underline">
                  Browse agents →
                </Link>
              </div>
            ) : (
              <>
                {/* Incoming requests */}
                {requests.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-2">
                      Requests · {requests.length}
                    </p>
                    <div className="space-y-2">
                      {requests.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-primary/30 bg-primary-container/40 p-3"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-on-surface">{displayName(c)}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                          <p className="text-[11px] text-on-surface-variant mb-1">
                            about {c.listingTitle}
                          </p>
                          {c.lastBody && (
                            <p className="text-xs text-on-surface line-clamp-2 mb-2">{c.lastBody}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              disabled={acting === c.id}
                              onClick={() => act(c.id, "accept")}
                              className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-dim transition-colors disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              disabled={acting === c.id}
                              onClick={() => act(c.id, "decline")}
                              className="flex-1 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant text-on-surface-variant text-xs font-bold hover:text-on-surface transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active threads */}
                {threads.length > 0 && (
                  <div className="p-3 pt-1">
                    {requests.length > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-2">
                        Messages
                      </p>
                    )}
                    <div className="space-y-1">
                      {threads.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedId(c.id)}
                          className={`w-full text-left p-3 rounded-xl transition-colors ${
                            selectedId === c.id
                              ? // Selected stays white like the rest of the panel; the grey fill
                                // (#e9eef4) read as a disabled state. A ring carries the
                                // selection instead — ring not border, so the row does not
                                // shift by a pixel when selection moves.
                                "bg-surface ring-1 ring-inset ring-primary/40"
                              : "hover:bg-surface-container-low"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-sm font-bold text-on-surface truncate">
                              {displayName(c)}
                            </span>
                            {c.unread > 0 && (
                              <span className="shrink-0 text-[10px] font-bold bg-primary text-on-primary px-1.5 py-0.5 rounded-full">
                                {c.unread}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant truncate mb-0.5">
                            {c.listingTitle}
                            {c.role === "buyer" && c.status === "pending" && " · awaiting reply"}
                          </p>
                          {c.lastBody && (
                            <p className="text-xs text-on-surface-variant truncate">{c.lastBody}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: thread */}
        <div className="bg-surface border border-outline-variant rounded-2xl flex flex-col overflow-hidden min-h-0">
          {selected ? (
            <>
              <div className="px-5 py-3 border-b border-outline-variant/30 bg-surface flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{displayName(selected)}</p>
                  <Link
                    href={`/agent/${selected.listingId}`}
                    className="text-[11px] text-primary hover:underline truncate block"
                  >
                    {selected.listingTitle}
                  </Link>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ChatThread conversationId={selected.id} onActivity={load} />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-3">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">chat</span>
              <p className="text-sm text-on-surface-variant">
                Select a conversation to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
