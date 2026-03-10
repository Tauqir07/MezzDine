import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Legal.css";


const SECTIONS = [
  { id: "intro",       title: "1. Our Community" },
  { id: "respect",     title: "2. Respect & Inclusion" },
  { id: "honesty",     title: "3. Honesty & Authenticity" },
  { id: "reviews",     title: "4. Reviews & Ratings" },
  { id: "chat",        title: "5. Chat & Communication" },
  { id: "listings",    title: "6. Listings & Profiles" },
  { id: "prohibited",  title: "7. Prohibited Behaviour" },
  { id: "enforcement", title: "8. Enforcement" },
  { id: "contact",     title: "9. Feedback" },
];

export default function CommunityStandards() {
  const [active, setActive] = useState("intro");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
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

      <div className="legal-hero legal-hero--community">
        <div className="legal-hero-inner">
          <div className="legal-badge legal-badge--community">Community</div>
          <h1 className="legal-hero-title">Community Standards</h1>
          <p className="legal-hero-sub">
            The principles that keep MeZzDiNe a safe, honest, and welcoming space for everyone.
          </p>
        </div>
      </div>

      <div className="legal-layout">

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

        <article className="legal-content">

          <section id="intro" className="legal-section">
            <h2>1. Our Community</h2>
            <p>
              MeZzDiNe is built on trust. Whether you are a student looking for an affordable room, a working professional seeking home-cooked meals, a kitchen owner sharing your cooking, or a room provider opening your space — you are part of a community that relies on each other's honesty, respect, and goodwill.
            </p>
            <p>
              These Community Standards define how we expect every member to behave. They apply to all users equally — customers, kitchen owners, and room providers alike.
            </p>
            <div className="community-values">
              <div className="community-value-card">
                <span>🤝</span>
                <strong>Respect</strong>
                <p>Treat every person on the platform with dignity</p>
              </div>
              <div className="community-value-card">
                <span>✅</span>
                <strong>Honesty</strong>
                <p>Be truthful in listings, reviews, and conversations</p>
              </div>
              <div className="community-value-card">
                <span>🛡️</span>
                <strong>Safety</strong>
                <p>Keep interactions safe and report anything concerning</p>
              </div>
              <div className="community-value-card">
                <span>🌍</span>
                <strong>Inclusion</strong>
                <p>Welcome everyone regardless of background</p>
              </div>
            </div>
          </section>

          <section id="respect" className="legal-section">
            <h2>2. Respect & Inclusion</h2>
            <p>
              MeZzDiNe is a diverse platform. Our users come from different states, backgrounds, religions, and walks of life. We require all members to treat one another with respect at all times.
            </p>
            <h3>What we expect</h3>
            <ul>
              <li>Treat other users courteously in all interactions — on chat, in reviews, and in person</li>
              <li>Accept and accommodate users regardless of their religion, caste, gender, nationality, age, or dietary preference</li>
              <li>Respond to enquiries in a timely and professional manner</li>
              <li>Respect other people's time — if you cannot fulfil a commitment, communicate promptly</li>
            </ul>
            <h3>What is not tolerated</h3>
            <ul>
              <li>Discrimination of any kind in listings, communication, or service delivery</li>
              <li>Refusing services to users based on their religion, caste, or background</li>
              <li>Using slurs, derogatory language, or hate speech of any kind</li>
              <li>Making users feel unwelcome or unsafe based on who they are</li>
            </ul>
          </section>

          <section id="honesty" className="legal-section">
            <h2>3. Honesty & Authenticity</h2>
            <p>
              The entire MeZzDiNe ecosystem depends on accurate information. Misrepresentation — whether in a listing, a review, or a profile — harms real people who are making important decisions about where to live and what to eat.
            </p>
            <ul>
              <li>Only list spaces and kitchens that you genuinely own, operate, or have the authority to list</li>
              <li>Use accurate, recent photos in listings — never use stock images or photos from other properties</li>
              <li>Price your listings honestly — hidden fees discovered after a transaction are a serious violation</li>
              <li>Do not create fake accounts or impersonate other users or MeZzDiNe staff</li>
              <li>Do not engage in fake reviews — whether writing fake positive reviews for yourself or fake negative reviews for competitors</li>
              <li>If your availability, pricing, or offerings change, update your listing promptly</li>
            </ul>
          </section>

          <section id="reviews" className="legal-section">
            <h2>4. Reviews & Ratings</h2>
            <p>
              Reviews are one of the most powerful trust-building tools on MeZzDiNe. We take review integrity seriously.
            </p>
            <h3>Writing reviews</h3>
            <ul>
              <li>Only review kitchens or rooms you have genuinely used or visited</li>
              <li>Be honest and specific — mention what was good and what could be improved</li>
              <li>Keep reviews factual and constructive — personal attacks on owners or customers are not allowed</li>
              <li>Do not include personal information (phone numbers, addresses) of others in reviews</li>
            </ul>
            <h3>Responding to reviews</h3>
            <ul>
              <li>Owners may respond to reviews professionally and constructively</li>
              <li>Do not pressure, threaten, or incentivise users to change or remove a negative review</li>
              <li>Do not offer refunds, discounts, or gifts in exchange for positive reviews</li>
            </ul>
            <div className="legal-note">
              <span className="legal-note-icon">ℹ️</span>
              <span>MeZzDiNe may remove reviews that violate these standards. Manipulating the review system may result in account suspension.</span>
            </div>
          </section>

          <section id="chat" className="legal-section">
            <h2>5. Chat & Communication</h2>
            <p>
              The MeZzDiNe chat system exists to help users coordinate and communicate about rooms and meals. It should be used professionally and respectfully.
            </p>
            <ul>
              <li>Use chat to ask relevant questions about listings, delivery, availability, and scheduling</li>
              <li>Do not send spam, promotional content, or unsolicited advertisements through chat</li>
              <li>Do not share personal financial information (bank account numbers, OTPs) in chat</li>
              <li>Do not use chat to negotiate off-platform transactions in order to avoid platform records</li>
              <li>Do not send threatening, abusive, sexually explicit, or otherwise inappropriate messages</li>
              <li>Respond to messages in a reasonable timeframe — leaving users waiting for days without reply is poor conduct</li>
            </ul>
          </section>

          <section id="listings" className="legal-section">
            <h2>6. Listings & Profiles</h2>
            <h3>Profile standards</h3>
            <ul>
              <li>Use your real name — pseudonyms that are clearly fictional reduce trust in the community</li>
              <li>Add a genuine profile photo if possible — it significantly increases trust for both customers and owners</li>
              <li>Keep your contact number updated so kitchen owners and room providers can reach you</li>
            </ul>
            <h3>Listing standards</h3>
            <ul>
              <li>Listing descriptions must accurately represent what you are offering</li>
              <li>Prices must be clearly stated — no hidden charges</li>
              <li>Remove or deactivate listings that are no longer available to prevent wasted enquiries</li>
              <li>Do not list the same space or kitchen multiple times to gain unfair visibility</li>
            </ul>
          </section>

          <section id="prohibited" className="legal-section">
            <h2>7. Prohibited Behaviour</h2>
            <p>The following are strictly prohibited and will result in immediate account suspension or permanent ban:</p>
            <div className="prohibited-grid">
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Fraud, scams, or financial deception of any kind</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Harassment, threats, or intimidation of other users</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Sharing or soliciting explicit content</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Discrimination based on religion, caste, gender, or nationality</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Creating fake accounts or impersonating others</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Manipulating reviews or ratings</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Attempting to hack, scrape, or disrupt the platform</span>
              </div>
              <div className="prohibited-item">
                <span>🚫</span>
                <span>Using the platform to facilitate illegal activities</span>
              </div>
            </div>
          </section>

          <section id="enforcement" className="legal-section">
            <h2>8. Enforcement</h2>
            <p>
              MeZzDiNe enforces these standards through a combination of user reports, automated detection, and manual review. When a violation is found, we may take one or more of the following actions depending on severity:
            </p>
            <ul>
              <li><strong>Warning</strong> — a formal notice sent to the user's email</li>
              <li><strong>Content removal</strong> — removal of the offending listing, review, or message</li>
              <li><strong>Temporary suspension</strong> — account access restricted for a defined period</li>
              <li><strong>Permanent ban</strong> — account permanently disabled with no right of appeal for serious violations</li>
            </ul>
            <p>
              Users who believe a moderation action was taken in error may appeal by emailing <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a> with "Appeal" in the subject line. We review all appeals within 7 business days.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>9. Feedback</h2>
            <p>
              These standards are a living document. If you feel something is missing, unclear, or needs updating, we welcome your feedback.
            </p>
            <div className="legal-contact-card">
              <div className="legal-contact-row">
                <span className="legal-contact-label">Email</span>
                <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a>
              </div>
              <div className="legal-contact-row">
                <span className="legal-contact-label">Report</span>
                <Link to="/report">Report a Problem</Link>
              </div>
            </div>
            <p className="legal-also">
              Also read our <Link to="/safety">Safety Guidelines</Link>, <Link to="/terms">Terms & Conditions</Link>, and <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}