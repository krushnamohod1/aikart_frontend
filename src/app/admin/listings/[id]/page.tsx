import { notFound, redirect } from "next/navigation";
import AdminListingReview from "./review-client";
import { serverFetch } from "@/lib/server-fetch";

export default async function AdminListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Replaces the direct requireAdmin()+pool.query()+parseManifest() calls
  // this page used to make itself — now bundled by the backend's
  // GET /api/pages/admin/listings/[id].
  const res = await serverFetch(`/api/pages/admin/listings/${id}`);
  if (res.status === 401) redirect("/auth");
  if (res.status === 403) redirect("/explore");
  if (res.status === 404) notFound();

  const { listing, manifestValidation, secretStatus, manifestInputs, canTestSandbox } =
    await res.json();

  return (
    <AdminListingReview
      listing={listing}
      manifestValidation={manifestValidation}
      secretStatus={secretStatus}
      manifestInputs={manifestInputs}
      canTestSandbox={canTestSandbox}
    />
  );
}
