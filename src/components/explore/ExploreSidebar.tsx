"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/gtag";
import {
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
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

export type FilterState = {
  categories: string[];
  pricing: string[];
  priceMax: string;
  types: string[];
  sort: string;
  since: string;
};

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

export function ExploreSidebar({ activeFilters }: { activeFilters?: FilterState }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prevFilters, setPrevFilters] = useState(activeFilters);
  const [selectedCats, setSelectedCats] = useState<string[]>(activeFilters?.categories || []);
  const [selectedPricing, setSelectedPricing] = useState<string[]>(activeFilters?.pricing || []);
  const [selectedSort, setSelectedSort] = useState<string>(activeFilters?.sort || "");
  const [sortOpen, setSortOpen] = useState(false);

  if (prevFilters !== activeFilters) {
    setPrevFilters(activeFilters);
    setSelectedCats(activeFilters?.categories || []);
    setSelectedPricing(activeFilters?.pricing || []);
    setSelectedSort(activeFilters?.sort || "");
  }

  const totalActiveCount = selectedCats.length + selectedPricing.length + (selectedSort ? 1 : 0);

  const applyFilters = (
    cats = selectedCats,
    pricing = selectedPricing,
    sort = selectedSort
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cats.length > 0) params.set("cat", cats.join(","));
    else params.delete("cat");

    if (pricing.length > 0) params.set("pricing", pricing.join(","));
    else params.delete("pricing");

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    router.push(`/explore?${params.toString()}`);
  };

  const toggleCategory = (catVal: string) => {
    const next = selectedCats.includes(catVal)
      ? selectedCats.filter((c) => c !== catVal)
      : [...selectedCats, catVal];
    setSelectedCats(next);
    trackEvent('filter_applied', { filter_type: 'category', filter_value: catVal });
  };

  const togglePricing = (priceVal: string) => {
    const next = selectedPricing.includes(priceVal)
      ? selectedPricing.filter((p) => p !== priceVal)
      : [...selectedPricing, priceVal];
    setSelectedPricing(next);
    trackEvent('filter_applied', { filter_type: 'price', filter_value: priceVal });
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
  };

  return (
    <aside className="w-[240px] min-w-[240px] max-w-[240px] bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col font-sans overflow-hidden h-full max-h-full">
      {/* 1. Header (Sticky) */}
      <div className="sticky top-0 bg-white z-10 px-3.5 pt-3.5 pb-2.5 border-b border-[#f1f5f9] flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-blue-600 leading-tight">Filters</h2>
          <p className="text-xs text-gray-400 mt-0.5">Refine your search</p>
        </div>
        {totalActiveCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer pt-0.5"
          >
            Clear all
          </button>
        )}
      </div>

      {/* 2. Scrollable Filter Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
        {/* CATEGORIES Section */}
        <div>
          <p className="text-[10px] tracking-widest text-gray-400 font-semibold uppercase mb-2">
            Categories
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCats.includes(item.value) || selectedCats.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => toggleCategory(item.value)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10"
                      : "border-gray-200 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-[10px] tracking-wide font-semibold uppercase leading-none truncate max-w-full ${isSelected ? "text-blue-600" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRICING MODEL Section */}
        <div className="border-t border-[#f1f5f9] pt-2.5">
          <p className="text-[10px] tracking-widest text-gray-400 font-semibold uppercase mb-2">
            Pricing Model
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRICING_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedPricing.includes(item.value);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => togglePricing(item.value)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10"
                      : "border-gray-200 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                  <span className={`text-[10px] tracking-wide font-semibold uppercase leading-none ${isSelected ? "text-blue-600" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SORT BY Section */}
        <div className="border-t border-[#f1f5f9] pt-2.5">
          <p className="text-[10px] tracking-widest text-gray-400 font-semibold uppercase mb-2">
            Sort By
          </p>
          <div className="flex flex-col gap-1 mt-2">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSortChange(opt.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-sm font-medium text-left flex items-center justify-between cursor-pointer border transition-all duration-200 ease ${
                    isSelected
                      ? "bg-[#EFF6FF] text-[#2563eb] border-[#2563eb]/40"
                      : "bg-white text-gray-600 border-[#e2e8f0] hover:bg-[#EFF6FF] hover:border-[#2563eb] hover:text-[#2563eb]"
                  }`}
                >
                  <span>{opt.label}</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white"}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Footer (Apply Filters) */}
      <div className="p-3.5 bg-white border-t border-[#f1f5f9] shrink-0 z-10">
        <button
          type="button"
          onClick={() => applyFilters()}
          className="w-full py-2.5 px-4 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer text-center"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
