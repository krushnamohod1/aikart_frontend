// Converted from the single-repo app's src/app/actions/listings.ts Server
// Actions. Same names/signatures/shapes as before — callers already did
// `const res = await someAction(args)` plain calls (never useActionState),
// so no redirectTo/effect pattern is needed here (see auth's api-client for
// contrast, where it was).
import { API_BASE } from "./config";

export type ListingDraft = Record<string, unknown>;
export type MediaPayload = Record<string, unknown>;
export type SubmitListingResult = { error?: string; listingId?: string };

export async function submitListing(
  draft: ListingDraft,
  media: MediaPayload
): Promise<SubmitListingResult> {
  const res = await fetch(`${API_BASE}/api/listings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, media }),
  });
  return res.json();
}

export async function approveListing(listingId: string): Promise<{ error?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}/approve`, {
    method: "POST",
    credentials: "include",
  });
  return res.json();
}

export async function rejectListing(listingId: string, reason: string): Promise<{ error?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export type CustomRequestDraft = Record<string, unknown>;

export async function createCustomRequest(
  draft: CustomRequestDraft
): Promise<{ error?: string; listingId?: string }> {
  const res = await fetch(`${API_BASE}/api/custom-requests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  return res.json();
}

export type CustomRequestAdminEditDraft = Record<string, unknown>;

export async function updateCustomRequestAdmin(
  listingId: string,
  draft: CustomRequestAdminEditDraft
): Promise<{ error?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/custom-requests/${listingId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  return res.json();
}

export async function deleteListing(listingId: string): Promise<{ error?: string }> {
  const res = await fetch(`${API_BASE}/api/admin/listings/${listingId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function deleteOwnListing(listingId: string): Promise<{ error?: string; ok?: boolean }> {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export type ListingEditDraft = {
  title: string;
  tagline: string;
  category: string;
  listingType: string;
  description: string;
  useCase: string;
  technologies: string[];
  keyCapabilities: string[];
  pricingModel: string;
  price?: string;
  websiteUrl?: string;
};

export async function updateListing(
  id: string,
  draft: ListingEditDraft
): Promise<{ error?: string; ok?: boolean }> {
  const res = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  return res.json();
}

export async function updateListingSecrets(
  listingId: string,
  values: Record<string, string>
): Promise<{ error?: string; ok?: boolean }> {
  const res = await fetch(`${API_BASE}/api/listings/${listingId}/secrets`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return res.json();
}
