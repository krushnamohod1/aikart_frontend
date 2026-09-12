import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import type { DeepWebResult } from "@/lib/ai-search";
import { CyclingText } from "@/components/ui/CyclingText";
import { ExploreTopBar } from "@/components/explore/ExploreTopBar";
import { ExploreSidebar, FilterState } from "@/components/explore/ExploreSidebar";
import { MobileFilterButton } from "@/components/explore/MobileFilterModal";
import { AgentCard, CARD_GRADIENTS } from "@/components/explore/AgentCard";
import { serverFetch } from "@/lib/server-fetch";

// ISR: cache the default (unparameterized) Explore page for up to 60 seconds.
// Parameterized paths (?q=, ?ai=1, ?cat=, etc.) are each their own cache entry
// and since AI/search URLs are unique per query they are effectively never
// re-used from cache — they always render fresh server-side. force-dynamic is
// NOT needed here; ISR gives us caching for the common case without blocking
// every navigation on a full server render.
export const revalidate = 60;

type SearchParams = {
  q?: string
  ai?: string
  cat?: string
  pricing?: string
  price_max?: string
  types?: string
  sort?: string
  since?: string
  page?: string
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const filterCategories = params.cat ? params.cat.split(',').filter(Boolean) : []
  const filterPricing = params.pricing ? params.pricing.split(',').filter(Boolean) : []
  const filterTypes = params.types ? params.types.split(',').filter(Boolean) : []
  const activeFilters: FilterState = {
    categories: filterCategories,
    pricing: filterPricing,
    priceMax: params.price_max ?? '',
    types: filterTypes,
    sort: params.sort ?? '',
    since: params.since ?? '',
  }

  // Replaces the direct pool.query()/runAISearch() calls this page used to
  // make itself — now bundled by the backend's GET /api/pages/explore, with
  // the same query params forwarded as-is.
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const res = await serverFetch(`/api/pages/explore${qs ? `?${qs}` : ""}`);
  const {
    approved,
    totalCount,
    searchQuery,
    isAISearch,
    aiMessage,
    deepWebResults,
    noResults,
    currentPage,
    totalPages,
  } = await res.json();

  return (
    <PageShell
      approved={approved}
      totalCount={totalCount}
      searchQuery={searchQuery}
      isAISearch={isAISearch}
      aiMessage={aiMessage}
      deepWebResults={deepWebResults}
      noResults={noResults}
      activeFilters={activeFilters}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  )
}

// ─── Shared page shell ────────────────────────────────────────────────────────

type DBListing = {
  id: string | number
  title: string
  tagline: string
  category: string
  listing_type: string
  pricing_model: string
  price: string | null
  logo_url: string | null
  cover_url: string | null
}

