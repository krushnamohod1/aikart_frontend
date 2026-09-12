import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";

// Mirrors the Explore layout so the Custom Agents board shares the same persistent
// nav bar and search bar across the listing and detail pages.
export default function CustomAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-aikart">
      <Navbar hiddenLinks={getHiddenLinks("/custom-agents")} />
      {children}
    </div>
  );
}
