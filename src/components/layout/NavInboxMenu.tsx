"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api-client/config";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link_url: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function NavInboxMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 10,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { cache: "no-store", credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        return false;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
      return true;
    } catch {
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    fetchNotifications().then((isAuthed) => {
      if (isAuthed) {
        intervalId = setInterval(async () => {
          const stillAuthed = await fetchNotifications();
          if (!stillAuthed && intervalId) clearInterval(intervalId);
        }, 15000);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click or scroll/resize
  useEffect(() => {
    if (!open) return;
    updateCoords();

    const handleScrollOrResize = () => updateCoords();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-read`, { method: "POST", credentials: "include" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* ignore */
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      try {
        await fetch(`${API_BASE}/api/notifications/mark-read`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.link_url) {
      router.push(n.link_url);
    }
  };

  const dropdownPanel = (
    <div
      ref={panelRef}
      className="bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[480px] w-[320px] sm:w-[380px]"
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        right: `${coords.right}px`,
        left: "auto",
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[#0f172a]">Inbox</span>
          {unreadCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C8A00]/10 text-[#1C8A00]">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List Content */}
      <div className="overflow-y-auto flex-1 divide-y divide-[#f1f5f9]">
        {loading ? (
          <div className="p-6 text-center text-xs text-[#64748b] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#94a3b8]">mail</span>
            <p className="text-xs font-medium text-[#64748b]">No notifications yet</p>
            <p className="text-[11px] text-[#94a3b8]">You&apos;ll see updates here as real activity occurs.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 flex items-start gap-3 hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                !n.is_read ? "bg-[#eff6ff]/40" : ""
              }`}
            >
              <div className="mt-1 flex-shrink-0">
                <span
                  className="w-2 h-2 rounded-full inline-block bg-[#2563eb]"
                  style={{ opacity: n.is_read ? 0 : 1 }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className={`text-xs text-[#0f172a] truncate ${!n.is_read ? "font-bold" : "font-medium"}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-[#94a3b8] whitespace-nowrap" suppressHydrationWarning>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
                <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer link to full inbox page */}
      <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] text-center">
        <Link
          href="/inbox"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-[#2563eb] hover:underline inline-flex items-center gap-1"
        >
          View Full Inbox →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* 38x38px white circular container matching the avatar button size */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) updateCoords();
          setOpen(!open);
        }}
        className="relative w-[38px] h-[38px] bg-white rounded-full border border-[#e2e8f0] flex items-center justify-center shadow-sm hover:shadow-md transition-all cursor-pointer overflow-visible flex-shrink-0 box-border"
        style={{ width: "38px", height: "38px", minWidth: "38px", minHeight: "38px", borderRadius: "50%" }}
        aria-label="Inbox & Notifications"
      >
        {/* Flat two-tone blue envelope vector SVG (20x20px centered) */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[20px] h-[20px] flex-shrink-0"
        >
          {/* Base rounded envelope body (#2196F3) */}
          <rect x="2" y="6" width="28" height="20" rx="4.5" fill="#2196F3" />
          {/* Envelope fold shading (#1E88E5) */}
          <path
            d="M2 9.5L16 19.5L30 9.5V21.5C30 23.9853 27.9853 26 25.5 26H6.5C4.01472 26 2 23.9853 2 21.5V9.5Z"
            fill="#1E88E5"
          />
          {/* Light blue triangular top flap (#5EA9F5) */}
          <path
            d="M2.5 6.5C2.5 6.2 2.7 6 3 6H29C29.3 6 29.5 6.2 29.5 6.5C29.5 6.7 29.4 6.9 29.2 7.1L16.8 16.5C16.3 16.9 15.7 16.9 15.2 16.5L2.8 7.1C2.6 6.9 2.5 6.7 2.5 6.5Z"
            fill="#5EA9F5"
          />
        </svg>

        {/* Green unread indicator dot (#1C8A00) positioned at top-right corner edge */}
        {unreadCount > 0 && (
          <span
            className="absolute top-[0px] right-[0px] w-[8px] h-[8px] rounded-full bg-[#1C8A00] ring-1.5 ring-white z-10"
            title={`${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
          />
        )}
      </button>

      {open && mounted && createPortal(dropdownPanel, document.body)}
    </div>
  );
}
