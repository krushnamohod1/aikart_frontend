"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function NavAvatarMenu({
  initials,
  avatarUrl,
  isAdmin,
  signOutAction,
}: {
  initials: string;
  avatarUrl?: string | null;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset img load states if avatarUrl changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [avatarUrl]);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 10,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current && !rootRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const menuContent = (
    <div
      ref={menuRef}
      className="gnav-menu"
      role="menu"
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        right: `${coords.right}px`,
        left: "auto",
        zIndex: 9999,
      }}
    >
      <Link href="/profile" className="gnav-menu-item" role="menuitem" onClick={() => setOpen(false)}>
        My Profile
      </Link>
      {isAdmin && (
        <Link href="/admin" className="gnav-menu-item" role="menuitem" onClick={() => setOpen(false)}>
          Admin Portal
        </Link>
      )}
      <Link href="/inbox" className="gnav-menu-item" role="menuitem" onClick={() => setOpen(false)}>
        My Purchases
      </Link>
      <Link href="/seller/status" className="gnav-menu-item" role="menuitem" onClick={() => setOpen(false)}>
        Seller Dashboard
      </Link>
      <div className="gnav-menu-divider" role="separator" />
      <form action={signOutAction}>
        <button type="submit" className="gnav-menu-item gnav-menu-item--danger" role="menuitem">
          Log Out
        </button>
      </form>
    </div>
  );

  const hasAvatarImg = Boolean(avatarUrl && !imgError);

  return (
    <div className="gnav-avatar-wrap" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="gnav-avatar"
        style={{ position: "relative", padding: 0, overflow: "hidden" }}
        onClick={() => {
          if (!open) updateCoords();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Your account"
      >
        <span className="select-none font-semibold text-[13px] leading-none">
          {initials}
        </span>

        {hasAvatarImg && (
          <img
            src={avatarUrl!}
            alt="Profile"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "9999px",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
            }}
          />
        )}
      </button>
      {open && mounted && createPortal(menuContent, document.body)}
    </div>
  );
}
