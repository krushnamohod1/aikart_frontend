import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { getHiddenLinks } from "@/components/layout/navVisibility";
import ImageGallery from "./ImageGallery";
import AgentLogo from "./AgentLogo";
import ContactProviderButton from "./ContactProviderButton";
import RecommendedCarousel from "./RecommendedCarousel";
import TryMeNow from "./TryMeNow";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import DescriptionAccordion from "./DescriptionAccordion";
import { CardBanner } from "@/components/explore/CardBanner";
import { serverFetch } from "@/lib/server-fetch";

export default async function AgentDynamicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Replaces the direct getSessionUser()+pool.query()+scraped-agents/
  // sandbox-manifest checks this page used to do itself — now bundled by
  // the backend's GET /api/pages/agent/[id] (see aikart-backend), with the
  // browser's session cookie forwarded so the backend can still gate on it.
  const res = await serverFetch(`/api/pages/agent/${id}`);
  if (res.status === 401) redirect(`/auth?redirect=/agent/${id}`);
  if (res.status === 404) notFound();
  const bundle = await res.json();

  const {
    listing,
    isOwner,
    convStatus,
    conversationId,
    recommended,
    agentSlug,
    tryRunnable,
    sandboxRunnable,
    n8nRunnable,
    apiRunnable,
    testableLink,
  } = bundle;

  // Like state is fetched separately (see src/app/agent/[id]/LikeButton.tsx's
  // initial fetch) rather than bundled here — it already had its own
  // dedicated endpoint (GET /api/listings/[id]/like) from the Server Action
  // conversion, so there's no reason to duplicate it in the page bundle.
  const likeRes = await serverFetch(`/api/listings/${id}/like`);
  const likeState = likeRes.ok ? await likeRes.json() : { liked: false, count: 0 };

  const allMedia = (listing.listing_media as { url: string; type: string }[]) || [];
  const video = allMedia.find((m) => m.type === "video");
  const promoVideo = allMedia.find((m) => m.type === "promo_video");
  const screenshots = allMedia.filter((m) => m.type === "screenshot");
  const pdf = allMedia.find((m) => m.type === "pdf");
  const cover =
    allMedia.find((m) => m.type === "cover") ||
    (listing.cover_url ? { url: listing.cover_url, type: "cover" } : null);

  const galleryMedia: { url: string; type: string }[] = [];
  if (video) galleryMedia.push(video);
  if (promoVideo) galleryMedia.push(promoVideo);
  galleryMedia.push(...screenshots);

  const technologies: string[] = listing.technologies ?? [];
  const keyCapabilities: string[] = listing.key_capabilities ?? [];
  const targetIndustries: string[] = listing.target_industries ?? [];
  const categories: string[] = listing.category
    ? listing.category.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AD_CSS }} />
      <Navbar hiddenLinks={getHiddenLinks(`/agent/${id}`)} showInbox />

      <main className="ad-main">
        {/* ═══ 1. Banner + Top Identity (Logo, Title, Tagline, Badges) ═══ */}
        <div className="ad-banner">
          <div className="ad-banner-bg">
            <CardBanner logoUrl={listing.logo_url} />
            {cover && (
              <Image
                src={cover.url}
                alt=""
                fill
                unoptimized
                className="ad-banner-cover"
                style={{ objectFit: "cover", borderRadius: "28px" }}
              />
            )}
          </div>
          <div className="ad-logo">
            <AgentLogo logoUrl={listing.logo_url} title={listing.title} />
          </div>
        </div>

        <div className="ad-identity">
          <h1 className="ff-poppins">{listing.title}</h1>
          <span className="ad-by">
            by <span>{listing.provider_name}</span>
            <span className="material-symbols-outlined ad-verified">verified</span>
          </span>
        </div>

        {(listing.tagline || listing.use_case) && (
          <p className="ad-usecase">{listing.tagline || listing.use_case}</p>
        )}

        <div className="ad-tags">
          {categories.length > 0 ? (
            categories.map((cat: string) => (
              <span key={cat} className="ad-pill">{cat}</span>
            ))
          ) : (
            <span className="ad-pill">{listing.category}</span>
          )}
          {listing.listing_type && <span className="ad-pill">{listing.listing_type}</span>}
          {listing.team_size && (
            <span className="ad-pill ad-pill-outline">
              <span className="material-symbols-outlined" style={{ fontSize: "15px", verticalAlign: "middle", marginRight: "4px" }}>
                groups
              </span>
              Team: {listing.team_size}
            </span>
          )}
        </div>

        <div className="ad-layout">
          <div className="ad-col-main">

            {/* ═══ 2. Description (About AI Solution?, What problem does it solve?, How it helps?) ═══ */}
            <section className="ad-card">
              <h2 className="ff-poppins">Description</h2>
              <DescriptionAccordion
                description={listing.description}
                problemSolved={listing.problem_solved}
                howItHelps={listing.how_it_helps}
              />
            </section>

            {/* ═══ 3. Product Category & Target Industry Verticals ═══ */}
            <section className="ad-card">
              <div className="ad-cat-grid">
                <div>
                  <h2 className="ff-poppins">Product category</h2>
                  <p className="ad-subdesc">Primary classification of this AI solution</p>
                  <div className="ad-tags" style={{ marginBottom: 0 }}>
                    {categories.length > 0 ? (
                      categories.map((cat: string) => (
                        <span key={cat} className="ad-pill">{cat}</span>
                      ))
                    ) : (
                      <span className="ad-pill">{listing.category}</span>
                    )}
                  </div>
                </div>

                {targetIndustries.length > 0 && (
                  <div className="ad-cat-col-border">
                    <h2 className="ff-poppins">Target industry verticals</h2>
                    <p className="ad-subdesc">Specialized industry solutions</p>
                    <div className="ad-tags" style={{ marginBottom: 0 }}>
                      {targetIndustries.map((ind: string) => (
                        <span key={ind} className="ad-pill ad-pill-secondary">{ind}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ═══ 5. Videos & Photos Gallery ═══ */}
            {galleryMedia.length > 0 && (
              <section className="ad-card">
                <h2 className="ff-poppins">Image &amp; Video</h2>
                <ImageGallery media={galleryMedia} />
              </section>
            )}

            {/* ═══ 6. Document / Pitch Deck ═══ */}
            {pdf && (
              <section className="ad-card">
                <h2 className="ff-poppins">Document / Pitch Deck</h2>
                <p className="ad-subdesc">Product brochure, pitch deck, or technical documentation</p>
                <a
                  href={pdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ad-doc-badge"
                >
                  <span className="material-symbols-outlined text-red-500 text-2xl">picture_as_pdf</span>
                  <div className="ad-doc-info">
                    <span className="ad-doc-title">View / Download Document</span>
                    <span className="ad-doc-sub">PDF Attachment</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">download</span>
                </a>
              </section>
            )}

            {/* ═══ 7. Skills & Capabilities ═══ */}
            {(technologies.length > 0 || keyCapabilities.length > 0) && (
              <section className="ad-card">
                {keyCapabilities.length > 0 && (
                  <div style={{ marginBottom: technologies.length > 0 ? "24px" : "0" }}>
                    <h2 className="ff-poppins">Key Capabilities</h2>
                    <ul className="ad-cap-list">
                      {keyCapabilities.map((cap) => (
                        <li key={cap}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {technologies.length > 0 && (
                  <div style={{ marginBottom: "0", paddingTop: keyCapabilities.length > 0 ? "20px" : "0", borderTop: keyCapabilities.length > 0 ? "1px solid #f1f5f9" : "none" }}>
                    <h2 className="ff-poppins">Skills and expertise</h2>
                    <div className="ad-tags" style={{ marginBottom: 0 }}>
                      {technologies.map((tech) => (
                        <span key={tech} className="ad-pill">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.api_enabled && listing.api_endpoint_configured && (
                  <div style={{ paddingTop: (technologies.length > 0 || keyCapabilities.length > 0) ? "20px" : "0", borderTop: (technologies.length > 0 || keyCapabilities.length > 0) ? "1px solid #f1f5f9" : "none" }}>
                    <h2 className="ff-poppins">Testable API</h2>
                    <div className="ad-api-box">
                      <span className="material-symbols-outlined text-blue-600">api</span>
                      <span className="ad-api-text">
                        Runs live on aiKart, no setup or API key needed to try it.
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ═══ 8. Meta Data ═══ */}
            {(() => {
              const cleanedUseCase = listing.use_case
                ? listing.use_case.replace(/^Problems It Solves\s*:?\s*/i, "").trim()
                : "";
              const isShortUseCase =
                cleanedUseCase.length > 0 &&
                cleanedUseCase.length <= 60 &&
                !cleanedUseCase.includes("\n") &&
                !cleanedUseCase.includes("Information Overload");

              return (
                <section className="ad-card">
                  <h2 className="ff-poppins">Meta Data</h2>
                  <div className="ad-tags">
                    <span className="ad-pill">{listing.category}</span>
                    {listing.listing_type && <span className="ad-pill">{listing.listing_type}</span>}
                    <span className="ad-pill">{listing.pricing_model}</span>
                  </div>
                  <div className="ad-meta-rows">
                    {isShortUseCase && (
                      <div>
                        <span>Use Case</span>
                        <span>{cleanedUseCase}</span>
                      </div>
                    )}
                    <div><span>Listed</span><span suppressHydrationWarning>{new Date(listing.created_at).toLocaleDateString()}</span></div>
                  </div>
                </section>
              );
            })()}

            {/* ═══ 9. Provider ═══ */}
            <section className="ad-card ad-provider">
              <h2 className="ff-poppins">Provider</h2>
              <div className="ad-provider-row">
                <div className="ad-provider-avatar">{listing.provider_name[0]?.toUpperCase()}</div>
                <div>
                  <h3>
                    {listing.provider_name}
                    <span className="material-symbols-outlined ad-verified">verified</span>
                  </h3>
                  <p><span className="material-symbols-outlined">lock</span>Contact privately via chat</p>
                </div>
              </div>
            </section>
          </div>

          {/* ═══ Sticky Pricing Side Column ═══ */}
          <div className="ad-col-side">
            <div className="ad-sticky">
              <div className="ad-price-card">
                <div className="ad-price-head">
                  <span>{listing.pricing_model === "Paid" ? "Price" : "Pricing Model"}</span>
                  <div className="ff-poppins ad-price-value">
                    {listing.pricing_model === "Paid" && listing.price ? `$${listing.price}` : listing.pricing_model}
                  </div>
                </div>

                {listing.pricing_details && (
                  <div className="ad-pricing-details-box">
                    <span className="ad-pricing-details-title">Pricing Details</span>
                    <p className="ad-pricing-details-text">{listing.pricing_details}</p>
                  </div>
                )}

                <div className="ad-price-actions">
                  {tryRunnable && agentSlug ? (
                    <TryMeNow endpoint={`/api/try/${encodeURIComponent(agentSlug)}`} name={listing.title} listingId={id} />
                  ) : sandboxRunnable ? (
                    <TryMeNow endpoint={`/api/sandbox/${listing.id}`} name={listing.title} listingId={id} />
                  ) : n8nRunnable ? (
                    <TryMeNow endpoint={`/api/n8n/${listing.id}`} name={listing.title} listingId={id} mode="n8n" />
                  ) : apiRunnable ? (
                    <TryMeNow endpoint={`/api/agent-api/${listing.id}`} name={listing.title} listingId={id} />
                  ) : testableLink ? (
                    <a
                      href={testableLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ad-try-btn inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-center text-[15px]"
                    >
                      <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                      <span>Try Me Now</span>
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  ) : (
                    <button disabled title="In-house try feature is coming soon for this agent" className="ad-try-disabled">
                      <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                      <span>Try Running This Agent</span>
                      <span className="ad-soon">Coming Soon</span>
                    </button>
                  )}
                  {isOwner ? (
                    <div className="ad-owner-note">
                      <span className="material-symbols-outlined text-[18px]">storefront</span>
                      <span>This is your listing</span>
                    </div>
                  ) : (
                    <ContactProviderButton
                      listingId={id}
                      listingTitle={listing.title}
                      initialStatus={convStatus}
                      initialConversationId={conversationId}
                      primary={!listing.website_url}
                    />
                  )}
                  {pdf && (
                    <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="ad-pdf-link">
                      <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                      <span>Download Brochure</span>
                    </a>
                  )}
                  <div className="ad-share-like">
                    <ShareButton title={listing.title} />
                    <LikeButton listingId={id} initialLiked={likeState.liked} initialCount={likeState.count} />
                  </div>
                </div>
                <div className="ad-verified-note">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Verified listing on aiKart</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <RecommendedCarousel agents={recommended} />
      </main>
      <Footer />
    </>
  );
}

const AD_CSS = `
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ad-main{ padding:112px 24px 80px; max-width:1240px; margin:0 auto; }
@media(min-width:1024px){ .ad-main{ padding-left:48px; padding-right:48px; } }

.ad-breadcrumb{ display:flex; align-items:center; gap:6px; font-size:13px; color:#94a3b8; margin-bottom:28px; }
.ad-breadcrumb a{ color:#94a3b8; text-decoration:none; transition:color .2s; }
.ad-breadcrumb a:hover{ color:#2563eb; }
.ad-breadcrumb .material-symbols-outlined{ font-size:14px; }
.ad-breadcrumb-current{ color:#334155; }
.ad-breadcrumb-title{ font-weight:600; color:#2563eb; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.ad-banner{ position:relative; height:190px; margin-bottom:56px; }
.ad-banner-bg{ position:absolute; inset:0; width:100%; height:100%; border-radius:28px; overflow:hidden; background:linear-gradient(120deg,#2563eb 0%,#1d4fd0 55%,#0f2f8a 100%); }
.ad-banner-bg .ex-card-banner{ position:absolute; inset:0; width:100%; height:100%; border-radius:28px; }
.ad-banner-cover{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:28px; }
.ad-logo{ position:absolute; left:32px; bottom:-40px; width:112px; height:112px; border-radius:24px; background:#ffffff; border:1px solid #ececec; box-shadow:0 10px 26px rgba(15,23,42,0.14); display:flex; align-items:center; justify-content:center; overflow:hidden; z-index:2; }
.ad-logo img{ width:100%; height:100%; object-fit:cover; }
.ad-logo .material-symbols-outlined{ font-size:44px; color:#2563eb; }
.ad-identity{ display:flex; flex-wrap:wrap; align-items:baseline; gap:14px; margin-bottom:12px; }
.ad-identity h1{ font-weight:600; font-size:clamp(26px,3vw,34px); color:#0f172a; margin:0; }
.ad-by{ font-size:15px; color:#64748b; display:inline-flex; align-items:center; gap:6px; }
.ad-by span{ color:#0f172a; font-weight:600; }
.ad-verified{ font-size:16px; color:#2563eb; }
.ad-tags{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:32px; }
.ad-pill{ font-size:13px; font-weight:500; color:#2563eb; background:#fff; border:1px solid #2563eb; padding:8px 18px; border-radius:999px; }
.ad-layout{ display:grid; grid-template-columns:1fr; gap:32px; }
@media(min-width:1024px){ .ad-layout{ grid-template-columns:1.7fr 1fr; } }
.ad-col-main{ display:flex; flex-direction:column; gap:24px; min-width:0; }
.ad-col-side{ min-width:0; height:100%; position:relative; }
.ad-sticky{ position:sticky; top:100px; z-index:10; }
.ad-usecase{ font-size:15px; color:#475569; line-height:1.6; margin:0 0 16px; }

.ad-card{ background:#fff; border-radius:22px; padding:26px 28px; box-shadow:0 6px 22px rgba(15,23,42,0.05); }
.ad-card h2{ font-weight:600; font-size:19px; color:#0f172a; margin:0 0 16px; }
.ad-subdesc{ font-size:13px; color:#64748b; margin:-10px 0 14px; }
.ad-desc-section{ margin-bottom:18px; }
.ad-desc-section:last-child{ margin-bottom:0; }
.ad-border-top{ padding-top:18px; border-top:1px solid #f1f5f9; }
.ad-subheading{ font-family:var(--font-poppins),'Poppins',sans-serif; font-size:14.5px; font-weight:600; color:#1e293b; margin:0 0 8px; }
.ad-description{ font-size:14.5px; color:#475569; line-height:1.7; white-space:pre-wrap; }

.ad-cat-grid{ display:flex; flex-direction:column; gap:20px; }
@media(min-width:640px){
  .ad-cat-grid{ display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .ad-cat-col-border{ border-left:1px solid #f1f5f9; padding-left:24px; }
}

.ad-team-chip{ display:inline-flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; padding:10px 20px; border-radius:14px; font-size:15px; font-weight:600; color:#0f172a; }

.ad-doc-badge{ display:flex; align-items:center; gap:16px; background:#f8fafc; border:1px solid #e2e8f0; padding:14px 18px; border-radius:16px; text-decoration:none; transition:all .2s; }
.ad-doc-badge:hover{ border-color:#2563eb; background:#eff6ff; }
.ad-doc-info{ flex:1; display:flex; flex-direction:column; }
.ad-doc-title{ font-size:14px; font-weight:600; color:#0f172a; }
.ad-doc-sub{ font-size:12px; color:#64748b; }

.ad-api-box{ display:flex; align-items:center; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:14px; }
.ad-api-text{ font-family:monospace; font-size:13.5px; color:#0f172a; word-break:break-all; }

.ad-cap-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.ad-cap-list li{ display:flex; align-items:flex-start; gap:10px; font-size:14px; color:#334155; font-weight:500; }
.ad-cap-list .material-symbols-outlined{ color:#2563eb; font-size:20px; margin-top:1px; }

.ad-meta-rows{ margin-top:16px; display:flex; flex-direction:column; gap:2px; }
.ad-meta-rows div{ display:flex; justify-content:space-between; gap:16px; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:13.5px; }
.ad-meta-rows div:last-child{ border-bottom:none; }
.ad-meta-rows span:first-child{ color:#94a3b8; }
.ad-meta-rows span:last-child{ color:#0f172a; font-weight:400; text-align:left; }

.ad-provider-row{ display:flex; align-items:center; gap:20px; }
.ad-provider-avatar{ width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#1d4fd0); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; flex-shrink:0; }
.ad-provider-row h3{ font-size:16px; font-weight:700; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px; }
.ad-provider-row p{ font-size:13px; color:#64748b; margin:4px 0 0; display:flex; align-items:center; gap:6px; }
.ad-provider-row p .material-symbols-outlined{ font-size:14px; }

.ad-price-card{ background:#fff; border-radius:26px; padding:32px; box-shadow:0 12px 34px rgba(15,23,42,0.08); }
.ad-price-head span{ font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#94a3b8; }
.ad-price-value{ font-weight:600; font-size:36px; color:#0f172a; margin-top:6px; }
.ad-pricing-details-box{ margin-top:14px; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; }
.ad-pricing-details-title{ display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#64748b; margin-bottom:4px; }
.ad-pricing-details-text{ font-size:13px; color:#334155; line-height:1.5; margin:0; white-space:pre-wrap; }
.ad-price-actions{ display:flex; flex-direction:column; gap:14px; margin-top:24px; }
.ad-try-disabled{ width:100%; padding:13px 20px; border-radius:999px; background:#f1f5f9; border:2px solid #e2e8f0; color:#94a3b8; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:not-allowed; opacity:.85; }
.ad-soon{ font-size:9px; text-transform:uppercase; letter-spacing:.04em; background:rgba(37,99,235,0.12); color:#2563eb; border:1px solid rgba(37,99,235,0.25); padding:2px 8px; border-radius:999px; }
.ad-owner-note{ width:100%; padding:13px 20px; border-radius:999px; background:#f1f5f9; border:2px solid #e2e8f0; color:#64748b; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:8px; }
.ad-pdf-link{ display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:13px 20px; border-radius:999px; border:2px solid #e2e8f0; color:#0f172a; font-weight:700; font-size:15px; text-decoration:none; transition:background .2s; }
.ad-pdf-link:hover{ background:#f8fafc; }
.ad-share-like{ display:flex; align-items:center; gap:12px; }
.ad-verified-note{ margin-top:20px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:12px; color:#94a3b8; }

@media(max-width:768px){
  .ad-main{
    padding: 76px 14px 40px !important;
    max-width: 100vw;
    overflow-x: hidden;
  }
  .ad-banner{
    height: 156px !important;
    margin-bottom: 48px !important;
    border-radius: 20px !important;
  }
  .ad-banner-bg, .ad-banner-cover{
    border-radius: 20px !important;
  }
  .ad-logo{
    width: 84px !important;
    height: 84px !important;
    left: 16px !important;
    bottom: -32px !important;
    border-radius: 20px !important;
    box-shadow: 0 8px 24px rgba(15,23,42,0.12) !important;
    border: 2px solid #ffffff !important;
  }
  .ad-identity{
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
    margin-top: 4px !important;
    margin-bottom: 8px !important;
  }
  .ad-identity h1{
    font-size: 23px !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    color: #0f172a !important;
  }
  .ad-by{
    font-size: 13px !important;
    color: #64748b !important;
  }
  .ad-usecase{
    font-size: 13.5px !important;
    color: #475569 !important;
    line-height: 1.55 !important;
    margin-bottom: 14px !important;
  }
  .ad-tags{
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    margin-bottom: 18px !important;
  }
  .ad-pill{
    font-size: 11.5px !important;
    font-weight: 500 !important;
    padding: 5px 12px !important;
    border-radius: 999px !important;
    background: rgba(37,99,235,0.06) !important;
    color: #2563eb !important;
    border: 1px solid rgba(37,99,235,0.2) !important;
  }
  .ad-layout{
    gap: 12px !important;
  }
  .ad-col-main{
    gap: 12px !important;
  }
  .ad-card{
    border-radius: 18px !important;
    padding: 18px 16px !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 16px rgba(15,23,42,0.03) !important;
    margin-bottom: 0 !important;
  }
  .ad-card h2{
    font-size: 16px !important;
    font-weight: 700 !important;
    margin-bottom: 12px !important;
  }
  .ad-desc-section{
    background: #f8fafc !important;
    border: 1px solid #f1f5f9 !important;
    border-radius: 14px !important;
    padding: 12px 14px !important;
    margin-bottom: 10px !important;
  }
  .ad-desc-section.ad-border-top{
    border-top: 1px solid #f1f5f9 !important;
    padding-top: 12px !important;
  }
  .ad-subheading{
    font-size: 12px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
    color: #64748b !important;
    margin-bottom: 4px !important;
  }
  .ad-description{
    font-size: 13.5px !important;
    line-height: 1.6 !important;
    color: #1e293b !important;
  }
  .ad-price-card{
    border-radius: 18px !important;
    padding: 18px 14px !important;
  }
  .ad-meta-rows div{
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 8px 0 !important;
  }
  .ad-meta-rows div span:first-child{
    font-size: 13px !important;
    color: #64748b !important;
    font-weight: 500 !important;
    flex-shrink: 0 !important;
  }
  .ad-meta-rows div span:last-child{
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #0f172a !important;
    text-align: right !important;
    white-space: normal !important;
    word-break: break-word !important;
  }
  .ad-price-value{
    font-size: 26px !important;
  }
  .ad-share-like{
    width: 100% !important;
    display: flex !important;
    gap: 8px !important;
  }
  .ad-share-like > *{
    flex: 1 !important;
  }
}
`;
