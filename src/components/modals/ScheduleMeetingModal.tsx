"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * ScheduleMeetingModal wrapper
 * Replaces the legacy modal and fake success submission path.
 * When an "open-schedule-meeting" CustomEvent is dispatched from any legacy trigger,
 * this automatically routes the user to the dedicated /schedule page.
 */
export function ScheduleMeetingModal() {
  const router = useRouter();

  useEffect(() => {
    const handleOpenMeetingModal = () => {
      router.push("/schedule");
    };
    window.addEventListener("open-schedule-meeting", handleOpenMeetingModal);
    return () => window.removeEventListener("open-schedule-meeting", handleOpenMeetingModal);
  }, [router]);

  return null;
}
