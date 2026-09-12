"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { deleteOwnListing } from "@/lib/api-client/listings";
import { API_BASE } from "@/lib/api-client/config";

const A = "/figma";

type Listing = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  listing_type: string;
  pricing_model: string;
  status: string;
  rejection_reason: string | null;
  logo_url: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Under Review", className: "sp-badge sp-badge--pending" },
  approved: { label: "Accepted", className: "sp-badge sp-badge--approved" },
  rejected: { label: "Rejected", className: "sp-badge sp-badge--rejected" },
};

export default function SellerStatusClient() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; full_name?: string | null } | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail] = useState(process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@aetheris.ai");
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ── Hero Video Background (desktop: you_haven_t_remove_the_bag_so_2.mp4, mobile: seller-dashboard.mp4 0-3s) ── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (loading) return;
    const el = videoRef.current;
    if (!el) return;

    el.currentTime = 0;
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => { });
    }

    if (isMobile) {
      const handleTimeUpdate = () => {
        if (el.currentTime >= 3) {
          el.pause();
          el.currentTime = 3;
        }
      };

      el.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        el.removeEventListener("timeupdate", handleTimeUpdate);
      };
    } else {
      // Desktop: plays smoothly at native 60fps hardware speed, then holds on the final frame
      const handleEnded = () => {
        el.pause();
      };

      el.addEventListener("ended", handleEnded);
      return () => {
        el.removeEventListener("ended", handleEnded);
      };
    }
  }, [loading, isMobile]);

  // Live unread count — same endpoint/polling pattern as the Navbar's Inbox link.
  useEffect(() => {
    let active = true;
    let timerId: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations/unread-count`, { cache: "no-store", credentials: "include" });
        if (res.status === 401 || res.status === 403) {
          if (timerId) clearInterval(timerId);
          return;
        }
        if (!res.ok || !active) return;
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      } catch {
        /* ignore */
      }
    };
    load();
    timerId = setInterval(load, 30000);
    return () => { active = false; if (timerId) clearInterval(timerId); };
  }, []);

  useEffect(() => {
    async function load() {
      const [userRes, listingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
        fetch(`${API_BASE}/api/listings/mine`, { credentials: "include" }),
      ]);

      if (userRes.status === 401) {
        router.push("/auth");
        return;
      }
      if (userRes.ok) setUser(await userRes.json());
      if (listingsRes.ok) setMyListings((await listingsRes.json()) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const goGated = (target: string) => {
    if (user) router.push(target);
    else router.push(`/auth?redirect=${encodeURIComponent(target)}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteOwnListing(deleteTarget.id);
    if (res.error) {
      setDeleteError(res.error);
      setDeleting(false);
      return;
    }
    setMyListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="sp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ─── hero ─── */}
      <section className="sp-hero">
        <video
          key={isMobile ? "mobile-vid" : "desktop-vid"}
          ref={videoRef}
          src={isMobile ? "/seller-dashboard.mp4#t=0,3" : "/you_haven_t_remove_the_bag_so_2.mp4"}
          autoPlay
          muted
          playsInline
          className="sp-hero-video"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        <div className="sp-hero-veil" />
        <div className="sp-hero-in">
          <h1 className="ff-redhat sp-hero-title">List Your <span className="sp-grad">AI Solution</span> Where Businesses Are Ready to Buy</h1>
          <div className="sp-pills ff-inter">
            <span>
              <Image src={`${A}/image462.png`} alt="" width={16} height={16} style={{ objectFit: "contain" }} />
              Reach Qualified Buyers
            </span>
            <span>
              <Image src={`${A}/image462.png`} alt="" width={16} height={16} style={{ objectFit: "contain" }} />
              0% Commission
            </span>
          </div>
          <button type="button" onClick={() => goGated("/seller/new/step1")} className="ff-inter sp-hero-cta">Add AI Solution</button>
        </div>
      </section>

      {/* ─── listings ─── */}
      <section className="sp-section">
        <div className="sp-section-head">
          <div>
            <p className="ff-inter sp-eyebrow sp-grad">LIST OF AI SOLUTION</p>
            <h2 className="ff-redhat sp-h2">My Listing</h2>
          </div>
          <div className="sp-head-actions">
            <Link href="/inbox" className="sp-mail" aria-label="Inbox">
              <Image src={`${A}/seller/mail-icon.png`} alt="" width={24} height={24} />
              {unreadCount > 0 && (
                <span className="sp-mail-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </Link>
            <button type="button" onClick={() => goGated("/seller/new/step1")} className="ff-inter sp-add">Add</button>
          </div>
        </div>

        {/* empty state */}
        {myListings.length === 0 && (
          <div className="sp-empty">
            <span className="material-symbols-outlined">inbox</span>
            <h3 className="ff-poppins">No listings yet</h3>
            <p className="ff-inter">You haven&apos;t submitted any listings. Get started and reach thousands of potential buyers.</p>
            <button type="button" onClick={() => goGated("/seller/new/step1")} className="ff-inter sp-empty-cta">Create First Listing</button>
          </div>
        )}

        {/* listing rows */}
        {myListings.length > 0 && (
          <div className="sp-list">
            {myListings.map((listing) => {
              const cfg = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.pending;
              return (
                <div key={listing.id} className="sp-card">
                  <div className="sp-card-row">
                    <div className="sp-card-main">
                      <div className="sp-card-logo">
                        {listing.logo_url ? (
                          <Image
                            src={listing.logo_url}
                            alt={listing.title}
                            width={56}
                            height={56}
                            unoptimized
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <span className="material-symbols-outlined">smart_toy</span>
                        )}
                      </div>
                      <div className="sp-card-text">
                        <h3 className="ff-poppins">{listing.title}</h3>
                        <p className="ff-inter sp-tagline">{listing.tagline}</p>
                        <div className="sp-meta">
                          <span>{listing.category}</span>
                          <span>{listing.listing_type}</span>
                          <span>{listing.pricing_model}</span>
                        </div>
                      </div>
                    </div>
                    <div className="sp-card-actions">
                      <span className="ff-inter sp-date" suppressHydrationWarning>{new Date(listing.created_at).toLocaleDateString()}</span>
                      <Link
                        href={`/seller/edit/${listing.id}`}
                        className="ff-inter sp-edit"
                        aria-label={listing.status === "rejected" ? `Edit and resubmit ${listing.title}` : `Edit ${listing.title}`}
                        title={listing.status === "rejected" ? "Edit & Resubmit" : "Edit"}
                      >
                        <svg className="sp-act-ico" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="sp-act-label">
                          {listing.status === "rejected" ? "Edit & Resubmit" : "Edit"}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setDeleteTarget(listing); setDeleteError(null); }}
                        className="ff-inter sp-delete"
                        aria-label={`Delete ${listing.title}`}
                      >
                        <svg className="sp-act-ico" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="sp-act-label">Delete</span>
                      </button>
                      {listing.status === "approved" && (
                        <Link
                          href={`/agent/${listing.id}`}
                          className="ff-inter sp-view-live"
                          aria-label={`View ${listing.title} live`}
                          title="View Live"
                        >
                          <svg className="sp-act-ico" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="sp-act-label">View Live</span>
                        </Link>
                      )}
                      <span className={`ff-inter ${cfg.className}`}>{cfg.label}</span>
                    </div>
                  </div>

                  {listing.status === "rejected" && listing.rejection_reason && (
                    <div className="sp-rejection">
                      <p className="ff-inter sp-rejection-h">Rejection Reason</p>
                      <p className="ff-inter sp-rejection-b">{listing.rejection_reason}</p>
                      <p className="ff-inter sp-rejection-f">Questions? Email <a href={`mailto:${adminEmail}`}>{adminEmail}</a></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── delete confirmation ─── */}
      {deleteTarget && (
        <div className="sp-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ff-poppins">Delete this agent?</h3>
            <p className="ff-inter">
              This will permanently remove <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>{" "}and all of its listing data. This can&apos;t be undone.
            </p>
            {deleteError && <p className="ff-inter sp-modal-error">{deleteError}</p>}
            <div className="sp-modal-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="ff-inter sp-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="ff-inter sp-modal-delete"
              >
                {deleting ? "Deleting…" : "Delete Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const CSS = `
.sp{ background:#f4f4f4; min-height:100vh; color:#0f172a; }
.ff-redhat{ font-family:var(--font-red-hat),'Red Hat Display',sans-serif; }
.ff-inter{ font-family:var(--font-inter),'Inter',sans-serif; }
.ff-poppins{ font-family:var(--font-poppins),'Poppins',sans-serif; }
.ff-sansita{ font-family:'Sansita One','Sansita',cursive; }
.sp-grad{ background:linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%); background-size:200% 100%; background-position:0% 50%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; animation:sp-gradientShift 6s linear infinite; }

@keyframes sp-gradientShift{
  0%{ background-position:0% 50%; }
  100%{ background-position:200% 50%; }
}
.sp-hero .sp-grad{
  background:linear-gradient(90deg, #0050FF 0%, #7F7595 25%, #FFAE00 50%, #7F7595 75%, #0050FF 100%);
  background-size:200% 100%;
  background-position:0% 50%;
  -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  text-shadow:none;
  filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4)) drop-shadow(0 0px 12px rgba(0,0,0,0.25));
  animation:sp-gradientShift 6s linear infinite;
}
@media (prefers-reduced-motion: reduce){
  .sp-hero .sp-grad{ animation:none; background-position:0% 50%; }
}

/* hero */
.sp-hero{ position:relative; min-height:660px; display:flex; align-items:flex-end; overflow:hidden; }
.sp-hero-video{
  position:absolute; top:0; left:0; inset:0; width:100%; height:100%; object-fit:cover; object-position:center;
  z-index:1;
  pointer-events:none;
  opacity:1;
  will-change:transform;
  transform:translateZ(0);
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
}
.sp-hero-veil{ position:absolute; inset:0; z-index:2; background:linear-gradient(100deg, rgba(6,15,40,0.72) 0%, rgba(9,22,60,0.42) 46%, rgba(9,22,60,0.12) 78%, rgba(9,22,60,0) 100%); }
.sp-hero-in{ position:relative; z-index:3; width:100%; max-width:1200px; margin:0 auto; padding:190px 24px 44px; }
@media(min-width:1024px){ .sp-hero-in{ padding-left:40px; padding-right:40px; } }
.sp-hero-title{ font-weight:500; font-size:clamp(26px,3.6vw,42px); line-height:1.16; color:#fff; max-width:760px; margin:0; text-shadow:0 2px 16px rgba(0,0,0,0.3); }
.sp-pills{ display:flex; flex-wrap:wrap; gap:12px; margin-top:24px; }
.sp-pills span{ display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 16px; border:1px solid rgba(255,255,255,0.55); border-radius:999px; color:#fff; font-size:13px; }
.sp-pills img{ width:15px; height:15px; object-fit:contain; }
.sp-hero-cta{ display:inline-block; margin-top:24px; height:50px; padding:0 30px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:15px; cursor:pointer; transition:transform .2s, filter .2s; }
.sp-hero-cta:hover{ filter:brightness(1.08); transform:translateY(-1px); }

/* section */
.sp-section{ max-width:1200px; margin:0 auto; padding:56px 24px 90px; }
@media(min-width:1024px){ .sp-section{ padding-left:40px; padding-right:40px; } }
.sp-section-head{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:30px; }
.sp-eyebrow{ font-weight:600; font-size:18px; letter-spacing:.16em; text-transform:uppercase; margin:0 0 8px; }
.sp-h2{ font-weight:400; font-size:clamp(26px,3vw,34px); margin:0; color:#0f172a; }
.sp-head-actions{ display:flex; align-items:center; gap:14px; }
.sp-mail{ position:relative; width:48px; height:48px; border-radius:9999px; background:#fff; border:1px solid #e8eaef; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(15,23,42,0.06); transition:box-shadow .2s, transform .2s; }
.sp-mail:hover{ box-shadow:0 8px 20px rgba(15,23,42,0.12); transform:translateY(-1px); }
.sp-mail img{ width:22px; height:22px; object-fit:contain; }
.sp-mail-dot{ position:absolute; top:-6px; right:-6px; min-width:18px; height:18px; padding:0 4px; border-radius:999px; background:#ef4444; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 2px #fff; }
.sp-add{ height:48px; padding:0 26px; border:none; border-radius:999px; background:#fff; color:#2563eb; font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 3px 10px rgba(15,23,42,0.06); transition:box-shadow .2s, transform .2s; }
.sp-add:hover{ box-shadow:0 8px 20px rgba(37,99,235,0.18); transform:translateY(-1px); }

/* empty state */
.sp-empty{ background:#fff; border-radius:24px; padding:64px 32px; text-align:center; box-shadow:0 8px 30px rgba(15,23,42,0.06); }
.sp-empty .material-symbols-outlined{ font-size:44px; color:#cbd5e1; }
.sp-empty h3{ font-weight:600; font-size:20px; margin:14px 0 8px; color:#0f172a; }
.sp-empty p{ font-size:14px; color:#64748b; max-width:420px; margin:0 auto; }
.sp-empty-cta{ display:inline-block; margin-top:22px; height:46px; padding:0 26px; border:none; border-radius:999px; background:#2563eb; color:#fff; font-weight:600; font-size:14px; cursor:pointer; }
.sp-empty-cta:hover{ filter:brightness(1.08); }

/* listing cards */
.sp-list{ display:flex; flex-direction:column; gap:16px; }
.sp-card{ background:#fff; border-radius:22px; padding:20px 22px; box-shadow:0 6px 22px rgba(15,23,42,0.06); transition:box-shadow .2s; }
.sp-card:hover{ box-shadow:0 12px 32px rgba(15,23,42,0.10); }
.sp-card-row{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; }
.sp-card-main{ display:flex; align-items:center; gap:16px; min-width:0; }
.sp-card-logo{ width:56px; height:56px; flex:0 0 auto; border-radius:14px; background:#0a0a0a; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.sp-card-logo img{ width:100%; height:100%; object-fit:cover; }
.sp-card-logo .material-symbols-outlined{ color:#fff; font-size:24px; }
.sp-card-text{ min-width:0; }
.sp-card-text h3{ font-weight:600; font-size:17px; margin:0; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sp-tagline{ font-size:13px; color:#64748b; margin:2px 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sp-meta{ display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.sp-meta span{ font-size:10px; padding:3px 8px; border-radius:6px; background:#f1f5f9; color:#64748b; }
.sp-card-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.sp-act-ico{ width:14px; height:14px; flex-shrink:0; }
.sp-act-label{ margin-left:6px; }
.sp-date{ font-size:12px; color:#94a3b8; white-space:nowrap; }
.sp-edit{
  height:38px;
  display:inline-flex;
  align-items:center;
  padding:0 18px;
  border-radius:999px;
  border:1px solid #cbd5e1;
  background:#ffffff;
  color:#334155;
  font-weight:600;
  font-size:13px;
  text-decoration:none;
  transition:all .2s ease;
  box-shadow:0 1px 3px rgba(15,23,42,0.04);
}
.sp-edit:hover{
  background:#eff6ff;
  border-color:#93c5fd;
  color:#2563eb;
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(37,99,235,0.18);
}
.sp-edit:active{
  transform:translateY(0);
}
.sp-view-live{
  height:38px;
  display:inline-flex;
  align-items:center;
  padding:0 18px;
  border-radius:999px;
  background:rgba(34,197,94,0.10);
  border:1px solid rgba(34,197,94,0.25);
  color:#15803d;
  font-weight:600;
  font-size:13px;
  text-decoration:none;
  transition:all .2s ease;
}
.sp-view-live:hover{
  background:#16a34a;
  border-color:#16a34a;
  color:#ffffff;
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(22,163,74,0.32);
}
.sp-view-live:active{
  transform:translateY(0);
}
.sp-badge{
  height:38px;
  display:inline-flex;
  align-items:center;
  padding:0 18px;
  border-radius:999px;
  font-weight:600;
  font-size:13px;
  white-space:nowrap;
  transition:all .2s ease;
  cursor:default;
}
.sp-badge--pending{
  background:#2563eb;
  color:#ffffff;
  box-shadow:0 2px 8px rgba(37,99,235,0.22);
}
.sp-badge--pending:hover{
  background:#1d4ed8;
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(37,99,235,0.38);
}
.sp-badge--approved{
  background:#1b8900;
  color:#ffffff;
  box-shadow:0 2px 8px rgba(27,137,0,0.22);
}
.sp-badge--approved:hover{
  background:#156d00;
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(27,137,0,0.38);
}
.sp-badge--rejected{
  background:#dc2626;
  color:#ffffff;
  box-shadow:0 2px 8px rgba(220,38,38,0.22);
}
.sp-badge--rejected:hover{
  background:#b91c1c;
  transform:translateY(-1px);
  box-shadow:0 4px 14px rgba(220,38,38,0.38);
}
.sp-delete{
  height:38px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 18px;
  border-radius:999px;
  background:#dc2626;
  border:none;
  color:#ffffff;
  font-weight:600;
  font-size:13px;
  cursor:pointer;
  transition:all .2s ease;
  text-decoration:none;
  box-shadow:0 2px 8px rgba(220,38,38,0.22);
}
.sp-delete:hover{
  background:#b91c1c !important;
  color:#ffffff !important;
  box-shadow:0 4px 14px rgba(220,38,38,0.38);
  transform:translateY(-1px);
}
.sp-delete:active{
  transform:translateY(0);
}

/* delete confirmation modal */
.sp-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,0.55); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; }
.sp-modal{ background:#fff; border-radius:25px; padding:28px; max-width:420px; width:100%; box-shadow:0 24px 70px rgba(15,23,42,0.22); }
.sp-modal h3{ font-size:19px; font-weight:600; color:#0f172a; margin:0 0 10px; }
.sp-modal p{ font-size:13.5px; line-height:1.6; color:#475569; margin:0; }
.sp-modal-error{ margin-top:12px !important; padding:10px 14px; border-radius:12px; background:rgba(220,38,38,0.08); color:#dc2626 !important; font-size:12.5px !important; }
.sp-modal-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:22px; }
.sp-modal-cancel{ height:40px; padding:0 22px; border-radius:999px; border:1px solid #e2e8f0; background:#fff; color:#475569; font-weight:500; font-size:14px; cursor:pointer; transition:background .2s; }
.sp-modal-cancel:hover{ background:#f8fafc; }
.sp-modal-delete{ height:40px; padding:0 24px; border-radius:999px; border:none; background:#dc2626; color:#fff; font-weight:600; font-size:14px; cursor:pointer; transition:filter .2s; }
.sp-modal-delete:hover{ filter:brightness(0.92); }
.sp-modal-delete:disabled, .sp-modal-cancel:disabled{ opacity:0.6; cursor:not-allowed; }

.sp-rejection{ margin-top:14px; padding:14px 16px; border-radius:14px; background:rgba(220,38,38,0.06); border:1px solid rgba(220,38,38,0.18); }
.sp-rejection-h{ font-weight:700; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#b91c1c; margin:0 0 4px; }
.sp-rejection-b{ font-size:13px; color:#475569; margin:0; }
.sp-rejection-f{ font-size:12px; color:#94a3b8; margin:8px 0 0; }
.sp-rejection-f a{ color:#2563eb; text-decoration:underline; }

@media(max-width:768px){
  .sp-hero{ min-height:480px; }
  .sp-hero-in{ padding:135px 16px 28px; }
  .sp-hero-title{ font-size:26px; }

  /* Hero pills + CTA had no mobile rules, so they kept desktop sizing (50px
     button, 36px pills) and dominated the small viewport. These match the
     landing page's mobile hero (.hm-mob-pills / .hm-mob-cta-btn) so the two
     entry points look like the same product. */
  .sp-pills{ gap:8px; margin-top:16px; }
  .sp-pills span{
    height:auto;
    padding:5px 12px;
    font-size:11px;
    gap:6px;
    background:rgba(255,255,255,0.12);
    backdrop-filter:blur(8px);
    -webkit-backdrop-filter:blur(8px);
    border-color:rgba(255,255,255,0.5);
    white-space:nowrap;
  }
  .sp-pills img{ width:12px; height:12px; }
  .sp-hero-cta{
    margin-top:16px;
    height:auto;
    /* Sized down towards the check pills above it. Kept a touch taller than the
       pills (~34px vs ~22px) so it still clears a comfortable tap target — a
       pill is read-only text, this one has to be pressed. */
    padding:9px 24px;
    font-size:13px;
  }
  .sp-section{ padding:32px 16px 60px; }
  .sp-section-head{
    display:flex;
    flex-direction:row;
    flex-wrap:nowrap;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    margin-bottom:20px;
  }
  .sp-eyebrow{
    font-size:11px;
    letter-spacing:.12em;
    margin:0 0 2px;
  }
  .sp-h2{
    font-size:22px;
  }
  .sp-head-actions{
    display:flex;
    align-items:center;
    justify-content:flex-end;
    gap:8px;
    flex-shrink:0;
    margin-left:auto;
  }
  .sp-mail{
    width:42px;
    height:42px;
  }
  .sp-mail img{
    width:20px;
    height:20px;
  }
  .sp-add{
    height:42px;
    padding:0 20px;
    font-size:13px;
  }
  .sp-card{
    padding:16px 14px;
    border-radius:18px;
  }
  .sp-card-row{
    gap:12px;
  }
  .sp-card-actions{
    display:flex;
    align-items:center;
    justify-content:flex-end;
    gap:6px;
    flex-wrap:nowrap;
    width:100%;
  }
  .sp-card-actions::-webkit-scrollbar{
    display:none;
  }
  .sp-date{
    font-size:11px;
    /* Pushes every action to the right edge and opens a real gap after the
       date, instead of the whole row bunching up on the left. */
    margin-right:auto;
    padding-right:8px;
    flex-shrink:0;
  }
  /* Icon-only actions on phones.
     With labels the row could not fit, so it became a horizontal scroll strip
     and the last control was always clipped at the card edge. Dropping to icons
     shows every action at once; the accessible name stays on aria-label/title,
     so nothing is lost for screen readers or on hover. */
  .sp-act-label{ display:none; }
  .sp-act-ico{ width:16px; height:16px; }
  .sp-edit,
  .sp-delete,
  .sp-view-live{
    width:34px;
    height:34px;
    padding:0;
    justify-content:center;
    flex-shrink:0;
  }
  .sp-badge{
    height:34px;
    padding:0 12px;
    font-size:12px;
    flex-shrink:0;
  }
  .sp-badge{ font-size:11px; padding:0 10px; }
}
`;
