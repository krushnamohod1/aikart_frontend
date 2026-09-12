import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ConvStatus } from "@/lib/chat";
import { serverFetch } from "@/lib/server-fetch";
import SubmitProposalButton from "./SubmitProposalButton";

export const dynamic = "force-dynamic";

export default async function CustomAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Replaces the direct getSessionUser()+pool.query() calls this page used
  // to make itself — now bundled by the backend's GET /api/pages/custom-agents/[id].
  const res = await serverFetch(`/api/pages/custom-agents/${id}`);
  if (res.status === 401) redirect(`/auth?redirect=/custom-agents/${id}`);
  if (res.status === 404) notFound();
  const { request: req, isOwner, convStatus, conversationId } = (await res.json()) as {
    request: any;
    isOwner: boolean;
    convStatus: ConvStatus | "none";
    conversationId: string | null;
  };

  const hasBudget = req.price != null;

  return (
    <div className="flex flex-1 pt-20 sm:pt-24 pb-16 bg-slate-50/50 min-h-screen">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-lg lg:max-w-5xl mx-auto min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          <Link href="/custom-agents" className="hover:text-blue-600 transition-colors">
            Custom Agents
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-gray-900 font-medium truncate">Request</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-8 items-start">
          {/* Left Column: Header & Requirement */}
          <div className="w-full lg:w-[65%] space-y-3 sm:space-y-4">
            {/* Header Card */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-blue-50/70 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">dashboard_customize</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 mb-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Seeking a builder
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  {req.title}
                </h1>
              </div>
            </div>

            {/* Requirement Card */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
                The Requirement
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {req.description}
              </p>
            </section>
          </div>

          {/* Right Column: Action Panel & How It Works */}
          <div className="w-full lg:w-[35%] space-y-3 sm:space-y-4 lg:sticky lg:top-28">
            {/* Budget & CTA Card */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
                  Budget
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  {hasBudget ? (
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      ${req.price}
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">Open</span>
                  )}
                </div>
                {!hasBudget && (
                  <p className="text-xs text-gray-500 mt-1">Flexible propose your price.</p>
                )}
              </div>

              {isOwner ? (
                <div className="w-full py-3 px-4 rounded-full bg-gray-100 border border-gray-200 text-gray-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>This is your request</span>
                </div>
              ) : (
                <SubmitProposalButton
                  listingId={req.id}
                  requirementTitle={req.title}
                  initialStatus={convStatus}
                  initialConversationId={conversationId}
                />
              )}

              <div className="mt-3.5 flex items-center gap-1.5 text-xs text-gray-400 justify-center">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Poster is anonymous</span>
              </div>
            </div>

            {/* How It Works Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
                How it works
              </h3>
              <ol className="space-y-2 text-xs sm:text-sm text-gray-600 list-decimal list-inside leading-relaxed">
                <li>Submit a short proposal describing how you&apos;d build this.</li>
                <li>The poster reviews it in their inbox and can accept.</li>
                <li>Once accepted, you chat directly and both stay anonymous.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
