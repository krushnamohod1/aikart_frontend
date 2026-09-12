"use client";

import { useState, useRef, useEffect } from "react";
import { API_BASE } from "@/lib/api-client/config";

interface FormValues {
  name: string;
  organizationName: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  organizationName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
  compact?: boolean;
}

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Seller & Agent Listing Support",
  "Custom AI Solutions & Enterprise",
  "Sandbox / Try Me Now Help",
  "Feedback & Bug Report",
  "Other",
];

export function ContactForm({ onSuccess, className = "", compact = false }: ContactFormProps) {
  const [values, setValues] = useState<FormValues>({
    name: "",
    organizationName: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const [topicOpen, setTopicOpen] = useState(false);
  const topicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(e.target as Node)) {
        setTopicOpen(false);
      }
    }
    if (topicOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [topicOpen]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string>("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!values.name.trim()) {
      newErrors.name = "Name is required";
    } else if (values.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!values.message.trim()) {
      newErrors.message = "Message is required";
    } else if (values.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage("");

    if (!validate()) {
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setServerMessage(data.message || "Your message has been sent successfully!");
        setValues({
          name: "",
          organizationName: "",
          email: "",
          subject: "General Inquiry",
          message: "",
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setStatus("error");
        setServerMessage(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Contact submission error:", err);
      setStatus("error");
      setServerMessage("A network error occurred. Please check your connection and try again.");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setServerMessage("");
    setErrors({});
  };

  return (
    <div className={`ak-contact-form-card ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: FORM_CSS }} />

      {status === "success" ? (
        <div className="ak-contact-success" role="alert">
          <div className="ak-contact-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 className="ak-success-title">Message Received!</h4>
          <p className="ak-success-desc">{serverMessage}</p>
          <button type="button" className="ak-btn-secondary" onClick={resetForm}>
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="ak-form">
          {status === "error" && (
            <div className="ak-contact-error-banner" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ak-err-icon">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{serverMessage}</span>
            </div>
          )}

          <div className="ak-form-grid">
            {/* Name Field */}
            <div className="ak-field-group">
              <label htmlFor="contact-name" className="ak-label">
                Your Name <span className="ak-required">*</span>
              </label>
              <div className="ak-input-wrapper">
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  disabled={status === "submitting"}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`ak-input ${errors.name ? "ak-input-error" : ""}`}
                  required
                />
              </div>
              {errors.name && (
                <p id="name-error" className="ak-error-text">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Organization Name Field (Optional) */}
            <div className="ak-field-group">
              <label htmlFor="contact-organization" className="ak-label">
                Organization Name
              </label>
              <div className="ak-input-wrapper">
                <input
                  type="text"
                  id="contact-organization"
                  name="organizationName"
                  value={values.organizationName}
                  onChange={handleChange}
                  placeholder="Enter your organization name"
                  disabled={status === "submitting"}
                  className="ak-input"
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="ak-field-group" style={{ marginTop: compact ? "12px" : "16px" }}>
            <label htmlFor="contact-email" className="ak-label">
              Email Address <span className="ak-required">*</span>
            </label>
            <div className="ak-input-wrapper">
              <input
                type="email"
                id="contact-email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="name@company.com"
                disabled={status === "submitting"}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`ak-input ${errors.email ? "ak-input-error" : ""}`}
                required
              />
            </div>
            {errors.email && (
              <p id="email-error" className="ak-error-text">
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject / Topic Custom Dropdown */}
          <div className="ak-field-group" style={{ marginTop: compact ? "12px" : "16px" }}>
            <label className="ak-label">
              Topic / Inquiry Subject
            </label>
            <div className="relative w-full" ref={topicDropdownRef}>
              <button
                type="button"
                onClick={() => setTopicOpen(!topicOpen)}
                disabled={status === "submitting"}
                className="border border-gray-200 rounded-lg px-4 py-3 w-full text-sm bg-white cursor-pointer flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 text-left transition-colors"
              >
                <span className="text-gray-900 font-normal">{values.subject || "General Inquiry"}</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${topicOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {topicOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 overflow-hidden animate-in fade-in duration-200 ease-out">
                  {SUBJECT_OPTIONS.map((opt) => {
                    const isSelected = values.subject === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => {
                          setValues((prev) => ({ ...prev, subject: opt }));
                          setTopicOpen(false);
                        }}
                        className="px-4 py-2.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer text-sm flex items-center justify-between transition-colors text-gray-700"
                      >
                        <span className={isSelected ? "font-medium text-blue-600" : "text-gray-700"}>
                          {opt}
                        </span>
                        {isSelected && (
                          <span className="text-blue-600 font-bold text-sm">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Message Field */}
          <div className="ak-field-group" style={{ marginTop: compact ? "12px" : "16px" }}>
            <div className="ak-label-row">
              <label htmlFor="contact-message" className="ak-label">
                Your Message <span className="ak-required">*</span>
              </label>
              <span className="ak-char-count">{values.message.length} / 5000</span>
            </div>
            <textarea
              id="contact-message"
              name="message"
              value={values.message}
              onChange={handleChange}
              rows={compact ? 3 : 5}
              placeholder="Tell us how we can help you..."
              disabled={status === "submitting"}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "msg-error" : undefined}
              className={`ak-textarea ${errors.message ? "ak-input-error" : ""}`}
              required
            />
            {errors.message && (
              <p id="msg-error" className="ak-error-text">
                {errors.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${status === "submitting" ? "ak-btn-loading" : ""}`}
          >
            {status === "submitting" ? (
              <>
                <span className="ak-spinner" aria-hidden="true" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

const FORM_CSS = `
.ak-contact-form-card {
  width: 100%;
  box-sizing: border-box;
}

.ak-form {
  display: flex;
  flex-direction: column;
}

.ak-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 640px) {
  .ak-form-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.ak-field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ak-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ak-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.ak-required {
  color: #ef4444;
}

.ak-char-count {
  font-size: 11.5px;
  color: #94a3b8;
}

.ak-input, .ak-select, .ak-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  font-family: var(--font-inter), 'Inter', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.ak-input:focus, .ak-select:focus, .ak-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.ak-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232563eb'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 18px;
  padding-right: 40px;
}

.ak-textarea {
  resize: vertical;
  min-height: 76px;
  line-height: 1.5;
}

.ak-input:hover, .ak-select:hover, .ak-textarea:hover {
  border-color: #94a3b8;
}

.ak-input:focus, .ak-select:focus, .ak-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.ak-input-error, .ak-input-error:focus {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12) !important;
}

.ak-error-text {
  font-size: 12.5px;
  color: #dc2626;
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ak-contact-error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.ak-err-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.ak-submit-btn {
  width: 100%;
  height: 48px;
  margin-top: 20px;
  border-radius: 12px;
  border: none;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.ak-submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
}

.ak-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ak-send-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}

.ak-submit-btn:hover .ak-send-icon {
  transform: translateX(3px) translateY(-2px);
}

.ak-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ak-spin 0.8s linear infinite;
}

@keyframes ak-spin {
  to { transform: rotate(360deg); }
}

.ak-contact-success {
  text-align: center;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ak-contact-success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.ak-contact-success-icon svg {
  width: 32px;
  height: 32px;
}

.ak-success-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.ak-success-desc {
  font-size: 14.5px;
  color: #475569;
  margin: 0 0 24px;
  max-width: 360px;
  line-height: 1.5;
}

.ak-btn-secondary {
  padding: 10px 24px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.ak-btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}
`;
