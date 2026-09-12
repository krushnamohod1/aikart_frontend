import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";

// Navbar lives in the layout so it persists across /explore navigations
// (only the page re-renders on query changes). This keeps the search bar —
// and its AI thinking panel — mounted and stable while results load.
export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col">
      <Navbar hiddenLinks={getHiddenLinks("/explore")} showInbox />
      {children}
    </div>
  );
}
