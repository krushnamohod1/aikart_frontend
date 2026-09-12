"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api-client/config";

// Inbox nav link with a polled unread badge (pending requests + unread messages).
export function InboxNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    let timerId: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations/unread-count`, {
          cache: "no-store",
          credentials: "include",
        });
        if (res.status === 401 || res.status === 403) {
          if (timerId) clearInterval(timerId);
          return;
        }
        if (!res.ok || !active) return;
        const data = await res.json();
        setCount(data.count ?? 0);
      } catch {
        /* ignore */
      }
    };
    load();
    timerId = setInterval(load, 30000);
    return () => {
      active = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  return (
    <Link href="/inbox" className="nb-link" style={{ position: "relative" }}>
      Inbox
      {count > 0 && (
        <span
          style={{
            position: "absolute", top: -8, right: -12, minWidth: 16, height: 16, padding: "0 4px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, background: "#2563eb", color: "#fff", borderRadius: 999,
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
