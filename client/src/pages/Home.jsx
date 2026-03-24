import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import "../styles/Home.css";

const FEATURES = [
  {
    icon: "🏠",
    title: "List Your Space",
    desc: "Room providers and kitchen owners create listings in minutes — with images, pricing and availability.",
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

export default function Home() {
  const { user, loading } = useAuth();
  const heroRef = useRef(null);

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
          <div className="hm-hero-badge">🚀 Just launched · ITER & Bhubaneswar colleges</div>

          <h1 className="hm-hero-title">
            Find your<br />
            <span className="hm-hero-accent">room & meals</span><br />
            near college.
          </h1>

          <p className="hm-hero-sub">
            MeZzDiNe is a new platform built for students around ITER and Bhubaneswar colleges —
            find verified rooms, subscribe to home kitchens, and manage everything in one place.
          </p>

          <div className="hm-hero-cta">
            <Link to="/rooms" className="hm-btn hm-btn--primary">
              Browse Rooms <span className="hm-btn-arrow">→</span>
            </Link>
            <Link to="/kitchens" className="hm-btn hm-btn--outline">
              Find a Kitchen
            </Link>
          </div>

          {/* Early access banner instead of fake stats */}
          <div className="hm-early-banner">
            <span className="hm-early-icon">🎉</span>
            <span color="black">
              We're just getting started — <strong>be among the first</strong> to list your space or subscribe to a kitchen in your area.
            </span>
          </div>
        </div>

        {/* floating cards */}
        <div className="hm-hero-cards">
          <div className="hm-float-card hm-float-card--1">
            <span className="hm-fc-icon">🍛</span>
            <div>
              <div className="hm-fc-title">Dal Tadka + Roti</div>
              <div className="hm-fc-sub">Lunch · Home Kitchen</div>
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
              <div className="hm-fc-title">Meal Paused</div>
              <div className="hm-fc-sub">Extended automatically</div>
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
            { n: "01", title: "Create your account", desc: "Sign up as a student, room provider, or kitchen owner. Takes under 2 minutes." },
            { n: "02", title: "Browse & connect",    desc: "Find rooms and kitchens near your college. Chat directly with owners — no middleman." },
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
          <p>Browse PGs, flats, and shared spaces near ITER and other Bhubaneswar colleges. Filter by budget and amenities.</p>
          <Link to="/rooms" className="hm-split-btn">Explore Rooms →</Link>
        </div>
        <div className="hm-split-divider">or</div>
        <div className="hm-split-card hm-split-card--kitchens">
          <div className="hm-split-icon">🍽</div>
          <h3>Need Home-cooked Meals?</h3>
          <p>Subscribe to local home kitchens near your college. Get breakfast, lunch or dinner daily. Pause anytime.</p>
          <Link to="/kitchens" className="hm-split-btn">Find Kitchens →</Link>
        </div>
      </section>

      {/* ── EARLY ADOPTER SECTION ── */}
      <section className="hm-early reveal">
        <div className="hm-early-inner">
          <div className="hm-section-tag">Why join now?</div>
          <h2 className="hm-section-title">Be part of something being built</h2>
          <div className="hm-early-grid">
            <div className="hm-early-card">
              <div className="hm-early-card-icon">🏆</div>
              <h3>First mover advantage</h3>
              <p>Kitchen owners and room providers who list early get maximum visibility when students start joining.</p>
            </div>
            <div className="hm-early-card">
              <div className="hm-early-card-icon">💬</div>
              <h3>Shape the product</h3>
              <p>Early users directly influence what we build next. Your feedback matters — we're listening.</p>
            </div>
            <div className="hm-early-card">
              <div className="hm-early-card-icon">🆓</div>
              <h3>Free to list, free to join</h3>
              <p>No listing fees, no hidden charges. We're focused on building trust and growing together first.</p>
            </div>
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
            <p className="hm-cta-sub">
              MeZzDiNe is launching around ITER and Bhubaneswar colleges — join early and help us grow.
            </p>
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