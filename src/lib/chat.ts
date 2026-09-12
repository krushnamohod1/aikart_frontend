// Shared helpers + types for the anonymous messaging feature.
// Pure functions only — safe to import from both server and client components.

export type ConvStatus = "pending" | "accepted" | "declined";
export type ConvRole = "buyer" | "provider";

export type ConversationSummary = {
  id: string;
  listingId: string;
  listingTitle: string;
  logoUrl: string | null;
  status: ConvStatus;
  role: ConvRole;
  otherHandle: string;
  /**
   * The other party's real name, when the thread is allowed to reveal it
   * (accepted, and not a Custom Requirement — see the conversations API for the
   * two promises this respects). Null means "show otherHandle instead".
   */
  otherName?: string | null;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  mine: boolean;
};

// Deterministic, stable anonymous handle derived from a user id (Cognito sub).
// The same user always maps to the same handle, but the handle reveals nothing.
export function anonHandle(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  }
  const n = (h % 9000) + 1000; // 4-digit number, 1000–9999
  return `User#${n}`;
}
