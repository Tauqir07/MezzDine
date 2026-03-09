import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Brand Section */}
        <div className="footer-section">
          <h2 className="logo">MeZzDiNe</h2>
          <p>
            A trusted marketplace connecting room providers and kitchen
            owners with people seeking reliable spaces.
          </p>
          <p className="website-link">
            🌐 www.MeZzDiNe.com
          </p>
        </div>

        {/* Partner Section */}
        <div className="footer-section">
          <h3>Partner With Us</h3>
          <p>List Your Room</p>
          <p>List Your Kitchen</p>
          <p>Business Collaboration</p>
          <p>Affiliate Program</p>
        </div>

        {/* Support Section */}
        <div className="footer-section">
          <h3>Support</h3>
          <p>Report a Problem</p>
          <p>Safety Guidelines</p>
          <p>Community Standards</p>
          <p>Terms & Conditions</p>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: tauqirakhtar07@email.com</p>
          <p>Response Time: 24–48 Hours</p>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} StayServe. All rights reserved.
      </div>

    </footer>
  );
}
