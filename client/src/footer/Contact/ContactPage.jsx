import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../api/axios";
import "../Legal.css";
import "./Contact.css";

const INQUIRY_TYPES = [
  { value: "business",   label: "🤝 Business Collaboration" },
  { value: "affiliate",  label: "💰 Affiliate Program" },
  { value: "general",    label: "💬 General Enquiry" },
];

export default function ContactPage() {
  const [searchParams]  = useSearchParams();
  const defaultType     = searchParams.get("type") || "general";

  const [type,        setType]        = useState(defaultType);
  const [name,        setName]        = useState("");
  const [company,     setCompany]     = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [message,     setMessage]     = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit() {
    if (!name.trim())                        return setError("Please enter your name.");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email.");
    if (message.trim().length < 20)          return setError("Please write a bit more detail (at least 20 characters).");

    setError("");
    setLoading(true);

    try {
      await api.post("/contact", { type, name, company, email, phone, message });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="legal-page">
        <div className="report-success-page">
          <div className="report-success-icon">🎉</div>
          <h2>Message Sent!</h2>
          <p>
            Thanks for reaching out, <strong>{name}</strong>. We've received your enquiry and will get back to you at <strong>{email}</strong> within 24–48 hours.
          </p>
          <div className="report-success-links">
            <Link to="/" className="report-btn-home">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-page">

      <div className="legal-hero legal-hero--contact">
        <div className="legal-hero-inner">
          <div className="legal-badge legal-badge--contact">Contact</div>
          <h1 className="legal-hero-title">Get in Touch</h1>
          <p className="legal-hero-sub">
            Whether you want to collaborate, join our affiliate program, or just say hello — we'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="contact-layout">

        {/* ── Left info ── */}
        <aside className="contact-sidebar">

          <div className="contact-type-info">
            <div className={`contact-type-card ${type === "business" ? "active" : ""}`}
              onClick={() => setType("business")}>
              <span>🤝</span>
              <div>
                <strong>Business Collaboration</strong>
                <p>Bulk listings, integrations, partnerships</p>
              </div>
            </div>
            <div className={`contact-type-card ${type === "affiliate" ? "active" : ""}`}
              onClick={() => setType("affiliate")}>
              <span>💰</span>
              <div>
                <strong>Affiliate Program</strong>
                <p>Promote MeZzDiNe and earn commissions</p>
              </div>
            </div>
            <div className={`contact-type-card ${type === "general" ? "active" : ""}`}
              onClick={() => setType("general")}>
              <span>💬</span>
              <div>
                <strong>General Enquiry</strong>
                <p>Anything else on your mind</p>
              </div>
            </div>
          </div>

          <div className="report-info-card" style={{ marginTop: "12px" }}>
            <span className="report-info-icon">⏱</span>
            <div>
              <strong>Response Time</strong>
              <p>24–48 hours on business days</p>
            </div>
          </div>

          <div className="report-info-card report-info-card--email">
            <span className="report-info-icon">✉️</span>
            <div>
              <strong>Direct Email</strong>
              <a href="mailto:mezzdine922@gmail.com">mezzdine922@gmail.com</a>
            </div>
          </div>

          <div className="report-links-box">
            <p className="report-links-title">Related</p>
            <Link to="/report">Report a Problem →</Link>
            <Link to="/community">Community Standards →</Link>
          </div>

        </aside>

        {/* ── Form ── */}
        <div className="report-form-wrapper">
          <div className="report-form-card">

            <h2 className="report-form-title">
              {type === "business"  ? "🤝 Business Collaboration" :
               type === "affiliate" ? "💰 Affiliate Program" :
               "💬 General Enquiry"}
            </h2>
            <p className="report-form-sub">
              {type === "business"  ? "Tell us about your company and what kind of partnership you have in mind." :
               type === "affiliate" ? "Tell us about your audience and how you plan to promote MeZzDiNe." :
               "Ask us anything — we'll get back to you as soon as possible."}
            </p>

            {/* Inquiry type toggle */}
            <div className="report-field">
              <label className="report-label">Enquiry Type</label>
              <div className="report-category-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {INQUIRY_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`report-category-btn ${type === t.value ? "report-category-btn--active" : ""}`}
                    onClick={() => setType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name + Company */}
            <div className="contact-row">
              <div className="report-field" style={{ flex: 1 }}>
                <label className="report-label">Your Name <span>*</span></label>
                <input
                  type="text"
                  className="report-input"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="report-field" style={{ flex: 1 }}>
                <label className="report-label">Company / Brand</label>
                <input
                  type="text"
                  className="report-input"
                  placeholder="Optional"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="contact-row">
              <div className="report-field" style={{ flex: 1 }}>
                <label className="report-label">Email <span>*</span></label>
                <input
                  type="email"
                  className="report-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="report-field" style={{ flex: 1 }}>
                <label className="report-label">Phone</label>
                <input
                  type="tel"
                  className="report-input"
                  placeholder="Optional"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
            </div>

            {/* Message */}
            <div className="report-field">
              <label className="report-label">Message <span>*</span></label>
              <textarea
                className="report-textarea"
                placeholder={
                  type === "business"  ? "Tell us about your business, what you offer, and what kind of collaboration you're looking for..." :
                  type === "affiliate" ? "Tell us about your platform (blog, YouTube, Instagram, etc.), your audience size, and how you plan to promote MeZzDiNe..." :
                  "Write your message here..."
                }
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {error && <div className="report-error">{error}</div>}

            <button
              className="report-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending…" : "Send Message →"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}