"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE } from "@/lib/api-client/config";

const SOCIALS = [
  {
    l: "X (Twitter)",
    href: "https://x.com/aikartco",
    d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    l: "Instagram",
    href: "https://www.instagram.com/aikart.co/",
    d: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.06A6.74 6.74 0 1012 18.74 6.74 6.74 0 0012 5.26zm0 11.12A4.38 4.38 0 1112 7.62a4.38 4.38 0 010 8.76zm6.3-11.35a1.58 1.58 0 11-3.16 0 1.58 1.58 0 013.16 0z",
  },
  {
    l: "LinkedIn",
    href: "https://www.linkedin.com/company/aikart-co",
    d: "M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4 0 4.74 2.64 4.74 6.07V21H19v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z",
  },
];

const NAV = [
  {
    heading: "Product",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Sandbox Testing", href: "/explore" },
      { label: "Custom Solutions", href: "/custom-agents" },
      { label: "Custom ML Models", href: "/custom-ml-models" },
      { label: "Pricing", href: "/explore" },
    ],
  },
  {
    heading: "Sellers",
    links: [
      { label: "Become a Seller", href: "/become-seller" },
      { label: "Seller Dashboard", href: "/seller/status" },
      { label: "Upload Product", href: "/seller/new/step1" },
      { label: "Seller Guidelines", href: "/become-seller" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/#how-it-works" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

// Opens the globally-mounted ContactModal (src/components/modals/ContactModal.tsx),
// the same "dispatch a custom event" pattern ScheduleMeetingModal uses.
function openContactModal() {
  window.dispatchEvent(new CustomEvent("open-contact-modal"));
}

type LegalKey = "terms" | "privacy" | "cookies";

const LEGAL: Record<LegalKey, { title: string; subtitle: string; sections: { title: string; body: string }[] }> = {
  terms: {
    title: "Terms of Service",
    subtitle: "AIKart Seller Agreement & Terms of Service",
    sections: [
      {
        title: "1. Eligibility & Product Originality",
        body: "You must be at least 18 years old and legally able to enter into contracts to list products on AIKart. All AI products listed must be original, functional, and accurately described. Misrepresentation of features or capabilities is strictly prohibited.",
      },
      {
        title: "2. Commission Structure & Revenue Sharing",
        body: "AIKart charges a platform commission on each successful transaction. The current commission rate is displayed in your seller dashboard and is deducted upon verified buyer settlement.",
      },
      {
        title: "3. Payout Terms & Settlement",
        body: "Payouts are remitted in your selected preferred currency to your designated bank account according to your chosen payout schedule (Monthly or Weekly), subject to standard settlement and fraud verification.",
      },
      {
        title: "4. Prohibited Content & Intellectual Property",
        body: "You retain ownership of your AI product. By listing on AIKart, you grant AIKart a non exclusive license to display and promote your product. You may not list products that are harmful, illegal, or violate intellectual property rights.",
      },
      {
        title: "5. Sandbox & Live Evaluation",
        body: "If you provide live sandbox manifests or test endpoints, ensure demo environments do not expose sensitive infrastructure or secrets.",
      },
      {
        title: "6. Termination & Governing Law",
        body: "AIKart reserves the right to suspend or terminate seller accounts that violate these terms. These terms are governed by the laws of India.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How AIKart collects, uses, and protects your data",
    sections: [
      {
        title: "1. Information We Collect",
        body: "We collect information you provide directly, such as your name, email, company details, and payment information when you create an account, list a product, or make a purchase. We also collect usage data automatically, including pages visited, actions taken, and device/browser information, to help us operate and improve the platform.",
      },
      {
        title: "2. How We Use Your Information",
        body: "Your information is used to provide and improve AIKart's services, process transactions and payouts, verify seller listings, communicate important updates, prevent fraud, and personalize your experience on the marketplace.",
      },
      {
        title: "3. Sharing of Information",
        body: "We do not sell your personal data. Information is shared only with trusted third parties who help us operate the platform (such as payment processors and cloud hosting providers), or when required by law. Sellers and buyers only see the information necessary to complete a transaction.",
      },
      {
        title: "4. Data Security",
        body: "We use industry-standard safeguards, including encryption in transit and access controls, to protect your data from unauthorized access, alteration, or disclosure. Sensitive information such as bank details and secrets is stored securely and never displayed in plain text after entry.",
      },
      {
        title: "5. Your Rights & Choices",
        body: "You can access, update, or request deletion of your personal data at any time by contacting us. You may also opt out of marketing communications while continuing to receive essential account and transaction notifications.",
      },
      {
        title: "6. Data Retention",
        body: "We retain your information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.",
      },
      {
        title: "7. Contact Us",
        body: "If you have questions about this Privacy Policy or how your data is handled, reach out to us at contact@aikart.co.",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    subtitle: "How AIKart uses cookies and similar technologies",
    sections: [
      {
        title: "1. What Are Cookies",
        body: "Cookies are small text files stored on your device that help websites function properly and remember your preferences. AIKart uses cookies and similar technologies (such as local storage) across the platform.",
      },
      {
        title: "2. Essential Cookies",
        body: "These cookies are required for core functionality, such as keeping you signed in, securing your session, and enabling checkout and seller dashboard features. The platform cannot function properly without them.",
      },
      {
        title: "3. Functional & Preference Cookies",
        body: "These remember choices you make, such as language, currency, or display settings, so you don't have to reselect them on every visit.",
      },
      {
        title: "4. Analytics Cookies",
        body: "We use analytics cookies to understand how visitors use AIKart — which pages are popular, how users navigate the marketplace, and where we can improve. This data is aggregated and does not directly identify you.",
      },
      {
        title: "5. Managing Cookies",
        body: "Most browsers let you control or delete cookies through their settings. Disabling essential cookies may affect your ability to sign in or use certain features of AIKart.",
      },
      {
        title: "6. Changes to This Policy",
        body: "We may update this Cookie Policy from time to time to reflect changes in our practices. Continued use of AIKart after changes are posted constitutes acceptance of the updated policy.",
      },
    ],
  },
};

export function Footer() {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState<LegalKey | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribing, setNewsletterSubscribing] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [newsletterIsError, setNewsletterIsError] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address.");
      setNewsletterIsError(true);
      return;
    }

    setNewsletterSubscribing(true);
    setNewsletterMessage(null);
    setNewsletterIsError(false);

    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNewsletterMessage(data.error || "Subscription failed. Please try again.");
        setNewsletterIsError(true);
      } else {
        setNewsletterMessage(data.message || "Subscribed successfully!");
        setNewsletterIsError(false);
        setNewsletterEmail("");
      }
    } catch {
      setNewsletterMessage("Something went wrong. Please check your connection and try again.");
      setNewsletterIsError(true);
    } finally {
      setNewsletterSubscribing(false);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      document.body.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleSection = (heading: string) => {
    setOpenSection((prev) => (prev === heading ? null : heading));
  };

  const MOBILE_ACCORDIONS = [
    { heading: "Contact", type: "contact" as const },
    ...NAV.map((col) => ({ heading: col.heading, type: "nav" as const, col })),
  ];

  return (
    <>
      <footer id="footer-contact" className="akf">
        <style dangerouslySetInnerHTML={{ __html: AKF_CSS }} />

      {/* ── top gradient bar ── */}
      <div className="akf-topbar" aria-hidden="true" />

      <div className="akf-inner">

        {/* ── brand + newsletter ── */}
        <div className="akf-brand-row">
          <div className="akf-brand">
            <Link href="/" className="akf-logo" aria-label="aikart home" onClick={handleHomeClick}>
              <img src="/logo/aikart-logo-full.png" alt="aikart" style={{ height: 24, width: "auto", background: "transparent" }} />
            </Link>
            <p className="akf-tagline">
              The marketplace where businesses discover, test, and deploy verified AI solutions without the guesswork.
            </p>
            <a
              href="https://maps.google.com/?q=Tapadia+City+Center+Mall+Badnera+Road+Amravati+Maharashtra+444607"
              target="_blank"
              rel="noopener noreferrer"
              className="akf-address akf-address-link"
              title="Open office location in Google Maps"
            >
              Aikart office Badnera road, Infront of Tapadia City Center Mall,<br />
              Saturna, Amravati Maharashtra-444607
            </a>
            <div className="akf-socials">
              {/* X (Twitter) - original black logo */}
              <a href="https://x.com/aikartco" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="akf-social akf-social--brand">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Instagram - original gradient logo */}
              <a href="https://www.instagram.com/aikart.co/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="akf-social akf-social--brand">
                <svg width="20" height="20" viewBox="0 0 132 132" aria-hidden="true">
                  <defs>
                    <linearGradient id="ig-lg1" x1="0.5" y1="1" x2="0.5" y2="0">
                      <stop offset="0" stopColor="#FFC107" />
                      <stop offset="0.507" stopColor="#F44336" />
                      <stop offset="0.99" stopColor="#9C27B0" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="128" height="128" rx="32" fill="url(#ig-lg1)" />
                  <circle cx="66" cy="66" r="26" fill="none" stroke="#fff" strokeWidth="9" />
                  <circle cx="96" cy="36" r="7" fill="#fff" />
                  <rect x="14" y="14" width="104" height="104" rx="24" fill="none" stroke="#fff" strokeWidth="9" />
                </svg>
              </a>
              {/* LinkedIn - original brand logo */}
              <a href="https://www.linkedin.com/company/aikart-co" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="akf-social akf-social--brand">
                <svg width="20" height="20" viewBox="0 0 72 72" aria-hidden="true">
                  <rect width="72" height="72" rx="12" fill="#0A66C2" />
                  <path fill="#fff" d="M20.1 29.2h7.1V51h-7.1zM23.6 18.5c2.3 0 4.1 1.8 4.1 4.1s-1.8 4.1-4.1 4.1-4.1-1.8-4.1-4.1 1.8-4.1 4.1-4.1M31.5 29.2h6.8v3h.1c.9-1.8 3.2-3.6 6.6-3.6 7.1 0 8.4 4.7 8.4 10.7V51h-7.1v-10c0-2.4 0-5.5-3.3-5.5-3.3 0-3.9 2.6-3.9 5.3V51h-7.1V29.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* ── newsletter ── */}
          <div className="akf-newsletter">
            <p className="akf-nl-label">Stay in the loop</p>
            <h3 className="akf-nl-heading">Get the latest AI solutions in your inbox</h3>
            <p className="akf-nl-sub">Weekly picks, new seller launches, and platform updates.</p>
            <form onSubmit={handleNewsletterSubmit} className="akf-nl-form">
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                className="akf-nl-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterSubscribing}
                required
              />
              <button type="submit" className="akf-nl-btn" disabled={newsletterSubscribing}>
                {newsletterSubscribing ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {newsletterMessage && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "13.5px",
                  fontWeight: 500,
                  color: newsletterIsError ? "#ef4444" : "#16a34a",
                  lineHeight: 1.4,
                }}
              >
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>

        <div className="akf-divider desktop-only-divider" />

        {/* ── desktop nav columns (DESKTOP ONLY) ── */}
        <div className="akf-nav-row">
          {NAV.map((col) => (
            <nav key={col.heading} className="akf-col">
              <span className="akf-col-h">{col.heading}</span>
              {col.links.map((l) => (
                l.label === "Contact" ? (
                  <button key="contact" className="akf-col-link-btn" onClick={() => openContactModal()}>Contact</button>
                ) : l.label === "About Us" ? (
                  <button key="about" className="akf-col-link-btn" onClick={() => setAboutOpen(true)}>About Us</button>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={l.href === "/" ? handleHomeClick : undefined}
                  >
                    {l.label}
                  </Link>
                )
              ))}
            </nav>
          ))}
        </div>

        {/* ── mobile collapsible accordions (MOBILE ONLY: CONTACT, PRODUCT, SELLERS, COMPANY) ── */}
        <div className="akf-mobile-accordions">
          {MOBILE_ACCORDIONS.map((item) => {
            const isOpen = openSection === item.heading;
            return (
              <div key={item.heading} className="akf-accordion-item">
                <button
                  type="button"
                  onClick={() => toggleSection(item.heading)}
                  className="akf-accordion-header"
                  aria-expanded={isOpen}
                >
                  <span className="akf-accordion-title">{item.heading}</span>
                  <span className="akf-accordion-icon">{isOpen ? "−" : "+"}</span>
                </button>

                <div className={`akf-accordion-body ${isOpen ? "akf-accordion-open" : ""}`}>
                  <div className="akf-accordion-inner">
                    {item.type === "contact" ? (
                      <div className="flex flex-col gap-1 py-1">
                        <button
                          type="button"
                          className="akf-accordion-link-btn text-[#2563eb] font-semibold"
                          onClick={() => openContactModal()}
                        >
                          Send Us a Message →
                        </button>
                        <button
                          type="button"
                          className="akf-accordion-link-btn text-[#2563eb] font-semibold"
                          onClick={() => window.dispatchEvent(new CustomEvent("open-schedule-meeting"))}
                        >
                          Schedule a Meeting →
                        </button>
                        <a
                          href="mailto:contact@aikart.co"
                          className="akf-accordion-link text-gray-600"
                        >
                          contact@aikart.co
                        </a>
                      </div>
                    ) : (
                      item.col.links.map((l) =>
                        l.label === "Contact" ? (
                          <button
                            key="contact"
                            className="akf-accordion-link-btn"
                            onClick={() => openContactModal()}
                          >
                            Contact
                          </button>
                        ) : l.label === "About Us" ? (
                          <button
                            key="about"
                            className="akf-accordion-link-btn"
                            onClick={() => setAboutOpen(true)}
                          >
                            About Us
                          </button>
                        ) : (
                          <Link
                            key={l.label}
                            href={l.href}
                            className="akf-accordion-link"
                            onClick={l.href === "/" ? handleHomeClick : undefined}
                          >
                            {l.label}
                          </Link>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="akf-divider desktop-only-divider" />

        {/* ── bottom bar ── */}
        <div className="akf-bottom">
          <p className="akf-copy">© 2026 aikart. All rights reserved.</p>
          <div className="akf-bottom-links">
            <button type="button" onClick={() => setLegalOpen("terms")} className="akf-bottom-link-btn">Terms of Service</button>
            <button type="button" onClick={() => setLegalOpen("privacy")} className="akf-bottom-link-btn">Privacy Policy</button>
            <button type="button" onClick={() => setLegalOpen("cookies")} className="akf-bottom-link-btn">Cookie Policy</button>
          </div>
        </div>

      </div>
    </footer>

    {/* ── About Us Modal ── */}
    {aboutOpen && (
      <div className="akf-about-overlay" onClick={() => setAboutOpen(false)}>
        <div className="akf-about-card" onClick={(e) => e.stopPropagation()}>
          <button className="akf-about-close" onClick={() => setAboutOpen(false)} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img src="/logo/aikart-logo-full.png" alt="AIKart" style={{ height: 32, width: "auto", marginBottom: 18 }} />
          <p className="akf-about-text">
            AIKart is an AI solutions marketplace connecting businesses with intelligent agents and automation tools all in one place.
          </p>
          <p className="akf-about-text">
            Built for teams that want to move fast, AIKart brings together pre-built AI agents, sandbox testing, and seamless deployment so you can explore, try, and integrate AI into your workflow without the complexity.
          </p>
        </div>
      </div>
    )}

    {/* ── Legal (Terms / Privacy / Cookies) Modal ── */}
    {legalOpen && (
      <div className="akf-legal-overlay" onClick={() => setLegalOpen(null)}>
        <div className="akf-legal-card" onClick={(e) => e.stopPropagation()}>
          <div className="akf-legal-header">
            <div className="akf-legal-header-main">
              <img src="/logo/aikart-ai-mark.png" alt="aiKart" className="akf-legal-mark" />
              <div>
                <h2 className="akf-legal-title">{LEGAL[legalOpen].title}</h2>
                <p className="akf-legal-subtitle">{LEGAL[legalOpen].subtitle}</p>
              </div>
            </div>
            <button className="akf-legal-close" onClick={() => setLegalOpen(null)} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="akf-legal-scroll">
            {LEGAL[legalOpen].sections.map((section) => (
              <div key={section.title} className="akf-legal-section">
                <p className="akf-legal-section-title">{section.title}</p>
                <p className="akf-legal-section-body">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

const AKF_CSS = `
.akf{
  background:#f8fafc;
  font-family:var(--font-inter),'Inter',sans-serif;
  border-top:1px solid #e8ecf1;
  position:relative;
}
.akf-topbar{
  height:1px;
  background:#E5E7EB;
}
.akf-inner{
  width:100%; max-width:1200px; margin:0 auto;
  padding:64px 24px 36px;
}
@media(min-width:1024px){ .akf-inner{ padding:72px 40px 40px; } }

/* brand + newsletter row */
.akf-brand-row{
  display:grid; grid-template-columns:1fr;
  gap:52px; margin-bottom:56px;
}
@media(min-width:760px){ .akf-brand-row{ grid-template-columns:1fr 1fr; } }

.akf-logo{
  font-family:'Sansita One','Sansita',cursive;
  font-size:28px; line-height:1; text-decoration:none; display:inline-block;
  margin-bottom:22px;
}
@media(min-width:760px){
  .akf-logo{ margin-bottom:16px; }
}
.akf-tagline{
  font-size:14.5px; line-height:1.65; color:#64748b;
  margin:0 0 14px; max-width:340px;
}
.akf-address{ font-size:13px; color:#94a3b8; margin:0 0 22px; }
.akf-socials{ display:flex; gap:10px; }
.akf-social{
  width:38px; height:38px; border-radius:50%;
  background:#fff; display:flex; align-items:center; justify-content:center;
  box-shadow:0 2px 10px rgba(0,0,0,0.08);
  transition:background .2s, transform .2s, box-shadow .2s;
}
.akf-social:hover{ transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,0.13); }
.akf-social svg{ width:18px; height:18px; }

/* newsletter */
.akf-nl-label{
  font-size:14px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
  color:#2563eb; margin:0 0 10px;
}
.akf-nl-heading{
  font-family:var(--font-red-hat),'Red Hat Display',sans-serif;
  font-weight:500; font-size:22px; line-height:1.25;
  color:#0f172a; margin:0 0 10px;
}
.akf-nl-sub{ font-size:14px; color:#64748b; margin:0 0 20px; line-height:1.5; }
.akf-nl-form{ display:flex; gap:8px; }
.akf-nl-input{
  flex:1; height:46px; padding:0 20px; border-radius:9999px;
  border:1.5px solid #e2e8f0; background:#fff;
  font-size:14.5px; color:#0f172a; outline:none;
  transition:border-color .2s, box-shadow .2s;
  width:100%; box-sizing:border-box;
}
.akf-nl-input:focus{ border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.12); }
.akf-nl-input:hover{ border-color:#93c5fd; }
.akf-nl-input::placeholder{ color:#94a3b8; }
.akf-nl-btn{
  height:46px; padding:0 24px; border-radius:9999px; border:none;
  background:#2563eb; color:#fff; font-weight:600; font-size:14.5px;
  cursor:pointer; white-space:nowrap;
  box-shadow:0 4px 14px rgba(37,99,235,0.28);
  transition:background .2s, transform .2s;
  display:inline-flex; align-items:center; justify-content:center;
  box-sizing:border-box;
}
.akf-nl-btn:hover{ background:#1d4fd0; transform:translateY(-1px); }

.akf-col-link-btn{ background:none; border:none; padding:0; cursor:pointer; font-size:14.5px; color:#475569; text-align:inherit; transition:color .2s; width:max-content; }
.akf-col-link-btn:hover{ color:#2563eb; }
/* divider */
.akf-divider{ height:1px; background:#e8ecf1; margin:0 0 44px; }
.desktop-only-divider{ display:none; }
@media(min-width:769px){ .desktop-only-divider{ display:block; } }

/* nav columns (DESKTOP ONLY) */
.akf-nav-row{
  display:none;
}
@media(min-width:769px){
  .akf-nav-row{
    display:grid; grid-template-columns:repeat(3,1fr); gap:0px;
    margin-bottom:44px; max-width:100%;
  }
}
.akf-col{ display:flex; flex-direction:column; gap:12px; }
/* Product → left-aligned (default) */
.akf-col:nth-child(1){ align-items:flex-start; }
/* Sellers → centered */
.akf-col:nth-child(2){ align-items:center; }
/* Company → right-aligned */
.akf-col:nth-child(3){ align-items:flex-end; }
.akf-col-h{
  font-weight:600; font-size:11.5px; letter-spacing:.16em;
  text-transform:uppercase; color:#94a3b8; margin-bottom:4px;
}
.akf-col a{
  font-size:14.5px; color:#475569; text-decoration:none;
  transition:color .2s; width:max-content;
}
.akf-col a:hover{ color:#2563eb; }

/* Mobile Accordions Styles (MOBILE ONLY) */
.akf-mobile-accordions {
  display: block;
  margin-bottom: 28px;
  border-top: 1px solid #e8ecf1;
}
@media(min-width:769px){
  .akf-mobile-accordions {
    display: none !important;
  }
}
.akf-accordion-item {
  border-bottom: 1px solid #e8ecf1;
}
.akf-accordion-header {
  width: 100%;
  min-height: 52px;
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}
.akf-accordion-title {
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0f172a;
}
.akf-accordion-icon {
  font-size: 20px;
  font-weight: 500;
  color: #2563eb;
  transition: transform 0.25s ease;
}
.akf-accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease;
  opacity: 0;
  overflow: hidden;
}
.akf-accordion-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.akf-accordion-inner {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
}
.akf-accordion-link,
.akf-accordion-link-btn {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 4px;
  font-size: 14.5px;
  color: #475569;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;
  width: 100%;
}
.akf-accordion-link:hover,
.akf-accordion-link-btn:hover {
  color: #2563eb;
}

/* bottom bar */
.akf-bottom{
  display:flex; flex-direction:column; align-items:center; gap:14px;
}
@media(min-width:640px){
  .akf-bottom{ flex-direction:row; justify-content:space-between; }
}
.akf-address-link {
  text-decoration: none;
  display: block;
  transition: color 0.2s;
}
.akf-address-link:hover {
  color: #2563eb;
}

.akf-bottom-links{ display:flex; gap:24px; }
.akf-bottom-links a,
.akf-bottom-link-btn{
  font-size:13px; color:#94a3b8; text-decoration:none;
  background:transparent; border:none; padding:0; cursor:pointer;
  transition:color .2s;
}
.akf-bottom-links a:hover,
.akf-bottom-link-btn:hover{ color:#2563eb; }

@media(max-width:768px){
  .akf-topbar{ display: none; }
  .akf-inner{ padding: 36px 20px 28px; }

  /* brand section */
  .akf-brand-row{ grid-template-columns: 1fr; gap: 24px; margin-bottom: 28px; }
  .akf-brand{
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .akf-logo{ margin-bottom: 6px; }
  .akf-logo img{ height: 32px !important; width: auto !important; }

  /* Show tagline, address, and socials on mobile */
  .akf-tagline{
    display: none !important;
  }
  .akf-address{
    display: block !important;
    color: #94a3b8;
    font-size: 12px; line-height: 1.5;
    margin: 0 auto 18px; max-width: 280px;
  }
  .akf-socials{
    display: flex !important;
    justify-content: center; gap: 12px;
  }
  .akf-social{
    width: 40px; height: 40px;
    background: #fff;
    border: 1px solid #e8ecf1;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  }
  .akf-social:hover{
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }

  /* newsletter */
  .akf-newsletter{
    text-align: center;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 22px 18px;
  }
  .akf-nl-label{
    color: #2563eb; font-size: 11px; letter-spacing: 0.2em;
  }
  .akf-nl-heading{
    color: #0f172a; font-size: 17px; margin: 0 0 6px;
  }
  .akf-nl-sub{
    color: #64748b; font-size: 12.5px;
  }
  .akf-nl-form{ flex-direction: column; gap: 12px; width: 100%; }
  .akf-nl-input{
    width: 100%;
    height: 48px;
    min-height: 48px;
    font-size: 14.5px;
    padding: 0 20px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    color: #0f172a;
    border-radius: 9999px;
    text-align: center;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
    line-height: normal;
  }
  .akf-nl-input::placeholder{ color: #94a3b8; text-align: center; }
  .akf-nl-input:focus{
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .akf-nl-btn{
    width: 100%;
    height: 48px;
    min-height: 48px;
    font-size: 14.5px;
    font-weight: 600;
    color: #fff;
    background: #2563eb;
    border-radius: 9999px;
    border: none;
    box-shadow: 0 4px 14px rgba(37,99,235,0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    cursor: pointer;
    margin: 0;
  }

  /* dividers */
  .akf-divider{ display: none !important; }

  /* accordions */
  .akf-mobile-accordions{
    border-top: 1px solid #e8ecf1;
    margin-bottom: 24px;
  }
  .akf-accordion-item{
    border-bottom: 1px solid #e8ecf1;
  }
  .akf-accordion-header{
    min-height: 50px; padding: 10px 0;
  }
  .akf-accordion-title{
    color: #0f172a;
    font-size: 11.5px; letter-spacing: 0.14em;
  }
  .akf-accordion-icon{
    color: #2563eb;
    font-size: 18px;
  }
  .akf-accordion-link,
  .akf-accordion-link-btn{
    color: #475569;
    font-size: 14px; min-height: 40px;
  }
  .akf-accordion-link:hover,
  .akf-accordion-link-btn:hover{
    color: #2563eb;
  }

  /* bottom bar */
  .akf-bottom{
    text-align: center; gap: 10px;
    flex-direction: column; align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e8ecf1;
  }
  .akf-copy{
    font-size: 11.5px; color: #94a3b8;
  }
  .akf-bottom-links{
    flex-wrap: wrap; justify-content: center; gap: 16px;
  }
  .akf-bottom-links a{
    font-size: 11.5px; color: #94a3b8;
  }
  .akf-bottom-links a:hover{ color: #2563eb; }
}

/* ── About Us Modal ── */
.akf-about-overlay{
  position:fixed; inset:0; z-index:9999;
  background:rgba(0,0,0,0.45); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  animation:akfFadeIn .25s ease;
}
@keyframes akfFadeIn{ from{opacity:0} to{opacity:1} }
@keyframes akfSlideUp{ from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
.akf-about-card{
  position:relative;
  background:#fff; border-radius:20px;
  padding:44px 36px 38px; max-width:520px; width:100%;
  box-shadow:0 24px 80px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.06);
  animation:akfSlideUp .35s cubic-bezier(.16,1,.3,1);
}
.akf-about-close{
  position:absolute; top:16px; right:16px;
  width:36px; height:36px; border-radius:50%;
  border:none; background:#f1f5f9; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#64748b; transition:background .2s, color .2s;
}
.akf-about-close:hover{ background:#dc2626; color:#ffffff; }
.akf-about-badge{
  display:inline-block;
  font-size:11px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
  color:#2563eb; background:rgba(37,99,235,0.08);
  padding:5px 14px; border-radius:999px; margin-bottom:18px;
}
.akf-about-title{
  font-family:var(--font-red-hat),'Red Hat Display',sans-serif;
  font-weight:700; font-size:28px; color:#0f172a;
  margin:0 0 18px; line-height:1.15;
}
.akf-about-text{
  font-size:15px; line-height:1.7; color:#475569; margin:0 0 14px;
}
.akf-about-text:last-child{ margin-bottom:0; }
@media(max-width:640px){
  .akf-about-card{ padding:32px 22px 28px; border-radius:16px; }
  .akf-about-title{ font-size:22px; }
  .akf-about-text{ font-size:14px; }
}

/* ── Legal Modal (Terms / Privacy / Cookies) ── */
.akf-legal-overlay{
  position:fixed; inset:0; z-index:9999;
  background:rgba(0,0,0,0.45); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  animation:akfFadeIn .25s ease;
}
.akf-legal-card{
  position:relative;
  background:#fff; border-radius:20px;
  width:100%; max-width:600px;
  height:min(620px, 88vh); max-height:88vh;
  display:flex; flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.06);
  animation:akfSlideUp .35s cubic-bezier(.16,1,.3,1);
  overflow:hidden;
}
.akf-legal-header{
  display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
  padding:24px 28px 16px;
  background:linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  border-bottom:1px solid #f1f5f9;
  flex-shrink:0;
}
.akf-legal-header-main{ display:flex; align-items:center; gap:12px; }
.akf-legal-mark{ height:34px; width:auto; flex-shrink:0; }
.akf-legal-title{
  font-family:var(--font-red-hat),'Red Hat Display',sans-serif;
  font-weight:700; font-size:22px; color:#0f172a; margin:0 0 4px; line-height:1.2;
}
.akf-legal-subtitle{ font-size:13px; color:#64748b; margin:0; }
.akf-legal-close{
  width:36px; height:36px; border-radius:50%; flex-shrink:0;
  border:none; background:#f1f5f9; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#64748b; transition:background .2s, color .2s;
}
.akf-legal-close:hover{ background:#dc2626; color:#ffffff; }
.akf-legal-scroll{
  overflow-y:auto; flex:1 1 auto; min-height:0;
  padding:20px 28px 28px;
  display:flex; flex-direction:column; gap:16px;
  scrollbar-width:thin; scrollbar-color:#94a3b8 #f1f5f9;
}
.akf-legal-scroll::-webkit-scrollbar{ width:6px; }
.akf-legal-scroll::-webkit-scrollbar-track{ background:#f1f5f9; border-radius:999px; }
.akf-legal-scroll::-webkit-scrollbar-thumb{ background:#cbd5e1; border-radius:999px; }
.akf-legal-scroll::-webkit-scrollbar-thumb:hover{ background:#94a3b8; }
.akf-legal-section-title{ margin:0 0 4px; font-weight:600; font-size:14.5px; color:#0f172a; }
.akf-legal-section-body{ margin:0; font-size:13.5px; line-height:1.65; color:#475569; }
@media(max-width:640px){
  .akf-legal-card{ border-radius:16px; }
  .akf-legal-header{ padding:20px 20px 14px; }
  .akf-legal-title{ font-size:19px; }
  .akf-legal-scroll{ padding:16px 20px 22px; }
}
`;
