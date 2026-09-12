"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { CyclingText } from "@/components/ui/CyclingText";
import { ExploreTopBar, FilterState } from "@/components/explore/ExploreTopBar";
import { AgentCard } from "@/components/explore/AgentCard";
import { DeepWebResult } from "@/lib/ai-search";

export type DBListing = {
  id: string | number;
  title: string;
  tagline: string;
  category: string;
  listing_type: string;
  pricing_model: string;
  price: string | null;
  logo_url: string | null;
};

export type HardcodedCard = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  price: string;
  rating?: string | number;
  category?: string;
  logo?: string;
  href: string;
};

const ITEMS_PER_PAGE = 12;

export function ExploreClientShell({
  approved,
  hardcoded,
  totalCount,
  searchQuery,
  isAISearch,
  aiMessage,
  deepWebResults = [],
  noResults,
  activeFilters,
  currentPage = 1,
}: {
  approved: DBListing[];
  hardcoded: HardcodedCard[];
  totalCount: number;
  searchQuery: string;
  isAISearch: boolean;
  aiMessage: string | null;
  deepWebResults?: DeepWebResult[];
  noResults: boolean;
  activeFilters: FilterState;
  currentPage?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Combine approved database listings and hardcoded items into unified list
  const allCards = [
    ...approved.map((listing, index) => ({
      type: "db" as const,
      id: listing.id,
      title: listing.title,
      desc: listing.tagline,
      logoUrl: listing.logo_url,
      category: listing.category,
      index,
      price:
        listing.pricing_model === "Paid" && listing.price ? (
          <>${listing.price}<span className="ex-price-mo">/mo</span></>
        ) : (
          listing.pricing_model || "Free"
        ),
      rating: 4.8,
      href: `/agent/${listing.id}`,
    })),
    ...hardcoded.map((card, index) => ({
      type: "hardcoded" as const,
      id: card.id,
      title: card.title,
      desc: card.desc,
      logoUrl: card.logo,
      category: card.category,
      index: approved.length + index,
      price: card.price,
      rating: card.rating || 4.7,
      href: card.href,
    })),
  ];

  const totalItems = allCards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  // Slice cards for pagination: strictly 12 items per page
  const paginatedCards = allCards.slice(
    (validPage - 1) * ITEMS_PER_PAGE,
    validPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/explore?${params.toString()}`);

    // Scroll to top of main content area
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EX_CSS }} />
      <div className="flex flex-1 pt-[80px] bg-[#f4f4f4] min-h-screen relative">

        {/* Main Content Area */}
        <main className="ex-main w-full min-w-0">
          {/* Page heading & actions */}
          <div className="ex-heading-row">
            <div>
              <h1 className="ff-redhat ex-h1">
                Architecting <CyclingText />
              </h1>
              <p className="ff-inter ex-sub">
                {searchQuery && !isAISearch
                  ? `Showing ${totalCount} result${totalCount !== 1 ? "s" : ""} for "${searchQuery}"`
                  : "Discover high-performance AI agents crafted by the world's leading digital architects."}
              </p>
            </div>
            {searchQuery && (
              <Link href="/explore" className="ff-inter ex-clear-search">Clear search</Link>
            )}
          </div>

          {/* Top search & Filter & Sort bar */}
          <ExploreTopBar activeFilters={activeFilters} />

          {/* AI Response Banner */}
          {aiMessage && (
            <div className="ex-ai-banner">
              <div className="ex-ai-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L14.5 7.5L20 10L14.5 12.5L12 18L9.5 12.5L4 10L9.5 7.5L12 2Z" />
                  <path d="M19 15L19.8 17L22 17.8L19.8 18.6L19 21L18.2 18.6L16 17.8L18.2 17L19 15Z" />
                </svg>
              </div>
              <div className="ex-ai-body">
                <div className="ex-ai-tag-row">
                  <span className="ff-inter ex-ai-tag">aiKart AI</span>
                  <span className="ff-inter ex-ai-beta">BETA</span>
                </div>
                <p className="ff-inter ex-ai-message">{aiMessage}</p>

                {deepWebResults.length > 0 && (
                  <div className="ex-deepweb">
                    <div className="ex-deepweb-head">
                      <span className="material-symbols-outlined">travel_explore</span>
                      <span className="ff-inter">Deep Web Vector Search Results</span>
                    </div>
                    <ul className="ex-deepweb-list">
                      {deepWebResults.map((d, i) => (
                        <li key={i} className="ff-inter">
                          <span className="ex-deepweb-bullet">▸</span>
                          <span><span className="ex-deepweb-name">{d.name}</span><span className="ex-deepweb-fit">: {d.fit}</span></span>
                        </li>
                      ))}
                    </ul>
                    <p className="ff-inter ex-deepweb-note">External tools surfaced from across the web, not hosted on aiKart.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zero results state */}
          {noResults || totalItems === 0 ? (
            <div className="ex-empty">
              <div className="ex-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="ff-inter ex-empty-text">No agents matched your search right now. Try a different query or browse all agents.</p>
              <Link href="/explore" className="ff-inter ex-empty-cta">Browse all agents</Link>
            </div>
          ) : (
            <>
              {/* Agent Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCards.map((card) => (
                  <AgentCard
                    key={card.id}
                    id={card.id}
                    title={card.title}
                    desc={card.desc}
                    logoUrl={card.logoUrl}
                    category={card.category}
                    index={card.index}
                    price={card.price}
                    rating={card.rating}
                    href={card.href}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="ex-pagination">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={validPage <= 1}
                    onClick={() => handlePageChange(validPage - 1)}
                    className="ex-page-btn"
                    aria-label="Previous Page"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === validPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`ex-page-btn ${isActive ? "ex-page-btn--active" : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={validPage >= totalPages}
                    onClick={() => handlePageChange(validPage + 1)}
                    className="ex-page-btn"
                    aria-label="Next Page"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}

const EX_CSS = `
.ff-redhat{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; }
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ff-inter{ font-family:var(--font-inter),'Inter',sans-serif; }

.ex-main{ flex:1; padding:32px; padding-top:24px; background:#f4f4f4; min-width:0; }
@media(max-width:768px){ .ex-main{ padding:16px; padding-top:16px; } }

.ex-heading-row{ display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
.ex-h1{ font-weight:500; font-size:clamp(26px,3vw,34px); color:#0f172a; margin:0 0 8px; }
.ex-sub{ font-size:14px; color:#64748b; max-width:520px; margin:0; }
.ex-clear-search{ font-size:12px; font-weight:500; color:#dc2626; border:1px solid #fca5a5; background:rgba(239,68,68,0.06); border-radius:999px; padding:6px 14px; text-decoration:none; transition:all .2s ease; display:inline-flex; align-items:center; }
.ex-clear-search:hover{ color:#fff; background:#dc2626; border-color:#dc2626; box-shadow:0 2px 8px rgba(220,38,38,0.22); }

@media(max-width:768px){
  .ex-heading-row{ flex-direction:column; align-items:flex-start; gap:10px; margin-bottom:16px; }
  .ex-h1{ font-size:26px; }
  .ex-sub{ font-size:13.5px; }
  .ex-grid{ grid-template-columns:repeat(2,1fr) !important; gap:12px !important; }
}

.ex-ai-banner{ margin-bottom:28px; border-radius:18px; border:1px solid rgba(37,99,235,0.22); background:linear-gradient(90deg, rgba(37,99,235,0.05), rgba(255,174,0,0.04)); padding:20px; display:flex; gap:16px; align-items:flex-start; }
.ex-ai-icon{ flex-shrink:0; margin-top:2px; width:32px; height:32px; border-radius:10px; background:rgba(37,99,235,0.10); display:flex; align-items:center; justify-content:center; }
.ex-ai-body{ flex:1; min-width:0; }
.ex-ai-tag-row{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.ex-ai-tag{ font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#2563eb; }
.ex-ai-beta{ font-size:9px; font-weight:700; color:#2563eb; background:rgba(37,99,235,0.10); border:1px solid rgba(37,99,235,0.2); padding:2px 6px; border-radius:4px; }
.ex-ai-message{ font-size:14px; color:#0f172a; line-height:1.6; margin:0; }
.ex-deepweb{ margin-top:16px; padding-top:16px; border-top:1px solid rgba(37,99,235,0.15); }
.ex-deepweb-head{ display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.ex-deepweb-head .material-symbols-outlined{ color:#2563eb; font-size:16px; }
.ex-deepweb-head span.ff-inter{ font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#2563eb; }
.ex-deepweb-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.ex-deepweb-list li{ display:flex; gap:10px; font-size:13px; line-height:1.6; }
.ex-deepweb-bullet{ color:#2563eb; }
.ex-deepweb-name{ font-weight:700; color:#0f172a; }
.ex-deepweb-fit{ color:#64748b; }
.ex-deepweb-note{ margin-top:10px; font-size:10px; color:#94a3b8; font-style:italic; }

.ex-empty{ display:flex; flex-direction:column; align-items:center; justify-content:center; padding:96px 0; text-align:center; }
.ex-empty-icon{ width:64px; height:64px; border-radius:18px; background:#fff; border:1px solid #e2e5ea; display:flex; align-items:center; justify-content:center; margin-bottom:24px; color:#94a3b8; }
.ex-empty-text{ font-size:14px; color:#64748b; max-width:320px; }
.ex-empty-cta{ margin-top:24px; padding:10px 22px; background:#2563eb; color:#fff; border-radius:10px; font-size:14px; font-weight:600; text-decoration:none; transition:filter .2s; }
.ex-empty-cta:hover{ filter:brightness(1.06); }

.ex-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
@media(min-width:640px){ .ex-grid{ grid-template-columns:repeat(2,1fr); gap:16px; } }
@media(min-width:1024px){ .ex-grid{ grid-template-columns:repeat(3,1fr); gap:24px; } }
@media(min-width:1440px){ .ex-grid{ grid-template-columns:repeat(4,1fr); gap:24px; } }

.ex-card{ position:relative; background:#fff; border-radius:24px; border:1px solid #e2e8f0; padding:16px; overflow:hidden; transition:transform .25s, box-shadow .25s, border-color .25s; display:flex; flex-direction:column; box-shadow:0 2px 12px rgba(15,23,42,0.03); min-height:380px; height:100%; }
.ex-card:hover{ transform:translateY(-4px); box-shadow:0 16px 36px rgba(15,23,42,0.09); border-color:#bfdbfe; }

.ex-banner-wrap{ position:relative; width:100%; margin-bottom:18px; }
.ex-card-banner{ position:relative; height:84px; width:100%; border-radius:16px; overflow:hidden; }

.ex-card-logo{ position:absolute; left:16px; bottom:-16px; width:52px; height:52px; border-radius:14px; background:#ffffff; border:1px solid #e2e8f0; box-shadow:0 6px 16px rgba(15,23,42,0.12); display:flex; align-items:center; justify-content:center; overflow:hidden; z-index:2; padding:4px; }
.ex-card-logo img{ width:100%; height:100%; object-fit:contain; border-radius:8px; }
.ex-card-logo .material-symbols-outlined{ color:#2563eb; font-size:24px; }

.ex-card-body{ padding:8px 4px 4px; flex:1; display:flex; flex-direction:column; }
.ex-card-title{ font-weight:600; font-size:17px; line-height:1.35; color:#0f172a; margin:0 0 6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; height:2.7em; }
.ex-card-desc{ font-size:13px; color:#64748b; line-height:1.5; margin:0 0 16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; height:3em; }

.ex-card-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:14px; margin-top:auto; border-top:1px solid #f1f5f9; }
.ex-card-price{ font-weight:600; font-size:15px; color:#0f172a; }
.ex-price-mo{ font-size:11px; font-weight:400; color:#94a3b8; }
.ex-card-btn{ padding:8px 16px; border-radius:999px; border:1px solid #2563eb; background:#fff; color:#2563eb; font-size:12.5px; font-weight:600; cursor:pointer; transition:background .2s, color .2s; }
.ex-card-btn:hover{ background:#2563eb; color:#fff; }

.ex-pagination{ margin-top:44px; margin-bottom:24px; display:flex; justify-content:center; align-items:center; gap:8px; }
.ex-page-btn{ min-width:38px; height:38px; padding:0 8px; border-radius:8px; border:1px solid #e5e7eb; background:#ffffff; color:#374151; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .2s ease; }
.ex-page-btn:hover:not(:disabled){ border-color:#2563eb; color:#2563eb; }
.ex-page-btn:disabled{ opacity:0.4; cursor:not-allowed; }
.ex-page-btn--active{ background:#2563eb !important; border-color:#2563eb !important; color:#ffffff !important; font-weight:700; shadow:0 2px 6px rgba(37,99,235,0.25); }
`;
