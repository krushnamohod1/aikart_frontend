import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { ScheduleMeetingButton } from "@/components/modals/ScheduleMeetingButton";
import { AddCustomSolutionButton } from "@/components/custom-agents/AddCustomSolutionButton";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";

export const dynamic = "force-dynamic";

// The "Custom Agents" board lists member-posted requirements.
// Requirements live in `listings` with listing_type = 'Custom Requirement'.

type SearchParams = {
  q?: string;
  cat?: string;
  pricing?: string;
  price_max?: string;
  types?: string;
  sort?: string;
  since?: string;
};

export default async function CustomAgentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Replaces the direct getSessionUser()+pool.query() calls this page used
  // to make itself — now bundled by the backend's GET /api/pages/custom-agents.
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const res = await serverFetch(`/api/pages/custom-agents${qs ? `?${qs}` : ""}`);
  if (res.status === 401) redirect("/auth?redirect=/custom-agents");
  const { requirements, totalCount, searchQuery } = await res.json();

  const SHOW_REQUIREMENT_CARDS = true;

  return (
    <>
      <div className="w-full flex-1 pt-20 bg-background min-h-[calc(100vh-200px)]">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background min-w-0">
          {/* Page heading */}
          <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-[30px] font-semibold tracking-tight mb-2 text-gray-900">
                Agent Solution Request
              </h1>
              <p className="text-[14px] text-gray-500 max-w-lg">
                {searchQuery
                  ? `Showing ${totalCount} result${totalCount !== 1 ? "s" : ""} for "${searchQuery}"`
                  : "Have any custom agent request? our team will review and connect you"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {searchQuery && (
                <Link
                  href="/custom-agents"
                  className="text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-200 bg-red-50/50 rounded-full px-3 py-1.5 transition-all inline-flex items-center"
                >
                  Clear search
                </Link>
              )}
              {totalCount > 0 && (
                <>
                  <ScheduleMeetingButton className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-sm shadow-lg shadow-primary/20 cursor-pointer" />
                  <AddCustomSolutionButton />
                </>
              )}
            </div>
          </div>

          {!SHOW_REQUIREMENT_CARDS ? null : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">dashboard_customize</span>
              </div>
              <p className="text-on-surface-variant text-sm max-w-xs mb-1">You haven't posted any custom agent requests yet.</p>
              <p className="text-gray-400 text-xs max-w-sm mb-6">Click below to submit your requirement and our team will connect with you.</p>
              <div className="flex items-center gap-3">
                <AddCustomSolutionButton showText />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {requirements.map((r: any) => (
                <Link
                  key={r.id}
                  href={`/custom-agents/${r.id}`}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      {r.category ? (
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
                          {r.category}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {r.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                      {r.description || r.tagline}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Budget</span>
                      <span className="text-sm font-bold text-gray-900">
                        {r.price != null ? `$${Number(r.price).toLocaleString()}` : "Flexible"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                      View Details
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
