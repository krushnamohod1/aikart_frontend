import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";

export default function CustomMLModelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-aikart">
      <Navbar hiddenLinks={getHiddenLinks("/custom-ml-models")} />
      {children}
    </div>
  );
}
