"use client";

import Link from "next/link";
import { ContactForm } from "./ContactForm";

interface ContactSectionProps {
  onSuccess?: () => void;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

export function ContactSection({
  onSuccess,
  compact = false,
  title = "Let's Talk About Your AI Needs",
  subtitle = "Have a question about deploying, listing, or testing verified AI solutions? Reach out to our team.",
}: ContactSectionProps) {
  if (compact) {
    return (
      <section className="ak-contact-sec-compact">
        <style dangerouslySetInnerHTML={{ __html: COMPACT_SECTION_CSS }} />

        {/* Modal Header */}
        <div className="ak-modal-header">
          <h2 className="ak-modal-title">{title}</h2>
          <p className="ak-modal-subtitle">{subtitle}</p>
        </div>


        {/* Form Container */}
        <div className="ak-modal-form-wrapper">
          <ContactForm onSuccess={onSuccess} compact={true} />
        </div>
      </section>
    );
  }

  return (
    <section className="ak-contact-sec">
      <style dangerouslySetInnerHTML={{ __html: SECTION_CSS }} />

      <div className="ak-contact-container">
        {/* Header Block */}
        <div className="ak-contact-header">
          <h2 className="ak-contact-title">{title}</h2>
          <p className="ak-contact-subtitle">{subtitle}</p>
        </div>

        {/* Grid Content */}
        <div className="ak-contact-grid">
          {/* Left Column - Contact Info Cards */}
          <div className="ak-contact-info">
            <div className="ak-info-card">
              <div className="ak-info-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="ak-info-details">
                <h4 className="ak-info-title">Email Us</h4>
                <p className="ak-info-sub">Our team is here to assist you.</p>
                <a href="mailto:feedback@aikart.co" className="ak-info-link">
                  feedback@aikart.co
                </a>
              </div>
            </div>

            <div className="ak-info-card">
              <div className="ak-info-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="ak-info-details">
                <h4 className="ak-info-title">Response Commitment</h4>
                <p className="ak-info-sub">We review every inquiry carefully.</p>
                <span className="ak-info-text">We'll review your message and get back to you as soon as possible.</span>
              </div>
            </div>

            <div className="ak-info-card">
              <div className="ak-info-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="ak-info-details">
                <h4 className="ak-info-title">Headquarters</h4>
                <p className="ak-info-sub">aiKart Marketplace Inc.</p>
                <span className="ak-info-text">Amravati, Maharashtra 444601, India</span>
              </div>
            </div>

            <div className="ak-support-box">
              <h4 className="ak-support-title">Need specialized help?</h4>
              <ul className="ak-support-list">
                <li>
                  <strong>Sellers:</strong> Want to list your AI agent? Check our{" "}
                  <Link href="/seller/new/step1">Seller Portal</Link>.
                </li>
                <li>
                  <strong>Custom Solutions:</strong> Looking for tailored AI? Check{" "}
                  <Link href="/custom-agents">Custom Agents</Link>.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Form Container */}
          <div className="ak-contact-form-wrapper">
            <ContactForm onSuccess={onSuccess} compact={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

const SECTION_CSS = `
.ak-contact-sec {
  width: 100%;
  box-sizing: border-box;
}

.ak-contact-sec-compact {
  padding: 0;
}

.ak-contact-container {
  width: 100%;
  margin: 0 auto;
}

.ak-contact-header {
  margin-bottom: 28px;
}

.ak-contact-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 10px;
}

.ak-contact-title {
  font-family: var(--font-red-hat), 'Red Hat Display', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.25;
}

.ak-contact-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.ak-contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 900px) {
  .ak-contact-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.ak-contact-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ak-info-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ak-info-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.ak-info-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ak-info-icon-box svg {
  width: 20px;
  height: 20px;
}

.ak-info-details {
  display: flex;
  flex-direction: column;
}

.ak-info-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}

.ak-info-sub {
  font-size: 12.5px;
  color: #64748b;
  margin: 0 0 4px;
}

.ak-info-link {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}

.ak-info-link:hover {
  text-decoration: underline;
}

.ak-info-highlight {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
}

.ak-info-text {
  font-size: 13px;
  color: #334155;
}

.ak-support-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  padding: 16px 20px;
  margin-top: 4px;
}

.ak-support-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.ak-support-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.ak-support-list a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.ak-support-list a:hover {
  text-decoration: underline;
}

.ak-contact-form-wrapper {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

@media (max-width: 640px) {
  .ak-contact-form-wrapper {
    padding: 18px;
  }
}
`;

const COMPACT_SECTION_CSS = `
.ak-contact-sec-compact {
  width: 100%;
  box-sizing: border-box;
}

.ak-modal-header {
  margin-bottom: 16px;
  padding-right: 44px;
}

.ak-contact-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
}

.ak-modal-title {
  font-family: var(--font-red-hat), 'Red Hat Display', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.3;
}

@media (min-width: 640px) {
  .ak-modal-title {
    font-size: 22px;
    line-height: 1.25;
  }
}

.ak-modal-subtitle {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

.ak-modal-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.ak-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 500;
  color: #334155;
  text-decoration: none;
  transition: all 0.2s;
}

.ak-chip-item:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.ak-modal-form-wrapper {
  background: #ffffff;
}

.ak-modal-form-wrapper .ak-contact-form-card {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
`;
