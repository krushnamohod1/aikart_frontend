"use client";

import { useState } from "react";
import {
  approveListing,
  rejectListing,
  updateListingSecrets,
  updateCustomRequestAdmin,
  deleteListing,
} from "@/lib/api-client/listings";
import { adminTestSandbox } from "@/lib/api-client/admin";
import { ApiPreviewPanel } from "./ApiPreviewPanel";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  listing_type: string;
  pricing_model: string;
  price: number | null;
  website_url: string | null;
  description: string;
  use_case: string;
  status: string;
  rejection_reason: string | null;
  provider_name: string;
  provider_email: string;
  logo_url: string | null;
  created_at: string;
  technologies: string[] | null;
  key_capabilities: string[] | null;
  try_me_enabled: boolean;
  yaml_manifest_url: string | null;
  custom_request_meta: string | null;
  listing_media: { url: string; type: string }[];
};

// The admin sidebar chrome is shared by both the full marketplace-listing
// review flow below and the lightweight Custom Requirement view.
function AdminSidebar() {
  return (
    <aside className="w-full md:w-[220px] md:min-h-screen bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
      <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
        <Link href="/" className="inline-block" aria-label="aiKart home">
          <img src="/logo/aikart-logo-full.png" alt="aiKart" className="h-6 w-auto" style={{ height: 24, width: "auto" }} />
        </Link>
      </div>
      <div className="flex-1 p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Main</p>
          <nav className="space-y-1">
            <Link href="/admin" style={{ borderRadius: "12px" }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Dashboard
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Listings</p>
          <nav className="space-y-1">
            <Link href="/admin" style={{ borderRadius: "12px" }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium bg-[#2563EB] text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
              Review Listing
            </Link>
            <Link href="/admin" style={{ borderRadius: "12px" }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
              All Listings
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Account</p>
          <nav className="space-y-1">
            <Link href="/profile" style={{ borderRadius: "12px" }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
              Profile
            </Link>
            <Link href="/explore" style={{ borderRadius: "12px" }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              Marketplace
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}

type CustomRequestMeta = {
  email?: string;
  linkedin?: string;
  phone?: string;
  companyWebsite?: string;
  wantsMeeting?: boolean;
  urgency?: string;
};

function fieldCls() {
  return "w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2563EB] focus:bg-white transition-all";
}

// Custom Agent Requests skip the marketplace approve/reject/sandbox flow
// entirely (they're auto-approved on submit) — admin only needs to see the
// buyer's contact/scheduling details privately and be able to edit or
// delete the request. Regular users never see any of this: the public
// board and detail page only ever select the listing's own text fields.
function CustomRequestAdminView({ listing }: { listing: Listing }) {
  const router = useRouter();
  const meta: CustomRequestMeta = listing.custom_request_meta
    ? JSON.parse(listing.custom_request_meta)
    : {};

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(listing.title);
  const [category, setCategory] = useState(listing.category);
  const [description, setDescription] = useState(listing.description);
  const [budget, setBudget] = useState(listing.price != null ? String(listing.price) : "");
  const [email, setEmail] = useState(meta.email ?? "");
  const [linkedin, setLinkedin] = useState(meta.linkedin ?? "");
  const [phone, setPhone] = useState(meta.phone ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(meta.companyWebsite ?? "");
  const [wantsMeeting, setWantsMeeting] = useState(meta.wantsMeeting ?? false);
  const [urgency, setUrgency] = useState(meta.urgency ?? "");

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await updateCustomRequestAdmin(listing.id, {
      title,
      category,
      description,
      budget,
      email,
      linkedin,
      phone,
      companyWebsite,
      wantsMeeting,
      urgency,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const res = await deleteListing(listing.id);
    if (res.error) {
      setDeleting(false);
      setError(res.error);
      return;
    }
    router.push("/admin");
  };

  const infoRow = (label: string, value?: string) =>
    value ? (
      <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">{label}</span>
        <span className="text-sm text-gray-900 text-right break-words">{value}</span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-slate-800">
      <AdminSidebar />

      <main className="flex-1 p-6 md:p-8 min-w-0 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border-blue-200">
                Custom Requirement
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Posted by {listing.provider_name || "Anonymous Member"} · {new Date(listing.created_at).toLocaleDateString()}
            </p>
          </div>
          <Link href="/admin" className="ak-btn-back shrink-0">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              {editing ? "Edit Request" : "Request Details"}
            </h2>
            {!editing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border border-red-500 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls()} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className={fieldCls()} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${fieldCls()} resize-none`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Budget (USD)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={fieldCls()}
                />
              </div>

              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">LinkedIn</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Website</label>
                  <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className={fieldCls()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Urgency</label>
                  <input value={urgency} onChange={(e) => setUrgency(e.target.value)} className={fieldCls()} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="admin-wants-meeting"
                    type="checkbox"
                    checked={wantsMeeting}
                    onChange={(e) => setWantsMeeting(e.target.checked)}
                    className="w-4 h-4 accent-[#2563EB] cursor-pointer"
                  />
                  <label htmlFor="admin-wants-meeting" className="text-sm text-gray-700 cursor-pointer">
                    Wants a meeting
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-full bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </div>
              <div>
                {infoRow("Category", listing.category)}
                {infoRow("Budget", listing.price != null ? `$${listing.price}` : "Open")}
                {infoRow("Email", meta.email)}
                {infoRow("Phone", meta.phone)}
                {infoRow("LinkedIn", meta.linkedin)}
                {infoRow("Company Website", meta.companyWebsite)}
                {infoRow("Urgency", meta.urgency)}
                {infoRow("Wants a meeting", meta.wantsMeeting ? "Yes" : undefined)}
              </div>
            </>
          )}
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Delete this request?</h3>
            <p className="text-sm text-gray-500 mb-5">This permanently removes the request and all its details. This can't be undone.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ManifestValidation = { valid: boolean; error?: string; agentName?: string } | null;
type SecretStatus = { name: string; description?: string; required: boolean; providedBy: string; hasValue: boolean };
type ManifestInputField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
};

export default function AdminListingReview({
  listing,
  manifestValidation,
  secretStatus = [],
  manifestInputs = [],
  canTestSandbox = false,
}: {
  listing: Listing;
  manifestValidation?: ManifestValidation;
  secretStatus?: SecretStatus[];
  manifestInputs?: ManifestInputField[];
  canTestSandbox?: boolean;
}) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<"approved" | "rejected" | null>(null);
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [savingSecret, setSavingSecret] = useState<string | null>(null);
  const [secretSaved, setSecretSaved] = useState<Record<string, boolean>>({});
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ format: string; response: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Custom Agent Requests skip the marketplace approve/reject/sandbox flow
  // entirely — they're auto-approved on submit and have none of the fields
  // (technologies, manifest, secrets…) this page is built around.
  if (listing.listing_type === "Custom Requirement") {
    return <CustomRequestAdminView listing={listing} />;
  }

  const missingSecrets = secretStatus.filter((s) => s.required && !s.hasValue && !secretSaved[s.name]);
  // A secret saved just now in this same session unblocks testing too,
  // without needing a full page reload to re-derive canTestSandbox server-side.
  const testUnlocked = canTestSandbox || missingSecrets.length === 0;

  const handleRunTest = async () => {
    setTestRunning(true);
    setTestError(null);
    setTestResult(null);
    const result = await adminTestSandbox(listing.id, testInputs);
    setTestRunning(false);
    if ("error" in result) setTestError(result.error);
    else setTestResult({ format: result.format, response: result.response });
  };

  const handleSaveSecret = async (name: string) => {
    const value = secretInputs[name]?.trim();
    if (!value) return;
    setSavingSecret(name);
    setError(null);
    const result = await updateListingSecrets(listing.id, { [name]: value });
    setSavingSecret(null);
    if (result.error) {
      setError(result.error);
    } else {
      setSecretSaved((prev) => ({ ...prev, [name]: true }));
      setSecretInputs((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const screenshots = listing.listing_media.filter((m) => m.type === "screenshot");
  const pdf = listing.listing_media.find((m) => m.type === "pdf");
  const video = listing.listing_media.find((m) => m.type === "video");

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    const result = await approveListing(listing.id);
    if (result.error) {
      setError(result.error);
      setIsApproving(false);
    } else {
      setActionDone("approved");
      setTimeout(() => router.push("/admin"), 2000);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setIsRejecting(true);
    setError(null);
    const result = await rejectListing(listing.id, rejectReason);
    if (result.error) {
      setError(result.error);
      setIsRejecting(false);
    } else {
      setShowRejectModal(false);
      setActionDone("rejected");
      setTimeout(() => router.push("/admin"), 2000);
    }
  };

  if (actionDone) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm max-w-md w-full text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              actionDone === "approved"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {actionDone === "approved" ? "check_circle" : "cancel"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Listing {actionDone === "approved" ? "Approved" : "Rejected"}
          </h2>
          <p className="text-sm text-gray-500">
            Email notification sent to provider. Redirecting to admin dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-slate-800">
      {/* ── Left Sidebar (220px fixed) ── */}
      <aside className="w-full md:w-[220px] md:min-h-screen bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
        {/* Logo at top */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <Link href="/" className="inline-block" aria-label="aiKart home">
            <img
              src="/logo/aikart-logo-full.png"
              alt="aiKart"
              className="h-6 w-auto"
              style={{ height: 24, width: "auto" }}
            />
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 p-4 space-y-6">
          {/* Section: MAIN */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Main
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin"
                style={{ borderRadius: "12px" }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Section: LISTINGS */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
              Listings
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin"
                style={{ borderRadius: "12px" }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium bg-[#2563EB] text-white shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">rate_review</span>
                Review Listing
              </Link>
              <Link
                href="/admin"
                style={{ borderRadius: "12px" }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">list_alt</span>
                All Listings
              </Link>
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
      <main className="flex-1 p-6 md:p-8 min-w-0 max-w-5xl">
        {/* HEADER ROW */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E5E7EB]">
          <div>
            <h1 className="text-xl md:text-2xl font-normal text-gray-900">Listing Review</h1>
            <p className="text-xs text-gray-500 mt-0.5">Review listing submission details before approving or rejecting.</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
            <Link
              href="/admin"
              className="ak-btn-back"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back
            </Link>

            {listing.status === "pending" ? (
              <>
                {/* Reject Button: border: 2px solid #EF4444, text: #EF4444, bg: white, hover: bg-red-50, rounded-full, px-7 py-2.5 */}
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-white border-2 border-[#EF4444] text-[#EF4444] rounded-full font-medium text-sm hover:bg-red-50 transition-all duration-200 ease-in-out shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                  Reject
                </button>

                {/* Approve Button: border: 2px solid #22C55E, text: #22C55E, bg: white, hover: bg-green-50, rounded-full, px-7 py-2.5 */}
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="inline-flex items-center gap-2 px-7 py-2.5 bg-white border-2 border-[#22C55E] text-[#22C55E] rounded-full font-medium text-sm hover:bg-green-50 transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50"
                >
                  {isApproving ? (
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                  Approve
                </button>
              </>
            ) : (
              <span
                className={`px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                  listing.status === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : listing.status === "deleted"
                      ? "bg-slate-100 text-slate-600 border-slate-300"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {listing.status === "deleted" ? "Deleted by User" : listing.status}
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* ── SECTION CARDS (gap: 16px, each in a white rounded-2xl card) ── */}
        <div className="space-y-4">
          {/* CARD 1: TOP SECTION — Agent Name, Subtitle/Tagline, Tags Row */}
          <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="flex items-start gap-5">
              {listing.logo_url && (
                <img
                  src={listing.logo_url}
                  alt="Logo"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-normal text-gray-900">
                  {listing.title}
                </h1>
                {listing.tagline && (
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.tagline}
                  </p>
                )}

                {/* Tags Row */}
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {listing.listing_type && (
                    <span
                      style={{ borderRadius: "9999px" }}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100"
                    >
                      {listing.listing_type}
                    </span>
                  )}
                  {listing.category && (
                    <span
                      style={{ borderRadius: "9999px" }}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {listing.category}
                    </span>
                  )}
                  {listing.pricing_model && (
                    <span
                      style={{ borderRadius: "9999px" }}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {listing.pricing_model}
                      {listing.price ? ` · $${listing.price}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PROVIDER INFO + FILTER METADATA (Two Column Grid) */}
          <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Left Column — PROVIDER INFO */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Provider Info
                </h2>
                
                {/* Name Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Name</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {listing.provider_name || "—"}
                  </p>
                </div>

                {/* Email Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <a
                    href={`mailto:${listing.provider_email}`}
                    className="text-sm font-medium text-[#2563EB] hover:underline mt-0.5 inline-block truncate max-w-full"
                  >
                    {listing.provider_email || "—"}
                  </a>
                </div>

                {/* Website Box (if present) */}
                {listing.website_url && (
                  <div
                    style={{ borderRadius: "12px" }}
                    className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                  >
                    <p className="text-xs text-gray-400 font-medium">Website</p>
                    <a
                      href={listing.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#2563EB] hover:underline mt-0.5 inline-block truncate max-w-full"
                    >
                      {listing.website_url}
                    </a>
                  </div>
                )}

                {/* Submitted Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Submitted</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {listing.created_at
                      ? new Date(listing.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Right Column — FILTER METADATA */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Filter Metadata
                </h2>

                {/* Category Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Category</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {listing.category || "—"}
                  </p>
                </div>

                {/* Use Case Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Use Case</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {listing.use_case || "—"}
                  </p>
                </div>

                {/* Pricing Model Box */}
                <div
                  style={{ borderRadius: "12px" }}
                  className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-4 py-3 w-full"
                >
                  <p className="text-xs text-gray-400 font-medium">Pricing Model</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {listing.pricing_model || ""}
                    {listing.price ? ` $${listing.price}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: DESCRIPTION */}
          <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Description
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {listing.description || "No description provided."}
            </p>
          </div>

          {/* CARD 4: TECHNOLOGY STACK (if present) */}
          {listing.technologies && listing.technologies.length > 0 && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Technology Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-[#EFF6FF] text-[#2563EB] text-xs font-medium rounded-full border border-blue-100"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CARD 5: KEY CAPABILITIES (if present) */}
          {listing.key_capabilities && listing.key_capabilities.length > 0 && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Key Capabilities
              </h2>
              <ul className="space-y-2">
                {listing.key_capabilities.map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-sm text-gray-700">
                    <span
                      className="material-symbols-outlined text-emerald-500 text-base mt-0.5"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CARD 6: "TRY ME NOW" SANDBOX */}
          <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              &ldquo;Try Me Now&rdquo; Sandbox
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                  listing.try_me_enabled
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {listing.try_me_enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {listing.try_me_enabled && (
              listing.yaml_manifest_url ? (
                <div className="space-y-3 pt-1">
                  <a
                    href={listing.yaml_manifest_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium text-[#2563EB]"
                  >
                    <span className="material-symbols-outlined text-xl">description</span>
                    View YAML Manifest
                  </a>

                  {manifestValidation && (
                    manifestValidation.valid ? (
                      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                        <span
                          className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        <p>
                          Manifest is valid — sandbox will run as &ldquo;{manifestValidation.agentName}&rdquo;.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
                        <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">
                          error
                        </span>
                        <p>
                          Manifest error — sandbox will not work until fixed: {manifestValidation.error}
                        </p>
                      </div>
                    )
                  )}

                  {secretStatus.length > 0 && (
                    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                      <div className="px-3.5 py-2.5 bg-gray-50 border-b border-[#E5E7EB] text-xs font-bold text-gray-700">
                        API Keys / Secrets{" "}
                        {missingSecrets.length > 0 && (
                          <span className="text-rose-600 font-semibold">— {missingSecrets.length} required, missing</span>
                        )}
                      </div>
                      <div className="divide-y divide-[#E5E7EB]">
                        {secretStatus.map((s) => {
                          const resolved = s.hasValue || secretSaved[s.name];
                          return (
                            <div key={s.name} className="p-3.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium text-gray-800">
                                  {s.name}
                                  {s.required && <span className="text-rose-500"> *</span>}
                                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    {s.providedBy === "admin" ? "aiKart provides" : "seller provides"}
                                  </span>
                                </div>
                                {resolved ? (
                                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Set
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-rose-600">Missing</span>
                                )}
                              </div>
                              {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}

                              {!resolved && s.providedBy === "admin" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="password"
                                    autoComplete="off"
                                    value={secretInputs[s.name] ?? ""}
                                    onChange={(e) => setSecretInputs((prev) => ({ ...prev, [s.name]: e.target.value }))}
                                    placeholder={`Paste the ${s.name} value to use for this listing…`}
                                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSecret(s.name)}
                                    disabled={savingSecret === s.name || !secretInputs[s.name]?.trim()}
                                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
                                  >
                                    {savingSecret === s.name ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              )}
                              {!resolved && s.providedBy === "seller" && (
                                <p className="text-xs text-amber-600 mt-2">Waiting on the seller to provide this value.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* API Endpoint Mode listings render their own preview here and
                      nothing at all for every other listing type, so the Docker
                      and n8n review flows below are untouched. */}
                  <ApiPreviewPanel listingId={listing.id} />

                  {manifestValidation?.valid && (
                    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                      <div className="px-3.5 py-2.5 bg-gray-50 border-b border-[#E5E7EB] text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>Test This Agent (Sandbox)</span>
                        {!testUnlocked && (
                          <span className="text-[11px] font-semibold text-amber-600">Fill in required keys above first</span>
                        )}
                      </div>
                      {testUnlocked ? (
                        <div className="p-3.5 space-y-3">
                          <p className="text-xs text-gray-500">
                            Runs the real sandbox — same as a buyer&apos;s &ldquo;Try Me Now&rdquo;. Confirm it actually
                            works before approving.
                          </p>
                          {manifestInputs.length > 0 && (
                            <div className="space-y-2.5">
                              {manifestInputs.map((f) => (
                                <div key={f.name}>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {f.label}
                                    {f.required && <span className="text-rose-500"> *</span>}
                                  </label>
                                  {f.options && f.options.length > 0 ? (
                                    <select
                                      value={testInputs[f.name] ?? ""}
                                      onChange={(e) => setTestInputs((prev) => ({ ...prev, [f.name]: e.target.value }))}
                                      className="w-full text-xs px-3 py-2 pr-8 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white appearance-none cursor-pointer"
                                      style={{
                                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 8px center",
                                        backgroundSize: "14px",
                                      }}
                                    >
                                      <option value="">Select…</option>
                                      {f.options.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={f.type === "number" ? "number" : "text"}
                                      value={testInputs[f.name] ?? ""}
                                      onChange={(e) => setTestInputs((prev) => ({ ...prev, [f.name]: e.target.value }))}
                                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleRunTest}
                            disabled={testRunning}
                            className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-gray-900 text-white disabled:opacity-40 hover:bg-gray-800 transition-colors flex items-center gap-2"
                          >
                            {testRunning && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                            {testRunning ? "Running…" : "Run Test"}
                          </button>

                          {testError && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                              <span className="material-symbols-outlined text-rose-600 text-base shrink-0">error</span>
                              <span>{testError}</span>
                            </div>
                          )}
                          {testResult && (
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
                                <span className="material-symbols-outlined text-base">check_circle</span> Ran successfully
                              </div>
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">{testResult.response}</pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="p-3.5 text-xs text-gray-500">
                          Fill in the missing required key(s) above, then this section unlocks.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Provider opted in but has not uploaded a YAML manifest yet.
                </p>
              )
            )}
          </div>

          {/* CARD 7: DEMONSTRATION VIDEO (if present) */}
          {video && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Demonstration Video
              </h2>
              <video
                src={video.url}
                controls
                className="w-full max-h-[420px] rounded-xl border border-[#E5E7EB] bg-black"
              />
            </div>
          )}

          {/* CARD 8: SCREENSHOTS (if present) */}
          {screenshots.length > 0 && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Screenshots
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {screenshots.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group overflow-hidden rounded-xl border border-[#E5E7EB]"
                  >
                    <img
                      src={s.url}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CARD 9: PDF DOCUMENT (if present) */}
          {pdf && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                PDF Document
              </h2>
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 p-3.5 bg-gray-50 border border-[#E5E7EB] rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span
                  className="material-symbols-outlined text-rose-500 text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  picture_as_pdf
                </span>
                <span className="text-sm font-medium text-[#2563EB] hover:underline">
                  View / Download PDF Document
                </span>
              </a>
            </div>
          )}

          {/* CARD 10: REJECTION REASON (if already rejected) */}
          {listing.status === "rejected" && listing.rejection_reason && (
            <div style={{ borderRadius: "12px" }} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
                  Rejection Reason
                </h3>
                <p className="text-sm text-rose-900">
                  {listing.rejection_reason}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 space-y-5 shadow-xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Reject Listing
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Provide a reason. This explanation will be emailed to the provider.
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. The description lacks sufficient detail. Please expand on the use case and provide clear pricing information."
              rows={4}
              className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all outline-none resize-none"
            />
            {error && (
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setError(null);
                }}
                className="ak-btn-cancel flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {isRejecting ? "Sending…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
