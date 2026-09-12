import { Footer } from "@/components/layout/Footer";
import { PostMLModelButton } from "@/components/custom-ml-models/PostMLModelButton";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server-fetch";

export const dynamic = "force-dynamic";

export default async function CustomMLModelsPage() {
  // Replaces the direct getSessionUser()+pool.query() calls this page used
  // to make itself — now bundled by the backend's GET /api/pages/custom-ml-models.
  const res = await serverFetch("/api/pages/custom-ml-models");
  if (res.status === 401) redirect("/auth?redirect=/custom-ml-models");
  const { requests } = (await res.json()) as {
    requests: Array<{
      id: string;
      title: string;
      description: string;
      timeline: string;
      budget: string;
      created_at: string;
    }>;
  };

  const totalCount = requests.length;

  return (
    <>
      <div className="w-full flex-1 pt-20 bg-background min-h-[calc(100vh-200px)]">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-background min-w-0">

          {/* Page heading — identical structure to /custom-agents */}
          <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-[30px] font-semibold tracking-tight mb-2 text-gray-900">
                Custom ML Model
              </h1>
              <p className="text-[14px] text-gray-500 max-w-lg">
                {totalCount > 0
                  ? `You have ${totalCount} active ML model request${totalCount !== 1 ? "s" : ""}`
                  : "Have any custom ML model request? Our team will review and connect with you."}
              </p>
            </div>
          </div>

          {/* Content */}
          {totalCount === 0 ? (
            /* ── Empty State — pixel-matched to /custom-agents ── */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                  memory
                </span>
              </div>
              <p className="text-on-surface-variant text-sm max-w-xs mb-1">
                You haven&apos;t posted any ML model requests yet.
              </p>
              <p className="text-gray-400 text-xs max-w-sm mb-6">
                Click below to submit your requirement and our team will connect with you.
              </p>
              <div className="flex items-center gap-3">
                <PostMLModelButton showText />
              </div>
            </div>
          ) : (
            /* ── Request Cards ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
                        {r.timeline}
                      </span>
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {r.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                      {r.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                        Budget
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {r.budget}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                      Under Review
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
