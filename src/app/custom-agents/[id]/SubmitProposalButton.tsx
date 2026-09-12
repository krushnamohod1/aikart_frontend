"use client";

import { useState } from "react";
import { ChatPopup } from "@/components/chat/ChatPopup";
import type { ConvStatus } from "@/lib/chat";
import { API_BASE } from "@/lib/api-client/config";

// Proposal button on a custom-agent requirement:
//   none/declined → "Submit a Proposal" (compose proposal → creates a conversation)
//   pending       → "Proposal Sent" (opens popup showing the waiting state)
//   accepted      → "Chat with Poster" (opens the floating chat popup)
// Reuses the same anonymous messaging backend (/api/conversations) as agent listings.
export default function SubmitProposalButton({
  listingId,
  requirementTitle,
  initialStatus,
  initialConversationId,
}: {
  listingId: string;
  requirementTitle: string;
  initialStatus: ConvStatus | "none";
  initialConversationId: string | null;
}) {
  const [status, setStatus] = useState<ConvStatus | "none">(initialStatus);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [composeOpen, setComposeOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit proposal.");
      setConversationId(data.conversationId);
      setStatus(data.status);
      setComposeOpen(false);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const baseBtn =
    "w-full py-3 px-5 rounded-full font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2";
  const primaryBtn =
    "bg-gradient-to-r from-primary to-primary-dim text-on-primary hover:shadow-[0_0_20px_rgba(240,90,26,0.4)]";

  return (
    <>
      {status === "accepted" ? (
        <button onClick={() => setPopupOpen(true)} className={`${baseBtn} ${primaryBtn}`}>
          <span>Chat with Poster</span>
          <span className="material-symbols-outlined text-[20px]">forum</span>
        </button>
      ) : status === "pending" ? (
        <button
          onClick={() => setPopupOpen(true)}
          className={`${baseBtn} bg-surface-container-high border-2 border-outline-variant/30 text-on-surface-variant`}
        >
          <span>Proposal Sent</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
        </button>
      ) : (
        <button onClick={() => setComposeOpen(true)} className={`${baseBtn} ${primaryBtn}`}>
          <span>Submit a Proposal</span>
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      )}

      {/* Compose proposal modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-surface-variant/80 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/10">
              <div>
                <h2 className="text-xl font-bold font-headline text-on-surface">Submit a Proposal</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  You&apos;ll stay anonymous until the poster accepts. Pitch how you&apos;d build it.
                </p>
              </div>
              <button
                onClick={() => setComposeOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={submitProposal} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Your proposal for “{requirementTitle}” *
                </label>
                <textarea
                  required
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Hi! I can build this. Here's my approach, relevant experience, timeline, and price…"
                />
              </div>
              <button
                disabled={loading || !message.trim()}
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Send Proposal</span>
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating chat popup */}
      {popupOpen && conversationId && (
        <ChatPopup
          conversationId={conversationId}
          title={requirementTitle}
          subtitle={status === "pending" ? "Awaiting poster response" : "Poster"}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
}
