import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import { ListingFormProvider } from "./context";

export default async function SellerNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Replaces the direct getSessionUser()+getUserProfile()+
  // isSellerProfileComplete() calls this layout used to make itself — the
  // backend's GET /api/profile now computes sellerProfileComplete directly
  // (see aikart-backend), so the pure rule doesn't need duplicating here.
  const res = await serverFetch("/api/profile");
  const isProd = process.env.NODE_ENV === "production";

  let userEmail: string | undefined;
  if (res.status === 401) {
    if (isProd) redirect("/auth?redirect=/seller/new/step1");
  } else {
    const { email, sellerProfileComplete } = await res.json();
    userEmail = email;
    // Runs in dev too (unlike the login check above) — profile completeness
    // is easy to test locally and worth verifying before it ships.
    if (!sellerProfileComplete) {
      redirect("/seller/profile?redirect=/seller/new/step1");
    }
  }

  return (
    <ListingFormProvider userEmail={userEmail}>
      <div>
        {children}
      </div>
    </ListingFormProvider>
  );
}
