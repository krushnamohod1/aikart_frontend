"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateFullProfile, updateProfileAvatar } from "@/lib/api-client/profile";
import { getUploadUrl } from "@/lib/api-client/storage";

export default function ProfileForm({
  userId,
  initialName,
  initialAvatarUrl,
  initialHeadline = "",
  initialBio = "",
  initialLocation = "",
  email,
  role,
}: {
  userId?: string;
  initialName: string;
  initialAvatarUrl?: string | null;
  initialHeadline?: string;
  initialBio?: string;
  initialLocation?: string;
  // email is optional — X (Twitter) accounts have no email address
  email?: string;
  role: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState(initialName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name.trim() !== initialName.trim() ||
    headline.trim() !== initialHeadline.trim() ||
    bio.trim() !== initialBio.trim() ||
    location.trim() !== initialLocation.trim();

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await updateFullProfile({
      fullName: name,
      headline,
      bio,
      location,
    });

    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;


    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Profile picture must be less than 5MB.");
      return;
    }

    setAvatarError(null);
    setUploadingAvatar(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const bucket = process.env.NEXT_PUBLIC_S3_IMAGES_BUCKET || "ai-marketplace-listing-images";
      const key = `avatars/${userId || "user"}_${Date.now()}.${ext}`;
      const contentType = file.type || "image/jpeg";

      const { uploadUrl, publicUrl } = await getUploadUrl(bucket, key, contentType);

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image to storage.");
      }

      const saveRes = await updateProfileAvatar(publicUrl);
      if (saveRes.error) {
        throw new Error(saveRes.error);
      }

      setAvatarUrl(publicUrl);
      window.dispatchEvent(new CustomEvent("aikart:avatar-updated", { detail: { avatarUrl: publicUrl } }));
      router.refresh();
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setAvatarError(err?.message || "Failed to update profile picture. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const saveRes = await updateProfileAvatar(null);
      if (saveRes.error) throw new Error(saveRes.error);
      setAvatarUrl(null);
      window.dispatchEvent(new CustomEvent("aikart:avatar-updated", { detail: { avatarUrl: null } }));
      router.refresh();
    } catch (err: any) {
      setAvatarError("Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initials = (name || email || "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* ─── Profile Card Top: Avatar & User Identity ─── */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
          {/* Avatar frame */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-tr from-[#2563eb] to-[#3b82f6] flex items-center justify-center text-white text-2xl font-bold">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "User avatar"}
                  width={88}
                  height={88}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white text-[#2563eb] border border-slate-200 rounded-full shadow hover:bg-slate-50 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              title="Change avatar"
              aria-label="Upload profile picture"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* User Name & Details Header */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {name || "Your Name"}
              </h2>
              {role === "admin" && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              {role === "seller" && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Verified Seller
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate mb-3">{email}</p>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {uploadingAvatar ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-slate-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {avatarError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-red-700">
            {avatarError}
          </div>
        )}
      </div>

      {/* ─── Personal & Professional Info ─── */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-5">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-lg">person</span>
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="display-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. Jane Smith"
              maxLength={100}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-500 text-sm font-medium cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="headline" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Professional Headline / Role
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. AI Engineer & Solutions Architect"
              maxLength={120}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. San Francisco, USA or Bengaluru, India"
              maxLength={80}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            About / Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
            placeholder="Tell businesses and collaborators about your background, AI workflows, or solutions..."
            maxLength={600}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ─── Save Action ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || !name.trim()}
          style={{ borderRadius: "9999px" }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3.5 rounded-full shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto cursor-pointer"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Saving Profile…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              Save Changes
            </>
          )}
        </button>

        {saved && (
          <span className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-semibold py-2">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            Profile updated successfully!
          </span>
        )}
      </div>
    </div>
  );
}