function PageShell({
  approved,
  totalCount,
  searchQuery,
  isAISearch,
  aiMessage,
  deepWebResults = [],
  noResults,
  activeFilters,
  currentPage = 1,
  totalPages = 1,
}: {
  approved: DBListing[]
  totalCount: number
  searchQuery: string
  isAISearch: boolean
  aiMessage: string | null
  deepWebResults?: DeepWebResult[]
  noResults: boolean
  activeFilters: FilterState
  currentPage?: number
  totalPages?: number
}) {
  const showPagination = totalPages > 1

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EX_CSS }} />
      <div className="flex flex-col flex-1 bg-[#f4f4f4] min-h-screen">

        {/* Top spacing accounting for fixed global navbar */}
        <div className="h-[84px] md:h-[104px] w-full shrink-0" aria-hidden="true" />

        {/* Explore Main Container: Two-Column Layout */}
        <div className="flex flex-row flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 md:px-14 gap-8 items-start pb-16">

          {/* Left Sidebar (240px) - Sticky */}
          <aside className="w-[240px] min-w-[240px] max-w-[240px] shrink-0 hidden md:flex flex-col sticky top-[104px] h-[calc(100vh-120px)] max-h-[calc(100vh-120px)]">
            <ExploreSidebar activeFilters={activeFilters} />
          </aside>

          {/* Right Main Content */}
          <main className="ex-main flex-1 min-w-0 pt-1">

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

            {/* Search bar inside main content area docked cleanly above cards */}
            <ExploreTopBar />

            {/* Mobile Filter Button */}
            <div className="block md:hidden mb-4">
              <MobileFilterButton activeFilters={activeFilters} />
            </div>

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
            {noResults ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approved.slice(0, 12).map((listing, index) => (
                  <AgentCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    desc={listing.tagline}
                    category={listing.category}
                    logoUrl={listing.logo_url}
                    bannerUrl={listing.cover_url}
                    index={index}
                    grad={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
                    price={
                      listing.pricing_model === "Paid" && listing.price ? (
                        <>${listing.price}<span className="ex-price-mo">/mo</span></>
                      ) : (
                        listing.pricing_model || "Free"
                      )
                    }
                    rating={4.8}
                    href={`/agent/${listing.id}`}
                    source={searchQuery ? "search_results" : "explore_grid"}
                  />
                ))}
              </div>
            )}

            {showPagination && (
              <div className="ex-pagination">
                {currentPage > 1 && (
                  <Link href={`?page=${currentPage - 1}`} scroll={true} className="ex-page-btn" aria-label="Previous Page">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </Link>
                )}
                {(() => {
                  const pages: (number | string)[] = []
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (currentPage > 3) pages.push("...")
                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
                    if (currentPage < totalPages - 2) pages.push("...")
                    pages.push(totalPages)
                  }
                  return pages.map((p, i) => {
                    if (p === "...") {
                      return (
                        <span key={`dot-${i}`} className="ex-page-btn" style={{ border: 'none', background: 'transparent', cursor: 'default' }}>
                          ...
                        </span>
                      );
                    }
                    const isActive = p === currentPage;
                    return (
                      <Link
                        key={p}
                        href={`?page=${p}`}
                        scroll={true}
                        className={`ex-page-btn ${isActive ? "ex-page-btn--active" : ""}`}
                        style={isActive ? { color: "#ffffff", backgroundColor: "#2563eb", borderColor: "#2563eb", fontWeight: 700 } : undefined}
                      >
                        <span style={{ color: isActive ? "#ffffff" : "inherit" }}>{p}</span>
                      </Link>
                    );
                  })
                })()}
                {currentPage < totalPages && (
                  <Link href={`?page=${currentPage + 1}`} scroll={true} className="ex-page-btn" aria-label="Next Page">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </Link>
                )}
              </div>
            )}

            <div className="mt-16">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

