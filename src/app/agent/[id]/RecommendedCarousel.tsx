import Link from "next/link";
import { AgentCard, CAT_GRAD } from "@/components/explore/AgentCard";

export type RecoAgent = {
  id: string;
  title: string;
  tagline: string | null;
  category: string;
  listing_type: string;
  pricing_model: string;
  price: string | null;
  logo_url: string | null;
};

export default function RecommendedCarousel({ agents }: { agents: RecoAgent[] }) {
  if (!agents.length) return null;

  // Duplicate the list so the marquee can loop seamlessly (translate -50%)
  const loop = [...agents, ...agents];

  return (
    <section className="mt-20 pt-12 border-t border-outline-variant/15">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold font-headline text-on-surface">You may also like</h2>
          <p className="text-sm text-on-surface-variant mt-1">More agents from the aiKart marketplace</p>
        </div>
        <Link href="/explore" className="reco-viewall text-sm font-semibold transition-colors whitespace-nowrap" style={{ color: "#2563eb" }}>
          View all →
        </Link>
      </div>

      {/* Auto-scrolling marquee — pauses on hover, fades at the edges */}
      <div className="reco-marquee relative overflow-hidden">
        <div className="reco-track flex gap-5 w-max">
          {loop.map((a, i) => (
            <div key={`${a.id}-${i}`} className="w-[280px] shrink-0">
              <AgentCard
                id={a.id}
                title={a.title}
                desc={a.tagline || a.listing_type || ""}
                logoUrl={a.logo_url}
                index={i}
                price={
                  a.pricing_model === "Paid" && a.price ? (
                    <>${a.price}<span className="ex-price-mo">/mo</span></>
                  ) : (
                    a.pricing_model || "Free"
                  )
                }
                href={`/agent/${a.id}`}
                source="recommended_carousel"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .reco-viewall:hover{ color:#1d4fd0; }
        .reco-marquee {
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
                  mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
        }
        .reco-track {
          animation: reco-marquee 60s linear infinite;
          will-change: transform;
          padding: 12px 2px;
        }
        .reco-marquee:hover .reco-track { animation-play-state: paused; }
        @keyframes reco-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reco-track { animation: none; }
        }

        .ex-card{ position:relative; background:#fff; border-radius:24px; border:1px solid #e2e8f0; padding:16px; overflow:hidden; transition:transform .25s, box-shadow .25s, border-color .25s; display:flex; flex-direction:column; box-shadow:0 2px 12px rgba(15,23,42,0.03); }
        .ex-card:hover{ transform:translateY(-4px); box-shadow:0 16px 36px rgba(15,23,42,0.09); border-color:#bfdbfe; }
        .ex-banner-wrap{ position:relative; width:100%; margin-bottom:18px; }
        .ex-card-banner{ position:relative; height:104px; width:100%; border-radius:16px; overflow:hidden; }
        .ex-card-logo{ position:absolute; left:16px; bottom:-16px; width:52px; height:52px; border-radius:14px; background:#ffffff; border:1px solid #e2e8f0; box-shadow:0 6px 16px rgba(15,23,42,0.12); display:flex; align-items:center; justify-content:center; overflow:hidden; z-index:2; padding:4px; }
        .ex-card-logo img{ width:100%; height:100%; object-fit:contain; border-radius:8px; }
        .ex-card-logo .material-symbols-outlined{ color:#2563eb; font-size:24px; }
        .ex-card-body{ padding:8px 4px 4px; flex:1; display:flex; flex-direction:column; }
        .ex-card-title{ font-weight:600; font-size:17px; line-height:1.35; color:#0f172a; margin:0 0 6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:2.7em; }
        .ex-card-desc{ font-size:13px; color:#64748b; line-height:1.5; margin:0 0 16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:3em; }
        .ex-card-foot{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:14px; margin-top:auto; border-top:1px solid #f1f5f9; }
        .ex-card-price{ font-weight:600; font-size:15px; color:#0f172a; }
        .ex-price-mo{ font-size:11px; font-weight:400; color:#94a3b8; }
        .ex-card-btn{ padding:8px 16px; border-radius:999px; border:1px solid #2563eb; background:#fff; color:#2563eb; font-size:12.5px; font-weight:600; cursor:pointer; transition:background .2s, color .2s; }
        .ex-card-btn:hover{ background:#2563eb; color:#fff; }
      `}</style>
    </section>
  );
}
