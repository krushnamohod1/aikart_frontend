export type NavLinkKey = "explore" | "becomeSeller" | "customSolution" | "scheduleMeeting";

/**
 * Route → links to hide on that route (and its sub-routes, matched by prefix).
 */
const NAV_LINK_VISIBILITY: Record<string, NavLinkKey[]> = {
  "/seller/status": ["becomeSeller"],
  "/seller/new": ["becomeSeller"],
  "/seller/edit": ["becomeSeller"],
  // The Custom Agents board has its own "Schedule Meeting" button in the
  // page header — showing the navbar's copy too would be a duplicate.
  "/custom-agents": ["scheduleMeeting"],
  // On the dedicated Schedule page, hide the redundant navbar button
  "/schedule": ["scheduleMeeting"],
};

export function getHiddenLinks(path: string): NavLinkKey[] {
  for (const [route, keys] of Object.entries(NAV_LINK_VISIBILITY)) {
    if (path === route || path.startsWith(`${route}/`)) {
      return keys;
    }
  }
  return NAV_LINK_VISIBILITY[path] ?? [];
}

