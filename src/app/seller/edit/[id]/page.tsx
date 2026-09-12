import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import { serverFetch } from "@/lib/server-fetch";
import EditListingForm, { type EditListingData } from "./EditListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Replaces the direct getSessionUser()+pool.query() calls this page used
  // to make itself — now bundled by the backend's GET /api/pages/seller/edit/[id].
  const res = await serverFetch(`/api/pages/seller/edit/${id}`);
  if (res.status === 401) redirect(`/auth?redirect=/seller/edit/${id}`);
  if (res.status === 404) notFound();
  if (res.status === 403) redirect("/seller/status");
  const { listing, declaredSecrets, secretsAlreadySet } = (await res.json()) as {
    listing: EditListingData;
    declaredSecrets: { name: string; description?: string; required: boolean }[];
    secretsAlreadySet: string[];
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4]">
      <Navbar hiddenLinks={getHiddenLinks("/seller/edit")} />
      <div className="pt-28 pb-20 px-6 md:px-12">
        <EditListingForm listing={listing} declaredSecrets={declaredSecrets} secretsAlreadySet={secretsAlreadySet} />
      </div>
    </main>
  );
}
