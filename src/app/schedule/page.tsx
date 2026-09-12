"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import { trackEvent } from "@/lib/gtag";
import { API_BASE } from "@/lib/api-client/config";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST, GMT+5:30)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Denver", label: "US Mountain (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET)" },
  { value: "Asia/Dubai", label: "Dubai (GST, GMT+4)" },
  { value: "Asia/Singapore", label: "Singapore / Hong Kong (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, GMT+9)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

export default function SchedulePage() {
  const [userTz, setUserTz] = useState<string>("Asia/Kolkata");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingDisabled, setBookingDisabled] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<"buyer" | "seller" | "other">("buyer");
  const [topic, setTopic] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookedMeeting, setBookedMeeting] = useState<{
    token: string;
    meetUrl: string;
    slotStart: string;
    slotEnd: string;
  } | null>(null);

  // 1. Detect browser timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setUserTz(detected);
    } catch {
      setUserTz("Asia/Kolkata");
    }
  }, []);

  // 2. Fetch available slots from backend
  const loadSlots = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/meetings/availability`, { credentials: "include" });
      if (res.status === 503) {
        setBookingDisabled(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load slots (${res.status})`);
      }
      const data = await res.json();
      const loadedSlots: string[] = data.slots || [];
      setSlots(loadedSlots);
      setBookingDisabled(false);
    } catch (err: any) {
      setFetchError(err?.message || "Could not retrieve calendar availability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // 3. Group slots by date in the selected timezone
  const slotsByDate = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const slotIso of slots) {
      const d = new Date(slotIso);
      let dateKey = "";
      try {
        dateKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: userTz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d); // YYYY-MM-DD
      } catch {
        dateKey = slotIso.split("T")[0];
      }

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(slotIso);
    }

    return map;
  }, [slots, userTz]);

  const uniqueDateKeys = useMemo(() => {
    return Array.from(slotsByDate.keys()).sort();
  }, [slotsByDate]);

  // Auto-select first date with slots if none selected
  useEffect(() => {
    if (uniqueDateKeys.length > 0 && (!selectedDateKey || !slotsByDate.has(selectedDateKey))) {
      setSelectedDateKey(uniqueDateKeys[0]);
      setSelectedSlot(null);
    }
  }, [uniqueDateKeys, selectedDateKey, slotsByDate]);

  const currentDaySlots = useMemo(() => {
    return selectedDateKey ? slotsByDate.get(selectedDateKey) || [] : [];
  }, [selectedDateKey, slotsByDate]);

  // 4. Handle Slot Selection
  const handleSelectSlot = (slotIso: string) => {
    setSelectedSlot(slotIso);
    setSubmitError(null);
    trackEvent("slot_selected", {
      slot: slotIso,
      timezone: userTz,
    });
  };

  // 5. Submit Booking
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setSubmitError("Please pick a time slot from the list.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    trackEvent("booking_submitted", {
      role,
      slot: selectedSlot,
      timezone: userTz,
    });

    try {
      const res = await fetch(`${API_BASE}/api/meetings/book`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          topic: topic.trim(),
          slotStart: selectedSlot,
          timezone: userTz,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setSubmitError(
          "That time slot was just taken by another attendee. We've refreshed the calendar — please pick another available slot."
        );
        setSelectedSlot(null);
        await loadSlots();
        return;
      }

      if (res.status === 503) {
        setBookingDisabled(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Booking failed. Please try again.");
      }

      setBookedMeeting({
        token: data.token,
        meetUrl: data.meetUrl,
        slotStart: data.slotStart,
        slotEnd: data.slotEnd,
      });
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong while booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: userTz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return iso.substring(11, 16);
    }
  };

  const formatDateLabel = (dateKey: string) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(dateObj);
    } catch {
      return dateKey;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b13] text-white">
      <Navbar hiddenLinks={getHiddenLinks("/schedule")} />

      {/* Spacer for floating header */}
      <div style={{ height: "100px", flexShrink: 0 }} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            aiKart Meeting Room
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Schedule a Meeting with Us
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Select a 30-minute slot with the aiKart team to discuss AI solutions, custom agent development, or seller onboarding.
          </p>
        </div>

        {/* ── Phase 0 Kill Switch Notification ── */}
        {bookingDisabled ? (
          <div className="max-w-xl mx-auto bg-blue-500/10 border border-blue-500/25 rounded-2xl p-8 text-center backdrop-blur-xl shadow-[0_8px_32px_rgba(37,99,235,0.1)]">
            <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              ⏳
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Booking Temporarily Unavailable</h2>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Our automated meeting scheduler is currently paused for updates. You can still reach our team directly to book a call.
            </p>
            <a
              href="mailto:feedback@aikart.co?subject=Meeting%20Request%20via%20aiKart"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Email Our Team Directly →
            </a>
          </div>
        ) : bookedMeeting ? (
          /* ── Confirmation Screen ── */
          <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-10 text-center backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Meeting Confirmed!</h2>
            <p className="text-sm text-gray-300 mb-6">
              A calendar invitation (.ics) and confirmation email have been dispatched to <strong>{email}</strong>.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Scheduled Time</span>
                <span className="font-semibold text-blue-400">
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: userTz,
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  }).format(new Date(bookedMeeting.slotStart))}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Attendee</span>
                <span className="font-medium text-white">{name}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Reference Token</span>
                <code className="text-xs text-gray-300 bg-white/10 px-2 py-0.5 rounded">{bookedMeeting.token}</code>
              </div>
            </div>

            <div className="mb-6">
              <Link
                href={bookedMeeting.meetUrl}
                className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm"
              >
                Go to Meeting Portal Link →
              </Link>
              <p className="text-xs text-gray-500 mt-2">
                This room link goes live 15 minutes before the meeting start time.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setBookedMeeting(null);
                setSelectedSlot(null);
                loadSlots();
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors underline cursor-pointer"
            >
              Book Another Time Slot
            </button>
          </div>
        ) : (
          /* ── Main Booking Layout ── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Date & Slot Picker (7 cols) */}
            <div className="lg:col-span-7 bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              {/* Timezone Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Select a Date & Time</h3>
                  <p className="text-xs text-gray-400">Slots are 30 mins each (10:00–18:00 IST working hours)</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0">Timezone:</span>
                  <select
                    value={userTz}
                    onChange={(e) => setUserTz(e.target.value)}
                    className="bg-white/10 border border-white/15 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {TIMEZONES.some((t) => t.value === userTz) ? null : (
                      <option value={userTz} className="bg-[#0f172a] text-white">
                        {userTz}
                      </option>
                    )}
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-[#0f172a] text-white">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-xs text-gray-400">Querying live calendar availability...</p>
                </div>
              ) : fetchError ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
                  {fetchError}
                  <button
                    type="button"
                    onClick={() => loadSlots()}
                    className="block mx-auto mt-2 text-blue-400 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : uniqueDateKeys.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No available slots found for the next 14 days. Please check back soon or email support.
                </div>
              ) : (
                <>
                  {/* Horizontal Date Picker Chips */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
                      Available Dates
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {uniqueDateKeys.map((dKey) => {
                        const isSelected = dKey === selectedDateKey;
                        const count = slotsByDate.get(dKey)?.length || 0;
                        return (
                          <button
                            key={dKey}
                            type="button"
                            onClick={() => {
                              setSelectedDateKey(dKey);
                              setSelectedSlot(null);
                            }}
                            className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border text-xs transition-all shrink-0 cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30"
                                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            <span className="font-bold text-sm">{formatDateLabel(dKey)}</span>
                            <span className={`text-[10px] ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                              {count} slot{count !== 1 ? "s" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slot Times Grid for Selected Day */}
                  <div>
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                      Available Times for {selectedDateKey ? formatDateLabel(selectedDateKey) : ""}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {currentDaySlots.map((slotIso) => {
                        const isSelected = selectedSlot === slotIso;
                        return (
                          <button
                            key={slotIso}
                            type="button"
                            onClick={() => handleSelectSlot(slotIso)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                              isSelected
                                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30 scale-[1.02]"
                                : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 active:scale-95"
                            }`}
                          >
                            {formatSlotTime(slotIso)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Attendee Form (5 cols) */}
            <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">Your Details</h3>
              <p className="text-xs text-gray-400 mb-6">Enter your contact details to lock in your reservation.</p>

              {/* Selected Slot Preview Pill */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-5 flex items-center justify-between">
                <span className="text-xs text-blue-300 font-medium">Selected Slot:</span>
                <span className="text-xs font-bold text-blue-400">
                  {selectedSlot
                    ? `${new Intl.DateTimeFormat("en-US", {
                        timeZone: userTz,
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(selectedSlot))}`
                    : "No slot selected yet"}
                </span>
              </div>

              {submitError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs mb-4">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Role field (Required: buyer | seller | other) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    I am a... <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "buyer", label: "Buyer" },
                      { val: "seller", label: "Seller" },
                      { val: "other", label: "Other" },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setRole(item.val as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          role === item.val
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Meeting Topic / Goals <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What AI agent, problem, or platform feature would you like to discuss?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Securing Slot...
                    </>
                  ) : (
                    "Confirm & Book Meeting →"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
