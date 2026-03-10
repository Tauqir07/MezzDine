import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../Legal.css";


const SECTIONS = [
  { id: "overview",      title: "1. Overview" },
  { id: "account",       title: "2. Account Safety" },
  { id: "rooms",         title: "3. Room Safety" },
  { id: "kitchens",      title: "4. Kitchen & Food Safety" },
  { id: "meetings",      title: "5. Meeting Providers" },
  { id: "payments",      title: "6. Payment Safety" },
  { id: "online",        title: "7. Online Safety" },
  { id: "emergency",     title: "8. Emergency Situations" },
  { id: "report",        title: "9. Reporting Issues" },
];

export default function SafetyGuidelines() {
  const [active, setActive] = useState("overview");

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

      <div className="legal-hero legal-hero--safety">
        <div className="legal-hero-inner">
          <div className="legal-badge legal-badge--safety">Safety</div>
          <h1 className="legal-hero-title">Safety Guidelines</h1>
          <p className="legal-hero-sub">
            Your safety is our priority. Please read these guidelines carefully before using MeZzDiNe.
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

          <section id="overview" className="legal-section">
            <h2>1. Overview</h2>
            <p>
              MeZzDiNe connects room seekers with providers and meal subscribers with kitchen owners. While we work hard to maintain a trustworthy community, your personal safety ultimately depends on the precautions you take. These guidelines are designed to help you stay safe at every step.
            </p>
            <div className="safety-alert">
              <span className="safety-alert-icon">🚨</span>
              <div>
                <strong>Always trust your instincts.</strong> If something feels wrong — a listing, a conversation, a person — step back, stop the transaction, and <Link to="/report">report it to us</Link>.
              </div>
            </div>
          </section>

          <section id="account" className="legal-section">
            <h2>2. Account Safety</h2>
            <ul>
              <li>Use a strong, unique password for your MeZzDiNe account — never reuse passwords from other services</li>
              <li>Never share your login credentials with anyone, including people claiming to be MeZzDiNe staff</li>
              <li>Enable a secure email address that only you have access to</li>
              <li>Log out of shared or public devices immediately after use</li>
              <li>If you suspect your account has been compromised, change your password immediately and contact us</li>
              <li>Be cautious of phishing emails or messages pretending to be from MeZzDiNe — we will never ask for your password via email or chat</li>
            </ul>
          </section>

          <section id="rooms" className="legal-section">
            <h2>3. Room Safety</h2>
            <h3>3.1 Before Booking</h3>
            <ul>
              <li>Review the provider's profile thoroughly — check how long they have been on the platform and read all available reviews</li>
              <li>Ask for additional photos if the listing images seem insufficient or inconsistent</li>
              <li>Verify the address using the map provided before committing to a visit</li>
              <li>Never pay outside the platform or via informal cash transfers without any written confirmation</li>
              <li>Ask about house rules, notice periods, and what utilities are included in writing before agreeing</li>
            </ul>
            <h3>3.2 Visiting a Room</h3>
            <ul>
              <li>Tell a friend or family member where you are going and share the address before visiting</li>
              <li>Visit during daylight hours for your first inspection</li>
              <li>Bring someone you trust along for the first visit if possible</li>
              <li>Do not hand over any payment or deposit at the time of the first visit unless you are fully satisfied</li>
              <li>Check that all locks, windows, and emergency exits are functional before moving in</li>
            </ul>
            <h3>3.3 During Your Stay</h3>
            <ul>
              <li>Get a written agreement or rental receipt for any payment made</li>
              <li>Document the condition of the room with photos on move-in day</li>
              <li>Keep emergency contact numbers (local police, ambulance) saved on your phone</li>
              <li>Report any concerns about the property or provider to us immediately</li>
            </ul>
          </section>

          <section id="kitchens" className="legal-section">
            <h2>4. Kitchen & Food Safety</h2>
            <h3>4.1 Before Subscribing</h3>
            <ul>
              <li>Read kitchen reviews carefully — pay attention to comments about hygiene and food quality</li>
              <li>Ask the kitchen owner about ingredients if you have any allergies or dietary restrictions before subscribing</li>
              <li>MeZzDiNe does not inspect or certify kitchens — you are responsible for assessing the kitchen's hygiene standards</li>
            </ul>
            <h3>4.2 Food Handling</h3>
            <ul>
              <li>If food arrives in damaged, open, or suspicious packaging — do not consume it</li>
              <li>Check that hot food is served hot and cold food is served cold</li>
              <li>If you experience food-related illness, seek medical attention immediately and report the incident to us</li>
              <li>Never consume food that smells off, looks discoloured, or appears spoiled — even if it was just delivered</li>
            </ul>
            <h3>4.3 For Kitchen Owners</h3>
            <ul>
              <li>Maintain a clean and hygienic cooking environment at all times</li>
              <li>Disclose all major allergens (nuts, dairy, gluten, etc.) in meal descriptions</li>
              <li>Ensure food is cooked to safe internal temperatures and properly stored</li>
              <li>Do not subscribe customers you cannot reliably serve — overcommitting leads to safety compromises</li>
            </ul>
          </section>

          <section id="meetings" className="legal-section">
            <h2>5. Meeting Providers or Customers</h2>
            <ul>
              <li>For first meetings, choose a public place — a café, community centre, or the building lobby — not a private residence</li>
              <li>Share your meeting details (time, location, name of person you're meeting) with someone you trust</li>
              <li>Keep initial communication on the MeZzDiNe platform where there is a record — avoid moving to personal messaging apps before establishing trust</li>
              <li>Be wary of anyone who pressures you to meet urgently or outside normal hours</li>
              <li>If you feel unsafe at any point during a meeting, leave immediately and contact us</li>
            </ul>
          </section>

          <section id="payments" className="legal-section">
            <h2>6. Payment Safety</h2>
            <div className="legal-note legal-note--warn">
              <span className="legal-note-icon">⚠️</span>
              <span>MeZzDiNe facilitates UPI payments. Always double-check the UPI ID shown on the platform before sending money. We cannot recover funds sent to incorrect accounts.</span>
            </div>
            <ul>
              <li>Only make payments through the UPI flow within the MeZzDiNe platform — never via WhatsApp, cash, or direct bank transfer without documentation</li>
              <li>Always save your UTR (transaction reference) number after payment as proof</li>
              <li>Be suspicious of anyone asking for payment in advance via gift cards, crypto, or unofficial channels — MeZzDiNe only uses UPI</li>
              <li>Never share your UPI PIN, OTP, or bank password with anyone — MeZzDiNe or any kitchen owner will never ask for this</li>
              <li>If you believe you have been scammed, report to us immediately and file a complaint with your bank</li>
            </ul>
          </section>

          <section id="online" className="legal-section">
            <h2>7. Online Safety</h2>
            <ul>
              <li>Do not share personally sensitive information (home address, daily schedule, workplace) until you have established genuine trust with the other party</li>
              <li>Be cautious of users who ask for personal contact details very early in a conversation</li>
              <li>Listings that seem too good to be true — unusually low prices, vague descriptions, pressure to act fast — are red flags</li>
              <li>Report any user who sends threatening, harassing, or inappropriate messages immediately using the in-chat report option</li>
              <li>MeZzDiNe staff will never ask you for money, passwords, or OTPs through the chat system</li>
            </ul>
          </section>

          <section id="emergency" className="legal-section">
            <h2>8. Emergency Situations</h2>
            <div className="safety-emergency-grid">
              <div className="safety-emergency-card">
                <span className="safety-emergency-icon">🚔</span>
                <strong>Police</strong>
                <span>100</span>
              </div>
              <div className="safety-emergency-card">
                <span className="safety-emergency-icon">🚑</span>
                <strong>Ambulance</strong>
                <span>108</span>
              </div>
              <div className="safety-emergency-card">
                <span className="safety-emergency-icon">🔥</span>
                <strong>Fire Brigade</strong>
                <span>101</span>
              </div>
              <div className="safety-emergency-card">
                <span className="safety-emergency-icon">📞</span>
                <strong>All Emergencies</strong>
                <span>112</span>
              </div>
            </div>
            <p style={{ marginTop: "20px" }}>
              If you are in immediate danger, contact emergency services first. Then, once you are safe, notify MeZzDiNe at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a> so we can take appropriate action on the platform.
            </p>
          </section>

          <section id="report" className="legal-section">
            <h2>9. Reporting Issues</h2>
            <p>
              If you encounter anything unsafe, suspicious, or that violates our guidelines, please report it immediately. The sooner we know, the faster we can act.
            </p>
            <ul>
              <li>Use the <Link to="/report">Report a Problem</Link> page for detailed incident reports</li>
              <li>Use the in-chat report button for messages or user behaviour</li>
              <li>Email us directly at <a href="mailto:tauqirakhtar07@gmail.com">tauqirakhtar07@gmail.com</a></li>
            </ul>
            <p>
              All reports are reviewed within 48 hours. We treat every safety report seriously and with confidentiality.
            </p>
            <p className="legal-also">
              Also read our <Link to="/community">Community Standards</Link> and <Link to="/terms">Terms & Conditions</Link>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}