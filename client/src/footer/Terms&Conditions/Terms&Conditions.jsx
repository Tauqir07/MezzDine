import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Legal.css";

const SECTIONS = [
  { id: "acceptance",    title: "1. Acceptance of Terms" },
  { id: "platform",      title: "2. About the Platform" },
  { id: "accounts",      title: "3. User Accounts" },
  { id: "rooms",         title: "4. Room Listings" },
  { id: "kitchens",      title: "5. Kitchen & Meal Subscriptions" },
  { id: "payments",      title: "6. Payments & Refunds" },
  { id: "conduct",       title: "7. User Conduct" },
  { id: "content",       title: "8. User Content" },
  { id: "liability",     title: "9. Limitation of Liability" },
  { id: "termination",   title: "10. Termination" },
  { id: "disputes",      title: "11. Disputes" },
  { id: "changes",       title: "12. Changes to Terms" },
  { id: "contact",       title: "13. Contact Us" },
];

export default function TermsAndConditions() {
  const [active, setActive] = useState("acceptance");

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
      <div className="legal-hero">
        <div className="legal-hero-inner">
          <div className="legal-badge">Legal</div>
          <h1 className="legal-hero-title">Terms & Conditions</h1>
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

          <section id="acceptance" className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using MeZzDiNe ("the Platform," "we," "us," or "our") — including our website, mobile application, and all associated services — you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use the platform.
            </p>
            <p>
              These terms apply to all visitors, users, room providers, kitchen owners, and subscribers. By creating an account or completing a transaction, you confirm that you are at least 18 years of age and have the legal capacity to enter into a binding agreement.
            </p>
          </section>

          <section id="platform" className="legal-section">
            <h2>2. About the Platform</h2>
            <p>
              MeZzDiNe is a marketplace platform that connects:
            </p>
            <ul>
              <li><strong>Room Providers</strong> — individuals or organizations listing accommodation spaces for rent.</li>
              <li><strong>Kitchen Owners</strong> — individuals or organizations offering meal subscription services from home or commercial kitchens.</li>
              <li><strong>Customers/Subscribers</strong> — individuals seeking rooms to rent or meal subscriptions.</li>
            </ul>
            <p>
              MeZzDiNe acts solely as a platform facilitator. We are not a party to any agreement between room providers, kitchen owners, and customers. We do not own, operate, or manage any rooms or kitchens listed on the platform.
            </p>
            <div className="legal-note">
              <span className="legal-note-icon">ℹ️</span>
              <span>MeZzDiNe does not guarantee the quality, safety, legality, or availability of any listing, meal, or accommodation. Users transact at their own discretion.</span>
            </div>
          </section>

          <section id="accounts" className="legal-section">
            <h2>3. User Accounts</h2>
            <h3>3.1 Registration</h3>
            <p>
              To use core features of MeZzDiNe, you must create an account using a valid email address and phone number. You agree to provide accurate, complete, and current information and to keep your account details up to date.
            </p>
            <h3>3.2 Account Security</h3>
            <p>
              You are solely responsible for maintaining the confidentiality of your login credentials. Any activity that occurs under your account is your responsibility. Notify us immediately at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a> if you suspect unauthorized access.
            </p>
            <h3>3.3 Account Types</h3>
            <p>
              MeZzDiNe supports three account roles: <strong>Customer</strong>, <strong>Owner</strong> (for room/kitchen providers), and <strong>Admin</strong>. Your role determines which features are accessible to you. You may not misrepresent your account type.
            </p>
            <h3>3.4 One Account Policy</h3>
            <p>
              Each person may maintain only one account. Creating multiple accounts to circumvent bans, limits, or review policies is strictly prohibited and may result in permanent suspension.
            </p>
          </section>

          <section id="rooms" className="legal-section">
            <h2>4. Room Listings</h2>
            <h3>4.1 Provider Responsibilities</h3>
            <p>
              Room providers are responsible for ensuring that all listing information is accurate, up to date, and not misleading. This includes pricing, availability, amenities, photos, and house rules. Providers must have the legal right to list and rent the space.
            </p>
            <h3>4.2 Booking & Agreements</h3>
            <p>
              All room agreements are directly between the provider and the customer. MeZzDiNe facilitates introductions only. Providers and customers are encouraged to formalize agreements in writing before any payment is made.
            </p>
            <h3>4.3 Prohibited Listings</h3>
            <p>
              The following types of listings are strictly prohibited:
            </p>
            <ul>
              <li>Spaces that violate local zoning, rental, or housing laws</li>
              <li>Listings with fraudulent photos or misleading descriptions</li>
              <li>Spaces that discriminate based on religion, caste, gender, or nationality</li>
              <li>Listings used to facilitate illegal activities</li>
            </ul>
          </section>

          <section id="kitchens" className="legal-section">
            <h2>5. Kitchen & Meal Subscriptions</h2>
            <h3>5.1 Kitchen Owner Responsibilities</h3>
            <p>
              Kitchen owners agree to maintain safe, hygienic food preparation environments in compliance with applicable local health and safety regulations. Meal plans, pricing, and schedules must be clearly and honestly communicated to subscribers.
            </p>
            <h3>5.2 Meal Plans</h3>
            <p>
              MeZzDiNe supports multiple meal plan types including 1-meal (breakfast, lunch, or dinner), 2-meal, and 3-meal per day subscriptions. Subscribers select their preferred plan and meal timing at the time of subscription.
            </p>
            <h3>5.3 Pause & Unsubscribe</h3>
            <p>
              Subscribers may pause individual meal days through the platform. Pauses are reflected in billing calculations. Unsubscription is allowed at any time, though refunds for the unused portion of a subscription are at the kitchen owner's sole discretion. MeZzDiNe does not guarantee refunds.
            </p>
            <h3>5.4 Food Safety Disclaimer</h3>
            <p>
              MeZzDiNe does not inspect or certify any kitchen. Subscribers assume all risk associated with consuming meals. If you have allergies or dietary restrictions, communicate directly with the kitchen owner before subscribing.
            </p>
          </section>

          <section id="payments" className="legal-section">
            <h2>6. Payments & Refunds</h2>
            <h3>6.1 Payment Method</h3>
            <p>
              MeZzDiNe currently facilitates payments via UPI. Subscribers scan a QR code or use a UPI ID to pay directly to the kitchen owner. After payment, subscribers submit their UTR (Unique Transaction Reference) number through the platform for verification.
            </p>
            <h3>6.2 Advance Payments</h3>
            <p>
              Subscriptions require an advance payment equal to one month's subscription fee before the subscription is activated. This advance serves as confirmation of intent and is applied toward the first billing period.
            </p>
            <h3>6.3 Monthly Billing</h3>
            <p>
              Monthly bills are calculated based on:
            </p>
            <ul>
              <li>Days consumed since subscription started (not the full calendar month)</li>
              <li>The subscriber's meal plan and rate per meal</li>
              <li>Deductions for verified paused days (past pauses only)</li>
            </ul>
            <h3>6.4 Refund Policy</h3>
            <p>
              MeZzDiNe is a marketplace and does not process refunds directly. Refund disputes must be resolved between the subscriber and kitchen owner. MeZzDiNe may assist in mediation but is not liable for any unpaid or disputed amounts.
            </p>
            <div className="legal-note legal-note--warn">
              <span className="legal-note-icon">⚠️</span>
              <span>Always verify the kitchen owner's UPI ID before making any payment. MeZzDiNe is not responsible for payments made to incorrect UPI accounts.</span>
            </div>
          </section>

          <section id="conduct" className="legal-section">
            <h2>7. User Conduct</h2>
            <p>All users of MeZzDiNe agree not to:</p>
            <ul>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Use the platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or platform systems</li>
              <li>Scrape, crawl, or systematically collect data from the platform</li>
              <li>Interfere with or disrupt the integrity or performance of the platform</li>
              <li>Post spam, promotional content, or unsolicited communications in chats or reviews</li>
              <li>Manipulate reviews or ratings through fake accounts or incentives</li>
            </ul>
            <p>
              Violations may result in immediate account suspension or permanent ban without prior notice.
            </p>
          </section>

          <section id="content" className="legal-section">
            <h2>8. User Content</h2>
            <h3>8.1 Ownership</h3>
            <p>
              You retain ownership of any content you post on MeZzDiNe, including photos, reviews, and descriptions. By posting content, you grant MeZzDiNe a non-exclusive, royalty-free, worldwide license to use, display, and distribute your content for the purpose of operating the platform.
            </p>
            <h3>8.2 Content Standards</h3>
            <p>
              All user-submitted content must be accurate and non-defamatory. You must not post content that infringes on any third party's intellectual property rights, contains personal information of others without consent, or violates any applicable law.
            </p>
            <h3>8.3 Removal</h3>
            <p>
              MeZzDiNe reserves the right to remove any content that violates these terms or that we, in our sole discretion, deem inappropriate — without prior notice.
            </p>
          </section>

          <section id="liability" className="legal-section">
            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, MeZzDiNe and its founders, employees, and affiliates shall not be liable for:
            </p>
            <ul>
              <li>Any indirect, incidental, or consequential damages arising from your use of the platform</li>
              <li>Loss of data, revenue, or profits resulting from service interruptions</li>
              <li>Damages arising from transactions between users, including disputes over rooms or meals</li>
              <li>Food-related illness or injury from meals consumed through kitchen subscriptions</li>
              <li>Physical damage or loss at listed properties</li>
            </ul>
            <p>
              Our total liability to you for any claim shall not exceed the amount you paid to MeZzDiNe (if any) in the three months preceding the claim.
            </p>
          </section>

          <section id="termination" className="legal-section">
            <h2>10. Termination</h2>
            <p>
              MeZzDiNe reserves the right to suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms or that we believe is harmful to other users, the platform, or third parties.
            </p>
            <p>
              You may delete your account at any time by contacting us at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a>. Upon deletion, your personal data will be handled in accordance with our <Link to="/privacy">Privacy Policy</Link>. Active subscriptions and outstanding payments remain the responsibility of the user even after account deletion.
            </p>
          </section>

          <section id="disputes" className="legal-section">
            <h2>11. Disputes</h2>
            <p>
              Any dispute between users (room providers, kitchen owners, and customers) is to be resolved directly between the parties involved. MeZzDiNe may provide mediation support but has no obligation to intervene.
            </p>
            <p>
              Any dispute with MeZzDiNe itself shall first be attempted to be resolved through direct communication. If unresolved, disputes shall be governed by the laws of India, with jurisdiction in the courts of the relevant state.
            </p>
          </section>

          <section id="changes" className="legal-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. When we make significant changes, we will notify users via email or an in-app notification. Your continued use of the platform after changes are posted constitutes your acceptance of the revised terms.
            </p>
            <p>
              We recommend checking this page periodically. The "Last updated" date at the top of this page indicates when the most recent revision was made.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>13. Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions, please reach out:</p>
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
                <span>24–48 hours</span>
              </div>
            </div>
            <p className="legal-also">
              Also see our <Link to="/privacy">Privacy Policy</Link> and <Link to="/community">Community Standards</Link>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}