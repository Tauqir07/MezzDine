import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Legal.css";

const SECTIONS = [
  { id: "intro",       title: "1. Introduction" },
  { id: "collect",     title: "2. Data We Collect" },
  { id: "how",         title: "3. How We Use Your Data" },
  { id: "sharing",     title: "4. Data Sharing" },
  { id: "storage",     title: "5. Data Storage & Security" },
  { id: "cookies",     title: "6. Cookies" },
  { id: "rights",      title: "7. Your Rights" },
  { id: "children",    title: "8. Children's Privacy" },
  { id: "thirdparty",  title: "9. Third-Party Services" },
  { id: "retention",   title: "10. Data Retention" },
  { id: "changes",     title: "11. Policy Changes" },
  { id: "contact",     title: "12. Contact Us" },
];

export default function PrivacyPolicy() {
  const [active, setActive] = useState("intro");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="legal-page">

      {/* ── Hero ── */}
      <div className="legal-hero legal-hero--privacy">
        <div className="legal-hero-inner">
          <div className="legal-badge">Legal</div>
          <h1 className="legal-hero-title">Privacy Policy</h1>
          <p className="legal-hero-sub">
            Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="legal-layout">

        {/* ── Sidebar TOC ── */}
        <aside className="legal-toc">
          <div className="legal-toc-inner">
            <p className="legal-toc-label">On this page</p>
            <nav>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`legal-toc-item ${active === s.id ? "legal-toc-item--active" : ""}`}
                  onClick={() => scrollTo(s.id)}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Content ── */}
        <article className="legal-content">

          <section id="intro" className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              MeZzDiNe ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our platform — including the website, mobile application, and all related services.
            </p>
            <p>
              By using MeZzDiNe, you agree to the collection and use of your information as described in this policy. If you disagree with any part of this policy, please discontinue use of the platform.
            </p>
            <div className="legal-note">
              <span className="legal-note-icon">🔒</span>
              <span>We do not sell your personal data to third parties. Ever.</span>
            </div>
          </section>

          <section id="collect" className="legal-section">
            <h2>2. Data We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account data</strong> — name, email address, phone number, password (hashed), and role (customer/owner)</li>
              <li><strong>Profile data</strong> — profile photo (if provided), delivery location</li>
              <li><strong>Listing data</strong> — kitchen name, address, images, meal pricing, UPI ID (kitchen owners only)</li>
              <li><strong>Room data</strong> — room descriptions, photos, pricing, availability (room providers only)</li>
              <li><strong>Payment data</strong> — UTR numbers submitted for payment verification (we do not store card details or bank account numbers)</li>
              <li><strong>Review & rating data</strong> — text reviews and star ratings you submit</li>
              <li><strong>Chat messages</strong> — messages exchanged between users on the platform</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage data</strong> — pages visited, features used, time spent, clicks, and navigation paths</li>
              <li><strong>Device data</strong> — browser type, operating system, screen resolution, and device identifiers</li>
              <li><strong>Location data</strong> — approximate location derived from IP address; precise location only if explicitly permitted by you</li>
              <li><strong>Log data</strong> — server logs including IP addresses, timestamps, and error reports</li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <ul>
              <li>Geocoding data from address input (via mapping services) to display map locations</li>
              <li>Image hosting metadata via Cloudinary for uploaded photos</li>
            </ul>
          </section>

          <section id="how" className="legal-section">
            <h2>3. How We Use Your Data</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Enable room browsing, kitchen subscriptions, and related transactions</li>
              <li>Calculate and display accurate billing based on your subscription and meal plan</li>
              <li>Send notifications about subscription status, payments, and platform updates</li>
              <li>Enable real-time messaging between users</li>
              <li>Display your delivery location to subscribed kitchen owners (with your permission)</li>
              <li>Improve the platform through usage analytics and feedback</li>
              <li>Detect and prevent fraud, abuse, and policy violations</li>
              <li>Respond to your support requests and enquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>
              We process your data on the legal basis of contract performance (to provide the service), legitimate interest (to improve the platform and prevent fraud), and consent (for optional features such as location sharing).
            </p>
          </section>

          <section id="sharing" className="legal-section">
            <h2>4. Data Sharing</h2>
            <h3>4.1 With Other Users</h3>
            <p>
              Certain information is visible to other users as part of normal platform operation:
            </p>
            <ul>
              <li>Your <strong>name</strong> is visible to kitchen owners you subscribe to, room providers you contact, and users who read your reviews</li>
              <li>Your <strong>phone number</strong> is visible to kitchen owners whose meal plans you subscribe to — to facilitate delivery coordination</li>
              <li>Your <strong>delivery location</strong> is shared with kitchen owners only if you have set it in your profile</li>
              <li>Kitchen owners' <strong>UPI IDs</strong> are shared with their subscribers for payment purposes</li>
            </ul>
            <h3>4.2 With Service Providers</h3>
            <p>
              We use trusted third-party services that process data on our behalf:
            </p>
            <ul>
              <li><strong>Cloudinary</strong> — image storage and delivery</li>
              <li><strong>MongoDB Atlas</strong> — database hosting</li>
              <li><strong>Geocoding APIs</strong> — converting addresses to map coordinates</li>
            </ul>
            <p>All service providers are contractually obligated to protect your data and use it only for the purpose of providing services to MeZzDiNe.</p>
            <h3>4.3 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or governmental authority, or if we believe disclosure is necessary to protect the rights, property, or safety of MeZzDiNe, our users, or the public.
            </p>
            <h3>4.4 We Never Sell Your Data</h3>
            <p>
              MeZzDiNe does not sell, rent, or trade your personal information to advertisers or data brokers under any circumstances.
            </p>
          </section>

          <section id="storage" className="legal-section">
            <h2>5. Data Storage & Security</h2>
            <p>
              Your data is stored on secure servers hosted via MongoDB Atlas. We implement industry-standard security measures including:
            </p>
            <ul>
              <li>Password hashing using bcrypt — passwords are never stored in plain text</li>
              <li>JWT-based authentication with expiration</li>
              <li>HTTPS encryption for all data in transit</li>
              <li>Role-based access control — users can only access data relevant to their role</li>
              <li>Regular security reviews and dependency updates</li>
            </ul>
            <p>
              While we take reasonable measures to protect your data, no system is completely secure. We cannot guarantee absolute security and encourage you to use strong, unique passwords and report any suspicious activity immediately.
            </p>
          </section>

          <section id="cookies" className="legal-section">
            <h2>6. Cookies</h2>
            <p>
              MeZzDiNe uses minimal cookies and browser storage to:
            </p>
            <ul>
              <li>Keep you logged in between sessions (authentication token stored in localStorage)</li>
              <li>Remember your preferences such as theme or last-viewed tab</li>
            </ul>
            <p>
              We do not use advertising cookies or third-party tracking cookies. You can clear browser storage at any time through your browser settings, which will log you out of the platform.
            </p>
          </section>

          <section id="rights" className="legal-section">
            <h2>7. Your Rights</h2>
            <p>Depending on your location and applicable law, you may have the following rights:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — update inaccurate or incomplete information via your profile settings</li>
              <li><strong>Deletion</strong> — request deletion of your account and associated data</li>
              <li><strong>Portability</strong> — request your data in a machine-readable format</li>
              <li><strong>Withdrawal of Consent</strong> — opt out of optional data processing such as location sharing</li>
              <li><strong>Objection</strong> — object to processing for direct marketing purposes</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a>. We will respond within 30 days. Note that some requests may be limited where we have a legitimate legal basis to retain the data.
            </p>
          </section>

          <section id="children" className="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>
              MeZzDiNe is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal data, we will delete it immediately.
            </p>
            <p>
              If you believe a minor has created an account on our platform, please contact us at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a>.
            </p>
          </section>

          <section id="thirdparty" className="legal-section">
            <h2>9. Third-Party Services</h2>
            <p>
              Our platform may contain links to external websites or integrate with third-party services (such as Google Maps for location display). These third parties have their own privacy policies, and we are not responsible for their practices.
            </p>
            <p>
              When you make a UPI payment, you are using your own banking application. MeZzDiNe does not process or have access to your banking credentials. Only the UTR reference number you choose to share with us is stored for payment verification.
            </p>
          </section>

          <section id="retention" className="legal-section">
            <h2>10. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services. Specifically:
            </p>
            <ul>
              <li><strong>Account data</strong> — retained until account deletion is requested</li>
              <li><strong>Payment records</strong> — retained for up to 3 years for financial record-keeping compliance</li>
              <li><strong>Chat messages</strong> — retained while both parties have active accounts; deleted 90 days after account deletion</li>
              <li><strong>Review data</strong> — retained until manually deleted by the user or removed by our moderation team</li>
              <li><strong>Log data</strong> — retained for up to 90 days for security and debugging purposes</li>
            </ul>
            <p>
              Upon account deletion, we will anonymize or delete your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section id="changes" className="legal-section">
            <h2>11. Policy Changes</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. When we make material changes, we will notify you via email or a prominent in-app notice at least 7 days before the changes take effect.
            </p>
            <p>
              The "Last updated" date at the top of this page reflects the date of the most recent revision. We encourage you to review this policy periodically.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests related to your privacy or this policy, please contact us:
            </p>
            <div className="legal-contact-card">
              <div className="legal-contact-row">
                <span className="legal-contact-label">Email</span>
                <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a>
              </div>
              <div className="legal-contact-row">
                <span className="legal-contact-label">Platform</span>
                <span>www.MeZzDiNe.com</span>
              </div>
              <div className="legal-contact-row">
                <span className="legal-contact-label">Response Time</span>
                <span>Within 30 days for data requests; 24–48 hours for general queries</span>
              </div>
            </div>
            <p className="legal-also">
              Also see our <Link to="/terms">Terms & Conditions</Link> and <Link to="/community">Community Standards</Link>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}