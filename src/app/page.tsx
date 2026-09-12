import { headers } from "next/headers";
import HomeClient from "./HomeClient";
import HomeClientMobile from "./HomeClientMobile";
import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import { serverFetch } from "@/lib/server-fetch";

// Server component: fetch real marketplace data (runnable agents first) and hand it
// to the interactive client shell. The hero/search remain client-side and untouched.
//
// Replaces the direct getHomeData() call this page used to make itself — now
// served by the backend's GET /api/pages/home.
export default async function HomePage() {
  const [dataRes, headersList] = await Promise.all([
    serverFetch("/api/pages/home"),
    headers(),
  ]);
  const data = await dataRes.json();

  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

  return (
    <>
      <Navbar hiddenLinks={getHiddenLinks("/")} />
      {isMobile ? <HomeClientMobile data={data} /> : <HomeClient data={data} />}
    </>
  );
}
