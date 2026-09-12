// Converted from the single-repo app's src/app/actions/profile.ts Server Actions.
import { API_BASE } from "./config";

export type ProfileUpdateData = {
  fullName: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  skills?: string[];
};

export async function updateProfileName(fullName: string): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/api/profile/name`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName }),
  });
  return res.json();
}

export async function updateFullProfile(data: ProfileUpdateData): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateProfileAvatar(avatarUrl: string | null): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/api/profile/avatar`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });
  return res.json();
}
