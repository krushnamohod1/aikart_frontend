"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Headphones,
  Code,
  TrendingUp,
  BarChart3,
  Megaphone,
  PenTool,
  Shield,
  Zap,
  Users,
  Settings,
  Gift,
  Layers,
  CreditCard,
} from "lucide-react";
import { FilterState } from "./ExploreSidebar";

const CATEGORY_ITEMS = [
  { label: "SUPPORT", value: "Support", icon: Headphones },
  { label: "CODING", value: "Coding", icon: Code },
  { label: "SALES", value: "Sales", icon: TrendingUp },
  { label: "DATA", value: "Data", icon: BarChart3 },
  { label: "MARKETING", value: "Marketing", icon: Megaphone },
  { label: "WRITING", value: "Writing & Content", icon: PenTool },
  { label: "SECURITY", value: "Security", icon: Shield },
  { label: "PRODUCTIVITY", value: "Productivity", icon: Zap },
  { label: "CUSTOMER SUPPORT", value: "Customer Support", icon: Users },
  { label: "OTHER", value: "Other", icon: Settings },
];

const PRICING_ITEMS = [
  { label: "FREE", value: "Free", icon: Gift },
  { label: "FREEMIUM", value: "Freemium", icon: Layers },
  { label: "PAID", value: "Paid", icon: CreditCard },
  { label: "CUSTOM", value: "Custom", icon: SlidersHorizontal },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export function MobileFilterModal({
  isOpen,
  onClose,
  activeFilters,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeFilters?: FilterState;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCats, setSelectedCats] = useState<string[]>(activeFilters?.categories || []);
  const [selectedPricing, setSelectedPricing] = useState<string[]>(activeFilters?.pricing || []);
  const [selectedSort, setSelectedSort] = useState<string>(activeFilters?.sort || "");
  const [sortOpen, setSortOpen] = useState(true);

  // Two-stage mount & animation states for smooth entry/exit
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Touch drag states for swipe-to-dismiss
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    setSelectedCats(activeFilters?.categories || []);
    setSelectedPricing(activeFilters?.pricing || []);
    setSelectedSort(activeFilters?.sort || "");
  }, [activeFilters, isOpen]);

  // Smooth slide-up entry and slide-down exit lifecycle
  useEffect(() => {
    const mainEl = document.querySelector(".ex-main") as HTMLElement | null;
    let timer: NodeJS.Timeout;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (mainEl) mainEl.style.overflow = "hidden";
      setIsMounted(true);
      // Double rAF / short timeout ensures DOM element is rendered before setting isVisible to true
      const raf = requestAnimationFrame(() => {
        timer = setTimeout(() => setIsVisible(true), 20);
      });
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsMounted(false);
        document.body.style.overflow = "";
        if (mainEl) mainEl.style.overflow = "";
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Touch drag handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    // Only track downward drag
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Dismiss threshold: 100px
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  const toggleCategory = (catVal: string) => {
    const next = selectedCats.includes(catVal)
      ? selectedCats.filter((c) => c !== catVal)
      : [...selectedCats, catVal];
    setSelectedCats(next);
  };

  const togglePricing = (priceVal: string) => {
    const next = selectedPricing.includes(priceVal)
      ? selectedPricing.filter((p) => p !== priceVal)
      : [...selectedPricing, priceVal];
    setSelectedPricing(next);
  };

  const handleSortChange = (sortVal: string) => {
    const next = selectedSort === sortVal ? "" : sortVal;
    setSelectedSort(next);
  };

  const handleClearAll = () => {
    setSelectedCats([]);
    setSelectedPricing([]);
    setSelectedSort("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cat");
    params.delete("sort");
    params.delete("pricing");
    params.delete("price_max");
    params.delete("types");
    params.delete("since");
    router.push(`/explore?${params.toString()}`);
    onClose();
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCats.length > 0) params.set("cat", selectedCats.join(","));
    else params.delete("cat");

    if (selectedPricing.length > 0) params.set("pricing", selectedPricing.join(","));
    else params.delete("pricing");

    if (selectedSort) params.set("sort", selectedSort);
    else params.delete("sort");

    router.push(`/explore?${params.toString()}`);
    onClose();
  };

  if (!isMounted) return null;

  return (
    <div className="md:hidden">
      {/* Dark Overlay / Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] transition-opacity duration-[650ms] ease-out ${
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Slide-up Bottom Sheet Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-[24px] shadow-2xl flex flex-col max-h-[88vh] will-change-transform"
        style={{
          transform: isVisible
            ? dragY > 0
              ? `translateY(${dragY}px)`
              : "translateY(0%)"
            : "translateY(100%)",
          transition: isDragging
            ? "none"
            : "transform 650ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease",
        }}
      >
        {/* Touch Drag Zone (Handle + Header) */}
        <div
          className="w-full pt-3 pb-2.5 px-5 border-b border-slate-100 shrink-0 cursor-grab active:cursor-grabbing select-none touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle pill */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

          {/* Header title & close button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-normal text-[#0f172a]">Filters</h2>
              <p className="text-xs text-[#64748b]">Refine your explore results</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white active:bg-red-600 active:scale-95 text-[#0f172a] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:shadow-red-500/20"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Categories */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2.5">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORY_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedCats.includes(item.value) || selectedCats.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleCategory(item.value)}
                    className={`flex flex-col items-center justify-center p-2.5 h-[64px] rounded-xl border text-center cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#2563eb] text-white font-semibold border-[#2563eb] shadow-sm shadow-blue-500/20"
                        : "bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#EFF6FF] hover:border-[#2563eb] hover:text-[#2563eb]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mb-1.5 ${isSelected ? "text-white" : "text-[#64748b]"}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Model */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2.5">
              Pricing Model
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {PRICING_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedPricing.includes(item.value);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => togglePricing(item.value)}
                    className={`flex flex-col items-center justify-center p-2.5 h-[62px] rounded-xl border text-center cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#2563eb] text-white font-semibold border-[#2563eb] shadow-sm shadow-blue-500/20"
                        : "bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#EFF6FF] hover:border-[#2563eb] hover:text-[#2563eb]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mb-1.5 ${isSelected ? "text-white" : "text-[#64748b]"}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider leading-none">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div className="border-t border-slate-100 pt-4 pb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2.5">
              Sort By
            </p>
            <div className="flex flex-col gap-2">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = selectedSort === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSortChange(opt.value)}
                    className={`w-full px-3.5 py-3 rounded-xl text-xs font-medium text-left flex items-center justify-between cursor-pointer border transition-all duration-200 ${
                      isSelected
                        ? "bg-[#EFF6FF] text-[#2563eb] font-semibold border-[#2563eb]/40"
                        : "bg-white text-[#334155] border-[#e2e8f0] hover:bg-[#EFF6FF] hover:border-[#2563eb] hover:text-[#2563eb]"
                    }`}
                  >
                    <span className="text-[13px]">{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center gap-3 shrink-0 mt-2">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex-1 py-3 px-4 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-[#475569] font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileFilterButton({
  activeFilters,
}: {
  activeFilters?: FilterState;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount =
    (activeFilters?.categories?.length || 0) +
    (activeFilters?.pricing?.length || 0) +
    (activeFilters?.sort ? 1 : 0);

  return (
    <>
      <div className="block md:hidden mb-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#cbd5e1] bg-white shadow-sm hover:border-[#2563eb] text-[#0f172a] font-normal text-xs cursor-pointer transition-all active:scale-[0.98]"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563eb]" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <MobileFilterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeFilters={activeFilters}
      />
    </>
  );
}
