"use client";

import { useState } from "react";
import { ChatPopup } from "@/components/chat/ChatPopup";
import type { ConvStatus } from "@/lib/chat";
import { trackEvent } from "@/lib/gtag";
import { API_BASE } from "@/lib/api-client/config";

// Context-aware button on the agent detail page:
//   none/declined → "Contact Provider" (compose first message → sends request)
//   pending       → "Request Sent" (opens popup showing the waiting state)
//   accepted      → "Chat with Provider" (opens the floating chat popup)
export default function ContactProviderButton({
  listingId,
  listingTitle,
  initialStatus,
  initialConversationId,
  primary = false,
}: {
  listingId: string;
  listingTitle: string;
  initialStatus: ConvStatus | "none";
  initialConversationId: string | null;
  primary?: boolean;
}) {
  const [status, setStatus] = useState<ConvStatus | "none">(initialStatus);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitRequest = async (e: React.FormEvent) => {
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
      if (!res.ok) throw new Error(data.error || "Could not send request.");
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
    "w-full py-3 px-5 rounded-full font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer";
  const contactBtn = "cpb-contact-btn";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cpb-contact-btn{
          background: #ffffff !important;
          border: 1.5px solid #2563eb !important;
          color: #2563eb !important;
          box-shadow: 0 2px 8px rgba(37,99,235,0.06);
        }
        .cpb-contact-btn:hover{
          background: #eff6ff !important;
          border-color: #1d4fd0 !important;
          color: #1d4fd0 !important;
          box-shadow: 0 4px 14px rgba(37,99,235,0.14);
        }
        .cpb-pending-btn{
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #64748b !important;
        }
        .cpb-pending-btn:hover{
          background: #f8fafc !important;
        }
        .cpb-field:focus{ border-color:#2563eb; box-shadow:0 0 0 1px #2563eb; }
        .cpb-submit{ background:linear-gradient(120deg,#2563eb,#1d4fd0); }
      ` }} />
      {status === "accepted" ? (
        <button onClick={() => setPopupOpen(true)} className={`${baseBtn} ${contactBtn}`}>
          <span>Chat with Provider</span>
          <span className="material-symbols-outlined text-[20px]">forum</span>
        </button>
      ) : status === "pending" ? (
        <button
          onClick={() => setPopupOpen(true)}
          className={`${baseBtn} cpb-pending-btn`}
        >
          <span>Request Sent</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
        </button>
      ) : (
        <button onClick={() => {
          trackEvent('contact_seller_click', { listing_id: listingId });
          setComposeOpen(true);
        }} className={`${baseBtn} ${contactBtn}`}>
          <span>Contact Provider</span>
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </button>
      )}

      {/* Compose first message modal */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-24 pb-8 bg-black/40 backdrop-blur-[6px] overflow-y-auto"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="bg-[#ffffff] border border-[#e2e8f0] rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden my-auto animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-[#f1f5f9] bg-[#ffffff]">
              <div>
                <h2 className="text-xl font-bold font-headline text-[#0f172a]">Contact Provider</h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  You&apos;ll stay anonymous until they reply. Send a message to start.
                </p>
              </div>
              <button
                onClick={() => setComposeOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] transition-colors p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={submitRequest} className="p-6 pt-3 space-y-4 bg-[#ffffff]">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#334155] mt-2">
                  Your message about “{listingTitle}” *
                </label>
                <textarea
                  required
                  autoFocus
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="cpb-field w-full bg-[#f8fafc] px-4 py-3 rounded-xl border border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8] focus:bg-[#ffffff] focus:outline-none transition-all resize-none"
                  placeholder="Hi! I'm interested in this agent. Could you tell me more about…"
                />
              </div>
              <button
                disabled={loading || !message.trim()}
                type="submit"
                className="cpb-submit w-full py-3.5 rounded-xl text-white font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>Send Request</span>
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
          title={listingTitle}
          subtitle={status === "pending" ? "Awaiting provider response" : "Provider"}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
}
