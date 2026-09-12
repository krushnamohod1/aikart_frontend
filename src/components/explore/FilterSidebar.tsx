'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/gtag';

export type FilterState = {
  categories: string[];
  pricing: string[];
  priceMax?: string;
  types?: string[];
  sort: string;
  since?: string;
};

const CATEGORY_OPTIONS = [
  { label: 'Support', value: 'Support' },
  { label: 'Coding', value: 'Coding' },
  { label: 'Sales', value: 'Sales' },
  { label: 'Data', value: 'Data' },
  { label: 'Marketing', value: 'Marketing' },
];

const PRICING_OPTIONS = [
  { label: 'Free', value: 'Free' },
  { label: 'Freemium', value: 'Freemium' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Custom', value: 'Custom' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export function FilterSidebar({
  activeFilters,
  searchQuery = '',
  mobileOpen = false,
  onCloseMobile = () => {},
}: {
  activeFilters: FilterState;
  searchQuery?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for filter selections before clicking Apply
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    activeFilters?.categories || []
  );
  const [selectedPricing, setSelectedPricing] = useState<string[]>(
    activeFilters?.pricing || []
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    activeFilters?.sort || ''
  );

  // Sync state if activeFilters prop updates from URL
  useEffect(() => {
    setSelectedCategories(activeFilters?.categories || []);
    setSelectedPricing(activeFilters?.pricing || []);
    setSelectedSort(activeFilters?.sort || '');
  }, [activeFilters]);

  const toggleCategory = (val: string) => {
    trackEvent('filter_applied', { filter_type: 'category', filter_value: val });
    setSelectedCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  const togglePricing = (val: string) => {
    trackEvent('filter_applied', { filter_type: 'price', filter_value: val });
    setSelectedPricing((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set('q', searchQuery);
    }

    if (selectedCategories.length > 0) {
      params.set('cat', selectedCategories.join(','));
    } else {
      params.delete('cat');
    }

    if (selectedPricing.length > 0) {
      params.set('pricing', selectedPricing.join(','));
    } else {
      params.delete('pricing');
    }

    if (selectedSort) {
      params.set('sort', selectedSort);
    } else {
      params.delete('sort');
    }

    // Reset pagination to page 1 on filter apply
    params.set('page', '1');

    router.push(`/explore?${params.toString()}`);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedPricing([]);
    setSelectedSort('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('cat');
    params.delete('pricing');
    params.delete('sort');
    params.set('page', '1');

    router.push(`/explore?${params.toString()}`);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const hasSelections =
    selectedCategories.length > 0 ||
    selectedPricing.length > 0 ||
    Boolean(selectedSort);

  const filterContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6 overflow-y-auto pr-1 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
          <h3 className="ff-poppins font-bold text-lg text-[#0f172a] m-0">Filters</h3>
          {hasSelections && (
            <button
              type="button"
              onClick={handleClearAll}
              className="ff-inter text-xs font-semibold text-[#2563eb] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Categories Section */}
        <div>
          <label className="ff-inter text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-3">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const isActive = selectedCategories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`ff-inter py-2.5 px-3 rounded-[12px] text-xs font-medium transition-all cursor-pointer text-center ${
                    isActive
                      ? 'bg-[#2563eb] text-white font-semibold border-none shadow-sm'
                      : 'bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] hover:bg-[#f3f4f6]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pricing Model Section */}
        <div className="pt-2 border-t border-[#f1f5f9]">
          <label className="ff-inter text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-3">
            Pricing Model
          </label>
          <div className="space-y-2">
            {PRICING_OPTIONS.map((p) => {
              const isChecked = selectedPricing.includes(p.value);
              return (
                <label
                  key={p.value}
                  onClick={() => togglePricing(p.value)}
                  className={`flex items-center gap-3 p-2.5 rounded-[12px] cursor-pointer transition-colors ${
                    isChecked ? 'bg-[#2563eb]/10 text-[#2563eb]' : 'hover:bg-[#f8fafc] text-[#374151]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-[#2563eb] border-[#2563eb] text-white'
                        : 'border-[#d1d5db] bg-white'
                    }`}
                  >
                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="ff-inter text-xs font-medium">{p.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sort By Section */}
        <div className="pt-2 border-t border-[#f1f5f9]">
          <label className="ff-inter text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-3">
            Sort By
          </label>
          <div className="space-y-2">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.value;
              return (
                <label
                  key={opt.value}
                  onClick={() => setSelectedSort(isSelected ? '' : opt.value)}
                  className={`flex items-center gap-3 p-2.5 rounded-[12px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#2563eb]/10 text-[#2563eb]' : 'hover:bg-[#f8fafc] text-[#374151]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#2563eb] bg-white'
                        : 'border-[#d1d5db] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#2563eb]" />}
                  </div>
                  <span className="ff-inter text-xs font-medium">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Apply Filters button at bottom */}
      <div className="sticky bottom-0 pt-3 pb-1 bg-white border-t border-[#f1f5f9] mt-auto">
        <button
          type="button"
          onClick={handleApply}
          className="w-full bg-[#2563eb] text-white rounded-[12px] p-[12px] font-semibold text-sm hover:bg-[#1d4ed8] transition-colors cursor-pointer border-none shadow-sm flex items-center justify-center"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (visible on lg screens >= 1024px) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-[80px] w-[260px] h-[calc(100vh-80px)] bg-white border-r border-[#e5e7eb] rounded-r-[16px] shadow-[2px_0_12px_rgba(0,0,0,0.06)] p-[24px_16px] z-40 overflow-y-auto">
        {filterContent}
      </aside>

      {/* Mobile Slide-in Drawer (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col z-10 rounded-r-[16px]">
            <button
              type="button"
              onClick={onCloseMobile}
              className="absolute top-4 right-4 text-[#64748b] hover:text-[#0f172a] p-1 rounded-full bg-[#f1f5f9] border-none cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <div className="mt-6 h-full overflow-hidden">{filterContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
