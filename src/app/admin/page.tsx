"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminListings } from "@/lib/api-client/admin";
import { API_BASE } from "@/lib/api-client/config";

type Listing = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  listing_type: string;
  pricing_model: string;
  status: string;
  provider_name: string;
  provider_email: string;
  created_at: string;
};

const statusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "deleted":
      return "bg-slate-100 text-slate-600 border-slate-300";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const statusLabel = (status: string) => (status === "deleted" ? "Deleted by User" : status);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<Listing[]>([]);
  const [approved, setApproved] = useState<Listing[]>([]);
  const [rejected, setRejected] = useState<Listing[]>([]);
  const [deleted, setDeleted] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "pending" | "all" | "rejected">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userRes = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        if (userRes.status === 401) {
          window.location.href = "/auth?redirect=/admin";
          return;
        }
        const user = await userRes.json();
        if (!user) {
          window.location.href = "/auth?redirect=/admin";
          return;
        }

        const listings: Listing[] = await getAdminListings();

        setPending(listings?.filter((l) => l.status === "pending") || []);
        setApproved(listings?.filter((l) => l.status === "approved") || []);
        setRejected(listings?.filter((l) => l.status === "rejected") || []);
        setDeleted(listings?.filter((l) => l.status === "deleted") || []);
        setLoading(false);
      } catch (err: any) {
        console.error("Admin load error:", err);
        setError(err.message || "Failed to load admin portal");
      }
    }

    load();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Admin Portal</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-[#2563EB] text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium text-sm">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  const allListings = [...pending, ...approved, ...rejected, ...deleted];
  const displayedAll =
    activeTab === "pending"
      ? pending
      : activeTab === "rejected"
      ? rejected
      : allListings;

  const filteredListings = displayedAll.filter((listing) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = listing.title?.toLowerCase().includes(q);
    const emailMatch = listing.provider_email?.toLowerCase().includes(q);
    const nameMatch = listing.provider_name?.toLowerCase().includes(q);
    const categoryMatch = listing.category?.toLowerCase().includes(q);
    return titleMatch || emailMatch || nameMatch || categoryMatch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-slate-800">
      {/* ── Left Sidebar (220px fixed on desktop) ── */}
      <aside className="w-full md:w-[220px] md:min-h-screen bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
        {/* Logo at top + mobile hamburger */}
        <div className="p-4 md:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <Link href="/" className="inline-block" aria-label="aiKart home">
            <img
              src="/logo/aikart-logo-full.png"
              alt="aiKart"
              className="h-6 w-auto"
              style={{ height: 24, width: "auto" }}
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            aria-label="Toggle admin navigation"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className={`flex-1 p-4 space-y-6 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
          {/* Section: MAIN */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Main
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
                style={{ borderRadius: "12px" }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Dashboard
              </button>
            </nav>
          </div>

          {/* Section: LISTINGS */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Listings
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("pending");
                  setMobileMenuOpen(false);
                }}
                style={{ borderRadius: "12px" }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "pending"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                  Pending Review
                </span>
                {pending.length > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === "pending"
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {pending.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setMobileMenuOpen(false);
                }}
                style={{ borderRadius: "12px" }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  All Listings
                </span>
                <span
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                    activeTab === "all"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {allListings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("rejected");
                  setMobileMenuOpen(false);
                }}
                style={{ borderRadius: "12px" }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "rejected"
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                  Rejected
                </span>
                {rejected.length > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === "rejected"
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {rejected.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Section: ACCOUNT */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Account
            </p>
            <nav className="space-y-1">
              <Link
                href="/profile"
                style={{ borderRadius: "12px" }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                Profile
              </Link>
              <Link
                href="/explore"
                style={{ borderRadius: "12px" }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                Marketplace
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 max-w-7xl">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E5E7EB]">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage all submitted listings.</p>
          </div>

          {/* Top Right: Back Button + Admin Avatar */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <Link
              href="/"
              className="ak-btn-back"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </Link>

            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-full border border-[#E5E7EB] shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-sm flex items-center justify-center shadow-inner">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-normal text-gray-900 leading-tight">Admin</p>
                <p className="text-[10px] text-gray-500">Super Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* STAT CARDS ROW (2x2 on mobile, 4 on desktop) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
          {/* Card 1: PENDING */}
          <div
            onClick={() => setActiveTab("pending")}
            style={{ borderRadius: "12px" }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
          >
            <div style={{ borderRadius: "12px" }} className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber-500 text-2xl">hourglass_empty</span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-normal text-amber-500 leading-none mb-1">
                {pending.length}
              </p>
              <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                Pending
              </p>
            </div>
          </div>

          {/* Card 2: APPROVED */}
          <div
            onClick={() => setActiveTab("all")}
            style={{ borderRadius: "12px" }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
          >
            <div style={{ borderRadius: "12px" }} className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-normal text-emerald-600 leading-none mb-1">
                {approved.length}
              </p>
              <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                Approved
              </p>
            </div>
          </div>

          {/* Card 3: REJECTED */}
          <div
            onClick={() => setActiveTab("rejected")}
            style={{ borderRadius: "12px" }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
          >
            <div style={{ borderRadius: "12px" }} className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-rose-500 text-2xl">cancel</span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-normal text-rose-500 leading-none mb-1">
                {rejected.length}
              </p>
              <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                Rejected
              </p>
            </div>
          </div>

          {/* Card 4: TOTAL LISTINGS */}
          <div
            onClick={() => setActiveTab("all")}
            style={{ borderRadius: "12px" }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center gap-4 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
          >
            <div style={{ borderRadius: "12px" }} className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#2563EB] text-2xl">inventory_2</span>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-normal text-[#2563EB] leading-none mb-1">
                {allListings.length}
              </p>
              <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                Total Listings
              </p>
            </div>
          </div>
        </section>

        {/* AWAITING REVIEW SECTION */}
        {(activeTab === "dashboard" || activeTab === "pending") && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Awaiting Review
                <span className="text-xs font-medium text-gray-500 ml-1">({pending.length})</span>
              </h2>
            </div>

            {pending.length > 0 ? (
              <div className="space-y-4">
                {pending.map((listing) => (
                  <div
                    key={listing.id}
                    style={{ borderRadius: "12px" }}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-bold text-base text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide ${statusBadge(
                            listing.status
                          )}`}
                        >
                          PENDING
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-2.5 truncate">
                        <span className="font-medium text-gray-700">{listing.provider_name || "Unknown Provider"}</span>
                        {listing.provider_email ? ` · ${listing.provider_email}` : ""}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {listing.category && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                            {listing.category}
                          </span>
                        )}
                        {listing.listing_type && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                            {listing.listing_type}
                          </span>
                        )}
                        {listing.pricing_model && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                            {listing.pricing_model}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <span className="text-xs text-gray-400">
                        {listing.created_at
                          ? new Date(listing.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2563EB] text-white font-medium text-sm rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Review
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center shadow-sm">
                <span className="material-symbols-outlined text-emerald-500 text-4xl mb-2 block">
                  task_alt
                </span>
                <h3 className="font-bold text-gray-900 text-sm">All caught up!</h3>
                <p className="text-xs text-gray-500 mt-0.5">No listings are pending review right now.</p>
              </div>
            )}
          </section>
        )}

        {/* ALL LISTINGS SECTION */}
        {(activeTab === "dashboard" || activeTab === "all" || activeTab === "rejected") && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {activeTab === "rejected" ? "Rejected Listings" : "All Listings"}
                <span className="text-xs font-medium text-gray-500 ml-1.5">
                  ({filteredListings.length})
                </span>
              </h2>

              {/* Search box */}
              <div className="relative w-full sm:w-[280px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full bg-white border border-[#E5E7EB] rounded-full pl-9 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
                />
              </div>
            </div>

            {filteredListings.length > 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                {filteredListings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className={`flex items-center justify-between p-3.5 sm:px-5 sm:py-3.5 hover:bg-gray-50 transition-colors ${
                      index % 2 === 1 ? "bg-[#FAFAFA]" : "bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusBadge(
                            listing.status
                          )}`}
                        >
                          {statusLabel(listing.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {listing.provider_name || "Seller"}
                        {listing.provider_email ? ` · ${listing.provider_email}` : ""}
                        {listing.category ? ` · ${listing.category}` : ""}
                      </p>
                    </div>

                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="inline-flex items-center justify-center px-5 py-1.5 border border-[#2563EB] text-[#2563EB] rounded-full text-xs font-semibold hover:bg-[#2563EB] hover:text-white transition-all duration-200 ease-in-out shrink-0"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center shadow-sm">
                <p className="text-xs text-gray-500">No listings found matching your search.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
