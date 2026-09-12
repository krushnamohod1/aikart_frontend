"use client";

import { NavLink } from "./NavLink";

interface NavLinksProps {
  showExplore: boolean;
  showBecomeSeller: boolean;
  showCustomSolution: boolean;
  gated: (target: string) => string;
}

export function NavLinks({
  showExplore,
  showBecomeSeller,
  showCustomSolution,
  gated,
}: NavLinksProps) {
  return (
    <nav className="gnav-links">
      {showExplore && <NavLink href="/explore">Explore</NavLink>}
      {showBecomeSeller && <NavLink href={gated("/seller/profile")}>Become Seller</NavLink>}
      {showCustomSolution && <NavLink href={gated("/custom-agents")}>Custom Solution</NavLink>}
    </nav>
  );
}
