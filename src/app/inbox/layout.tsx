import { Navbar } from "@/components/layout/Navbar";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-aikart">
      <Navbar />
      {children}
    </div>
  );
}
