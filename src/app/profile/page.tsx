import { redirect } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import { Navbar } from "@/components/layout/Navbar";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  // Replaces the direct getSessionUser()+getUserProfile() calls this page
  // used to make itself — now served by the backend's GET /api/profile.
  const res = await serverFetch("/api/profile");
  if (res.status === 401) redirect("/auth?redirect=/profile");
  const { id, email, profile: profileData } = await res.json();
  const profile = profileData ?? { full_name: "", role: "user", avatar_url: null };

  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6 md:px-12 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal font-headline">Your Profile</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage your account details.</p>
        </div>

        <ProfileForm
          userId={id}
          initialName={profile.full_name ?? ""}
          initialAvatarUrl={profile.avatar_url ?? null}
          initialHeadline={profile.headline ?? ""}
          initialBio={profile.bio ?? ""}
          initialLocation={profile.location ?? ""}
          email={email}
          role={profile.role ?? "user"}
        />

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/seller/status"
            style={{ borderRadius: "9999px" }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs sm:text-sm rounded-full shadow-sm hover:shadow transition-all text-center"
          >
            <span className="material-symbols-outlined text-base text-blue-600">inventory_2</span>
            <span>My Listings</span>
          </Link>
          <Link
            href="/inbox"
            style={{ borderRadius: "9999px" }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs sm:text-sm rounded-full shadow-sm hover:shadow transition-all text-center"
          >
            <span className="material-symbols-outlined text-base text-blue-600">forum</span>
            <span>Inbox</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
