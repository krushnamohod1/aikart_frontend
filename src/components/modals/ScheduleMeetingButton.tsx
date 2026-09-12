"use client";

import Link from "next/link";

export function ScheduleMeetingButton({ className }: { className?: string }) {
  return (
    <Link
      href="/schedule"
      className={className || "inline-flex items-center justify-center font-medium"}
    >
      Schedule Meeting
    </Link>
  );
}
