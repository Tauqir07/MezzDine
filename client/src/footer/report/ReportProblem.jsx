import { useState } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";
import "../Legal.css";

const CATEGORIES = [
  { value: "fraud",       label: "🚨 Fraud or Scam" },
  { value: "fake",        label: "🪪 Fake Listing or Profile" },
  { value: "harassment",  label: "😡 Harassment or Abuse" },
  { value: "food",        label: "🍽 Food Safety Issue" },
  { value: "payment",     label: "💸 Payment Problem" },
  { value: "privacy",     label: "🔒 Privacy Violation" },
  { value: "review",      label: "⭐ Fake Review" },
  { value: "technical",   label: "⚙️ Technical Bug" },
  { value: "other",       label: "📝 Other" },
];

export default function ReportProblem() {
  const [category,    setCategory]    = useState("");
  const [subject,     setSubject]     = useState("");
  const [description, setDescription] = useState("");
  const [email,       setEmail]       = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit() {
    if (!category)              return setError("Please select a category.");
    if (!subject.trim())        return setError("Please enter a subject.");
    if (description.trim().length < 30)
      return setError("Please provide more detail (at least 30 characters).");
    if (!email.trim() || !email.includes("@"))
      return setError("Please enter a valid email address.");

    setError("");
    setLoading(true);

    try {
      await api.post("/report", { category, subject, description, email });
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
          <div className="report-success-icon">✅</div>
          <h2>Report Submitted</h2>
          <p>
            Thank you for helping keep MeZzDiNe safe. We have received your report and will review it within <strong>48 hours</strong>.
          </p>
          <p>
            If your issue is urgent or involves immediate danger, please contact emergency services (112) or email us directly at{" "}
            <a href="mailto:mezzdine922@gmail.com">mezzdine922@gmail.com</a>.
          </p>
          <div className="report-success-links">
            <Link to="/" className="report-btn-home">← Back to Home</Link>
            <button className="report-btn-another" onClick={() => {
              setSubmitted(false);
              setCategory(""); setSubject(""); setDescription(""); setEmail("");
            }}>
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-page">

      <div className="legal-hero legal-hero--report">
        <div className="legal-hero-inner">
          <div className="legal-badge legal-badge--report">Support</div>
          <h1 className="legal-hero-title">Report a Problem</h1>
          <p className="legal-hero-sub">
            Help us keep the community safe. All reports are reviewed within 48 hours and treated with full confidentiality.
          </p>
        </div>
      </div>

      <div className="report-layout">

        {/* ── Left: info cards ── */}
        <aside className="report-sidebar">
          <div className="report-info-card">
            <span className="report-info-icon">⏱</span>
            <div>
              <strong>Response Time</strong>
              <p>We review all reports within 48 hours</p>
            </div>
          </div>
          <div className="report-info-card">
            <span className="report-info-icon">🔒</span>
            <div>
              <strong>Confidential</strong>
              <p>Your identity is never shared with the reported user</p>
            </div>
          </div>
          <div className="report-info-card">
            <span className="report-info-icon">⚡</span>
            <div>
              <strong>Urgent Issues</strong>
              <p>For immediate danger, call <strong>112</strong></p>
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
            <p className="report-links-title">Related Pages</p>
            <Link to="/safety">Safety Guidelines →</Link>
            <Link to="/community">Community Standards →</Link>
            <Link to="/terms">Terms & Conditions →</Link>
          </div>
        </aside>

        {/* ── Right: form ── */}
        <div className="report-form-wrapper">
          <div className="report-form-card">
            <h2 className="report-form-title">Submit a Report</h2>
            <p className="report-form-sub">Please be as specific as possible. Include usernames, listing names, or dates where relevant.</p>

            {/* Category */}
            <div className="report-field">
              <label className="report-label">What are you reporting? <span>*</span></label>
              <div className="report-category-grid">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`report-category-btn ${category === c.value ? "report-category-btn--active" : ""}`}
                    onClick={() => setCategory(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="report-field">
              <label className="report-label">Subject <span>*</span></label>
              <input
                type="text"
                className="report-input"
                placeholder="e.g. Kitchen owner not delivering meals"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="report-field">
              <label className="report-label">Describe the problem <span>*</span></label>
              <textarea
                className="report-textarea"
                placeholder="Please include: what happened, when it happened, who was involved (usernames or kitchen/room names), and any other relevant details..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
              />
              <span className="report-char-count">{description.length} characters</span>
            </div>

            {/* Email */}
            <div className="report-field">
              <label className="report-label">Your email address <span>*</span></label>
              <input
                type="email"
                className="report-input"
                placeholder="so we can follow up with you"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="report-error">{error}</div>
            )}

            <button
              className="report-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting…" : "Submit Report →"}
            </button>

            <p className="report-disclaimer">
              By submitting this form, you confirm that the information provided is accurate to the best of your knowledge. False reports may result in account action.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}