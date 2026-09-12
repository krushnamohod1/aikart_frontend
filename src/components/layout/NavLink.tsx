"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();

  // Extract actual target path if gated (e.g. /auth?redirect=%2Fseller%2Fnew%2Fstep1)
  const targetPath = href.startsWith("/auth?redirect=")
    ? decodeURIComponent(href.replace("/auth?redirect=", ""))
    : href;

  // Active check: matches exact path or prefix (e.g., /seller/... for Become Seller)
  const baseSegment = targetPath.startsWith("/seller") ? "/seller" : targetPath;
  const isActive = pathname
    ? (pathname === targetPath || (baseSegment !== "/" && pathname.startsWith(baseSegment)))
    : false;

  return (
    <Link
      href={href}
      className={`gnav-link ${isActive ? "gnav-link-active" : ""}`}
    >
      {children}
    </Link>
  );
}
