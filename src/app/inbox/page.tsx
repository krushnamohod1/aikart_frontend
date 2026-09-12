import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";
import { InboxClient } from "./InboxClient";

export default async function InboxPage() {
  // Replaces the direct getSessionUser() call this page used to make itself
  // — reuses the existing GET /api/auth/me endpoint (pure session gate, no
  // other data needed here).
  const res = await serverFetch("/api/auth/me");
  if (!res.ok) redirect("/auth?redirect=/inbox");

  return (
    <main className="pt-20 bg-background min-h-screen">
      <InboxClient />
    </main>
  );
}
