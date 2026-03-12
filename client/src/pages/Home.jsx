import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import "../styles/Home.css";

const STATS = [
  { value: "500+", label: "Rooms Listed" },
  { value: "120+", label: "Kitchens Active" },
  { value: "2k+",  label: "Happy Users" },
  { value: "4.8★", label: "Avg Rating" },
];

const FEATURES = [
  {
    icon: "🏠",
    title: "List Your Space",
    desc: "Room providers and kitchen owners create verified listings in minutes — with images, pricing and availability.",
  },
  {
    icon: "🔒",
    title: "Secure & Verified",
    desc: "Role-based authentication and verified profiles ensure every interaction is safe and trustworthy.",
  },
  {
    icon: "💬",
    title: "Direct Chat",
    desc: "Message owners directly without sharing your phone number. Get answers fast, book faster.",
  },
  {
    icon: "📍",
    title: "Find Nearby",
    desc: "See rooms and kitchens on an interactive map. Know exactly where you're moving before you commit.",
  },
  {
    icon: "🍽",
    title: "Meal Subscriptions",
    desc: "Subscribe to home kitchens for daily meals. Pause, resume or switch plans anytime.",
  },
  {
    icon: "📊",
    title: "Owner Dashboard",
    desc: "Track subscribers, manage deliveries and monitor payments — all from one clean dashboard.",
  },
];

const TESTIMONIALS = [
  { name: "Arjun S.", role: "Student, Bhubaneswar", text: "Found a great room near my college and subscribed to a kitchen. Saves me ₹3000 a month easily.", avatar: "A" },
  { name: "Priya M.", role: "Kitchen Owner", text: "Managing 40 subscribers was chaos before. Now I can see who paused, who needs delivery — all in one place.", avatar: "P" },
  { name: "Ravi K.", role: "Room Provider", text: "Added my PG listing in 10 minutes. Got my first tenant within a week. No middleman fees.", avatar: "R" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add("visible");
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [user]);

  return (
    <div className="hm-page">

      {/* ── HERO ── */}
      <section className="hm-hero" ref={heroRef}>
        <div className="hm-hero-bg">
          <div className="hm-blob hm-blob-1" />
          <div className="hm-blob hm-blob-2" />
          <div className="hm-blob hm-blob-3" />
          <div className="hm-grid-overlay" />
        </div>

        <div className="hm-hero-inner">
          <div className="hm-hero-badge">🏡 Trusted by 2,000+ users in Odisha</div>

          <h1 className="hm-hero-title">
            Your next<br />
            <span className="hm-hero-accent">room & meal</span><br />
            starts here.
          </h1>

          <p className="hm-hero-sub">
            Browse verified rooms, connect with home kitchens, and manage everything in one place — no middlemen, no hassle.
          </p>

          <div className="hm-hero-cta">
            <Link to="/rooms" className="hm-btn hm-btn--primary">
              Browse Rooms <span className="hm-btn-arrow">→</span>
            </Link>
            <Link to="/kitchens" className="hm-btn hm-btn--outline">
              Find a Kitchen
            </Link>
          </div>

          {/* Stats */}
          <div className="hm-stats">
            {STATS.map((s, i) => (
              <div key={i} className="hm-stat">
                <div className="hm-stat-val">{s.value}</div>
                <div className="hm-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* floating cards */}
        <div className="hm-hero-cards">
          <div className="hm-float-card hm-float-card--1">
            <span className="hm-fc-icon">🍛</span>
            <div>
              <div className="hm-fc-title">Dal Tadka + Roti</div>
              <div className="hm-fc-sub">Lunch · Khan Mess</div>
            </div>
            <span className="hm-fc-badge">Serving Now</span>
          </div>
          <div className="hm-float-card hm-float-card--2">
            <span className="hm-fc-icon">🏠</span>
            <div>
              <div className="hm-fc-title">1 BHK near ITER</div>
              <div className="hm-fc-sub">₹6,500/mo · Available</div>
            </div>
          </div>
          <div className="hm-float-card hm-float-card--3">
            <span className="hm-fc-icon">✅</span>
            <div>
              <div className="hm-fc-title">Rent Paid</div>
              <div className="hm-fc-sub">June 2025 · On time</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="hm-how reveal">
        <div className="hm-section-tag">How it works</div>
        <h2 className="hm-section-title">Three steps to your new home</h2>

        <div className="hm-steps">
          {[
            { n: "01", title: "Create your account", desc: "Sign up as a renter, room provider, or kitchen owner. Takes under 2 minutes." },
            { n: "02", title: "Browse & connect",    desc: "Find rooms and kitchens near you. Chat directly with owners — no intermediary." },
            { n: "03", title: "Move in & eat well",  desc: "Book your room, subscribe to a meal plan, and manage everything from your dashboard." },
          ].map((s, i) => (
            <div key={i} className="hm-step">
              <div className="hm-step-num">{s.n}</div>
              <div className="hm-step-line" />
              <h3 className="hm-step-title">{s.title}</h3>
              <p className="hm-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="hm-features reveal">
        <div className="hm-section-tag">Features</div>
        <h2 className="hm-section-title">Everything you need, nothing you don't</h2>

        <div className="hm-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="hm-feature-card reveal" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="hm-feature-icon">{f.icon}</div>
              <h3 className="hm-feature-title">{f.title}</h3>
              <p className="hm-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPLIT SECTION ── */}
      <section className="hm-split reveal">
        <div className="hm-split-card hm-split-card--rooms">
          <div className="hm-split-icon">🏠</div>
          <h3>Looking for a Room?</h3>
          <p>Browse verified PGs, flats, and shared spaces. Filter by gender preference, amenities, and budget.</p>
          <Link to="/rooms" className="hm-split-btn">Explore Rooms →</Link>
        </div>
        <div className="hm-split-divider">or</div>
        <div className="hm-split-card hm-split-card--kitchens">
          <div className="hm-split-icon">🍽</div>
          <h3>Need Home-cooked Meals?</h3>
          <p>Subscribe to local home kitchens. Get breakfast, lunch or dinner delivered daily. Pause anytime.</p>
          <Link to="/kitchens" className="hm-split-btn">Find Kitchens →</Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="hm-testimonials reveal">
        <div className="hm-section-tag">Testimonials</div>
        <h2 className="hm-section-title">Loved by renters & owners</h2>

        <div className="hm-testimonial-wrap">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`hm-testimonial ${activeTestimonial === i ? "active" : ""}`}
            >
              <p className="hm-testimonial-text">"{t.text}"</p>
              <div className="hm-testimonial-author">
                <div className="hm-testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="hm-testimonial-name">{t.name}</div>
                  <div className="hm-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="hm-testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`hm-tdot ${activeTestimonial === i ? "active" : ""}`}
                onClick={() => setActiveTestimonial(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!loading && !user && (
        <section className="hm-cta">
          <div className="hm-cta-inner">
            <div className="hm-cta-blob" />
            <div className="hm-section-tag hm-section-tag--light">Get started today</div>
            <h2 className="hm-cta-title">Your perfect space is one click away</h2>
            <p className="hm-cta-sub">Join thousands of users already finding rooms and meals on our platform.</p>
            <div className="hm-cta-btns">
              <Link to="/register" className="hm-btn hm-btn--white">
                Create Free Account →
              </Link>
              <Link to="/login" className="hm-btn hm-btn--ghost">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}