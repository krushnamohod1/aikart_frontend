import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import NewRequestForm from "./NewRequestForm";

export default async function NewCustomRequestPage() {
  // Replaces the direct getSessionUser() call this page used to make itself
  // — reuses the existing GET /api/auth/me endpoint (pure session gate, no
  // other data needed here).
  const res = await serverFetch("/api/auth/me");
  if (!res.ok) redirect("/auth?redirect=/custom-agents/new");

  return (
    <main className="min-h-screen bg-[#F4F4F4] pt-28 pb-20 px-4 md:px-12">
      <NewRequestForm />
    </main>
  );
}
