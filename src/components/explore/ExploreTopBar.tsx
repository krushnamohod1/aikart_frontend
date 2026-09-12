"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NavSearchBar } from "@/components/layout/NavSearchBar";
import type { FilterState } from "@/components/explore/ExploreSidebar";
export type { FilterState } from "@/components/explore/ExploreSidebar";

export interface ExploreTopBarProps {
  maxWidth?: number | string;
  activeFilters?: FilterState;
}

export function ExploreTopBar({ maxWidth = 540, activeFilters }: ExploreTopBarProps) {
  const [searchVisible, setSearchVisible] = useState(true);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const catParam = searchParams.get("category");
  const qParam = searchParams.get("q");

  // Scroll to top to show agents whenever page or filters change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    const mainEl = document.querySelector(".ex-main");
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageParam, catParam, qParam]);

  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

    const onScroll = () => {
      const currentScrollY = typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop || 0 : 0;
      const isScrollingUp = currentScrollY < lastScrollY - 4; // slight threshold for touch sensitivity
      const isNearTop = currentScrollY < 60;

      // Immediately reveal searchbar when scrolling up or near page top
      if (isScrollingUp || isNearTop) {
        setSearchVisible(true);
        if (scrollStopTimerRef.current) {
          clearTimeout(scrollStopTimerRef.current);
        }
      } else {
        // Hide while actively scrolling down
        setSearchVisible(false);

        // Auto-appear 180ms after scrolling stops
        if (scrollStopTimerRef.current) {
          clearTimeout(scrollStopTimerRef.current);
        }
        scrollStopTimerRef.current = setTimeout(() => {
          setSearchVisible(true);
        }, 180);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    window.addEventListener("touchend", onScroll, { passive: true });

    const mainEl = document.querySelector(".ex-main");
    if (mainEl) {
      mainEl.addEventListener("scroll", onScroll, { passive: true });
      mainEl.addEventListener("touchmove", onScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchmove", onScroll);
      window.removeEventListener("touchend", onScroll);
      if (mainEl) {
        mainEl.removeEventListener("scroll", onScroll);
        mainEl.removeEventListener("touchmove", onScroll);
      }
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`sticky top-[72px] md:top-[104px] z-[900] mb-4 md:mb-5 flex justify-start pointer-events-none transition-all duration-300 ease-out ${
        searchVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "-translate-y-6 opacity-0 scale-95"
      }`}
    >
      {/* Transparent sizing wrapper — visual styling lives inside NavSearchBar's own pill */}
      <div
        className="pointer-events-auto w-full"
        style={{
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        }}
      >
        <NavSearchBar maxWidth="100%" fullWidth />
      </div>
    </div>
  );
}
