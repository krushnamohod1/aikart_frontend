import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import SellerProfileForm from "./SellerProfileForm";

export default async function SellerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;

  // Replaces the direct getSessionUser()+getUserProfile() calls this page
  // used to make itself — now served by the backend's GET /api/profile.
  const res = await serverFetch("/api/profile");
  if (res.status === 401) {
    redirect(`/auth?redirect=${encodeURIComponent(redirectParam ? `/seller/profile?redirect=${redirectParam}` : "/seller/profile")}`);
  }
  const { email, profile } = await res.json();

  const safeRedirect = redirectParam && /^\/(?!\/)/.test(redirectParam) ? redirectParam : undefined;

  return (
    <div className="min-h-screen bg-[#F4F4F4] overflow-x-hidden">
      <Navbar hiddenLinks={getHiddenLinks("/seller/profile")} />

      <main className="max-w-4xl mx-auto pt-28 pb-16 px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <style>{`
            @media (min-width: 768px) {
              .seller-onboarding-eyebrow {
                font-family: var(--font-inter), 'Inter', sans-serif !important;
                font-size: 14px !important;
                background: linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%) !important;
                background-size: 200% 100% !important;
                background-position: 0% 50% !important;
                -webkit-background-clip: text !important;
                background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                color: transparent !important;
                display: inline-block;
                animation: sp-gradientShift 6s linear infinite;
              }
            }
          `}</style>
          <p className="text-xs font-bold tracking-wider uppercase mb-1 animated-gradient-text seller-onboarding-eyebrow" style={{ backgroundImage: "linear-gradient(90deg, #2563EB 0%, #FFAE00 100%)" }}>Seller Onboarding</p>
          <h1 className="text-2xl sm:text-3xl text-gray-900">Create your profile</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your public creator and AI solutions provider profile.</p>
        </div>

        {safeRedirect && (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-800 mb-6">
            <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
            <span>Add your display name to continue  sellers need a profile before listing an agent.</span>
          </div>
        )}

        <SellerProfileForm userEmail={email} initialName={profile?.full_name ?? ""} redirectTo={safeRedirect} />
      </main>
    </div>
  );
}
