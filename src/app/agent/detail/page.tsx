import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import AgentDetailClient from "./AgentDetailClient";

export default function Page() {
  return (
    <>
      <Navbar hiddenLinks={getHiddenLinks("/agent/detail")} showInbox />
      <AgentDetailClient />
    </>
  );
}
