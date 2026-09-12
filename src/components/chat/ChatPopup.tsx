"use client";

import { ChatThread } from "./ChatThread";

// Floating bottom-right chat box used on the agent detail page.
export function ChatPopup({
  conversationId,
  title,
  subtitle,
  onClose,
}: {
  conversationId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="theme-aikart fixed bottom-5 right-5 z-[1050] flex flex-col bg-white border border-slate-200/90 rounded-[24px] overflow-hidden animate-in fade-in zoom-in duration-200"
      style={{
        width: "380px",
        maxWidth: "calc(100vw - 28px)",
        height: "480px",
        maxHeight: "calc(100vh - 110px)",
        minHeight: "0px",
        boxShadow: "0 20px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.06)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .ak-chat-popup-header {
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-bottom: 1px solid #f1f5f9;
        }
      ` }} />

      {/* Header */}
      <div
        className="ak-chat-popup-header flex items-center justify-between px-4 py-3 shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
              }}
            >
              <span className="material-symbols-outlined text-[20px]">forum</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <p
              className="text-[14px] font-semibold text-slate-900 truncate leading-snug"
              style={{ fontFamily: "var(--font-poppins), sans-serif" }}
            >
              {title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11.5px] text-slate-500 truncate">
                {subtitle || "Provider"}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80 leading-none">
                Online
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0 cursor-pointer"
          title="Close chat"
        >
          <span className="material-symbols-outlined text-[19px]">close</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-slate-50/50">
        <ChatThread conversationId={conversationId} compact />
      </div>
    </div>
  );
}