const EX_CSS = `
.ff-redhat{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; }
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ff-inter{ font-family:var(--font-inter),'Inter',sans-serif; }

.ex-main{ flex:1; background:transparent; min-width:0; }

.ex-heading-row{ display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
.ex-h1{ font-weight:500; font-size:clamp(26px,3vw,34px); color:#0f172a; margin:0 0 8px; }
.ex-sub{ font-size:14px; color:#64748b; max-width:520px; margin:0; }
.ex-clear-search{ font-size:12px; font-weight:500; color:#dc2626; border:1px solid #fca5a5; background:rgba(239,68,68,0.06); border-radius:999px; padding:6px 14px; text-decoration:none; transition:all .2s ease; display:inline-flex; align-items:center; }
.ex-clear-search:hover{ color:#fff; background:#dc2626; border-color:#dc2626; box-shadow:0 2px 8px rgba(220,38,38,0.22); }

@media(max-width:768px){
  .sidebar,
  [class*="sidebar"],
  .filter-sidebar {
    display: none !important;
  }
  .ex-heading-row{ flex-direction:column; align-items:flex-start; gap:10px; margin-bottom:16px; }
  .ex-h1{ font-size: clamp(24px, 6.5vw, 30px); line-height: 1.18; }
  .ex-sub{ font-size:14px; max-width:100%; }
  .ex-grid{ grid-template-columns:repeat(2,1fr) !important; gap:12px !important; }
  .ex-card{ border-radius:18px; padding:10px; }
  .ex-card-banner{ height:112px; border-radius:12px; }
  .ex-card-logo{ width:32px; height:32px; border-radius:8px; bottom:-10px; left:8px; }
  .ex-card-title{ font-size:13px; min-height:unset; }
  .ex-card-desc{ font-size:11px; min-height:unset; margin-bottom:8px; }
  .ex-card-foot{ padding-top:8px; }
  .ex-card-price{ font-size:12px; }
  .ex-card-btn{ font-size:11px; padding:4px 10px; }
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

.ex-grid{ display:grid; grid-template-columns:repeat(1,1fr); gap:16px; }
@media(min-width:640px){ .ex-grid{ grid-template-columns:repeat(2,1fr); gap:20px; } }
@media(min-width:1024px){ .ex-grid{ grid-template-columns:repeat(4,1fr); gap:16px; } }
.ex-card{ position:relative; background:#fff; border-radius:24px; border:1px solid #e2e8f0; padding:16px; overflow:hidden; transition:transform .25s, box-shadow .25s, border-color .25s; display:flex; flex-direction:column; box-shadow:0 2px 12px rgba(15,23,42,0.03); }
.ex-card:hover{ transform:translateY(-4px); box-shadow:0 16px 36px rgba(15,23,42,0.09); border-color:#bfdbfe; }

.ex-banner-wrap{ position:relative; width:100%; margin-bottom:18px; }

.ex-card-banner{ position:relative; height:104px; width:100%; border-radius:16px; overflow:hidden; }

.ex-card-logo{ position:absolute; left:16px; bottom:-16px; width:52px; height:52px; border-radius:14px; background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.8); box-shadow:0 6px 16px rgba(15,23,42,0.12); display:flex; align-items:center; justify-content:center; overflow:hidden; z-index:2; }
.ex-card-logo img{ width:100%; height:100%; object-fit:cover; }
.ex-card-logo .material-symbols-outlined{ color:#2563eb; font-size:24px; }

.ex-card-body{ padding:8px 4px 4px; flex:1; display:flex; flex-direction:column; }
.ex-card-title{ font-weight:600; font-size:17px; line-height:1.35; color:#0f172a; margin:0 0 6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.7em; }
.ex-card-desc{ font-size:13px; color:#64748b; line-height:1.5; margin:0 0 16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:3em; }

.ex-card-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:14px; margin-top:auto; border-top:1px solid #f1f5f9; }
.ex-card-price{ font-weight:600; font-size:15px; color:#0f172a; }
.ex-price-mo{ font-size:11px; font-weight:400; color:#94a3b8; }
.ex-card-btn{ padding:8px 16px; border-radius:999px; border:1px solid #2563eb; background:#fff; color:#2563eb; font-size:12.5px; font-weight:600; cursor:pointer; transition:background .2s, color .2s; }
.ex-card-btn:hover{ background:#2563eb; color:#fff; }

.ex-pagination{ margin-top:44px; display:flex; justify-content:center; align-items:center; gap:8px; }
.ex-page-btn{ width:38px; height:38px; border-radius:10px; border:1px solid #e2e5ea; background:#fff; color:#64748b; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; cursor:pointer; text-decoration:none; transition:all .2s; }
.ex-page-btn:hover{ border-color:#93c5fd; color:#2563eb; }
.ex-page-btn--active, a.ex-page-btn--active, .ex-page-btn.ex-page-btn--active{ background:#2563eb !important; border-color:#2563eb !important; color:#ffffff !important; font-weight:700 !important; }
.ex-page-btn--active span, a.ex-page-btn--active span{ color:#ffffff !important; }
`;
