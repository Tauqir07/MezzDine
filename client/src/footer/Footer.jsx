import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-glow" />

      <div className="footer-container">

        {/* ── Brand ── */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">MeZzDiNe</Link>
          <p className="footer-tagline">
            Connecting people with trusted rooms & home-cooked meals — one neighbourhood at a time.
          </p>
          <div className="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Twitter/X">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://wa.me/your-number" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.107 1.523 5.832L.057 23.854a.5.5 0 0 0 .608.608l6.054-1.461A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.001-1.366l-.36-.213-3.714.896.929-3.619-.234-.373A9.799 9.799 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
            </a>
          </div>
        </div>

        {/* ── Explore ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/rooms">Browse Rooms</Link></li>
            <li><Link to="/kitchens">Browse Kitchens</Link></li>
            <li><Link to="/dashboard">My Dashboard</Link></li>
            <li><Link to="/subscriptions/my">My Subscriptions</Link></li>
            <li><Link to="/chat">Messages</Link></li>
          </ul>
        </div>

        {/* ── Partner ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Partner With Us</h4>
          <ul className="footer-links">
            <li><Link to="/rooms/create">List Your Room</Link></li>
            <li><Link to="/kitchens/create">List Your Kitchen</Link></li>
            <li><Link to="/kitchens/my">My Kitchens</Link></li>
            <li><Link to="/contact?type=business">Business Collaboration</Link></li>
            <li><Link to="/contact?type=affiliate">Affiliate Program</Link></li>
          </ul>
        </div>

        {/* ── Support ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Support</h4>
          <ul className="footer-links">
            <li><Link to="/report">Report a Problem</Link></li>
            <li><Link to="/safety">Safety Guidelines</Link></li>
            <li><Link to="/community">Community Standards</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* ── Contact ── */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contact</h4>
          <ul className="footer-links footer-links--contact">
            <li>
              <a href="mailto:tauqirakhtar07@gmail.com">
                <span className="footer-contact-icon">✉️</span>
                mezzdine922@gmail.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/your-number" target="_blank" rel="noreferrer">
                <span className="footer-contact-icon">💬</span>
                WhatsApp Us
              </a>
            </li>
            <li>
              <span className="footer-contact-plain">
                <span className="footer-contact-icon">⏱</span>
                Response: 24–48 Hours
              </span>
            </li>
            <li>
              <span className="footer-contact-plain">
                <span className="footer-contact-icon">🌐</span>
                www.MeZzDiNe.com
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MeZzDiNe. All rights reserved.</span>
        <div className="footer-bottom-links">
          <Link to="/terms">Terms</Link>
          <span className="footer-dot">·</span>
          <Link to="/privacy">Privacy</Link>
          <span className="footer-dot">·</span>
          <Link to="/community">Community</Link>
        </div>
      </div>

    </footer>
  );
}