import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import SellerStatusClient from "./SellerStatusClient";

export default function SellerStatusPage() {
  return (
    <>
      <Navbar hiddenLinks={getHiddenLinks("/seller/status")} />
      <SellerStatusClient />
    </>
  );
}
