// Converted from the single-repo app's src/app/actions/likes.ts's toggleLike
// Server Action. Same name/signature/shape.
import { API_BASE } from "./config";

export async function toggleLike(
  listingId: string
): Promise<{ liked?: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/listings/${listingId}/like`, {
      method: "POST",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { error: "Could not update like. Please try again." };
  }
}
