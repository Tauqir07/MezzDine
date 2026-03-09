const nodemailer = require("nodemailer");
const crypto     = require("crypto");

// ── Generate a secure 6-digit OTP ────────────────────────────────────────────

function generateOtp() {
  // crypto.randomInt gives a cryptographically secure random number
  return String(crypto.randomInt(100000, 999999));
}

// ── Generate a unique session token ──────────────────────────────────────────

function generateOtpToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── Nodemailer transporter (Gmail) ────────────────────────────────────────────
// Setup: https://myaccount.google.com/apppasswords
// Enable 2FA on your Gmail → generate an App Password → put it in .env

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,  // your gmail address
    pass: process.env.GMAIL_PASS,  // 16-char App Password (not your Gmail password)
  },
});

async function sendEmailOtp(email, otp) {
  const mailOptions = {
    from: `"StayFinder" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your StayFinder verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f7f3ee;border-radius:16px;">
        <h2 style="font-size:24px;color:#1c1a17;margin:0 0 8px;">Verify your email</h2>
        <p style="color:#64748b;margin:0 0 28px;">Use the code below to complete your StayFinder registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:800;color:#c2692a;border:2px solid #fde8c8;">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ── Fast2SMS (free tier, India) ───────────────────────────────────────────────
// Sign up: https://www.fast2sms.com
// Free credits on signup, no DLT needed for OTP route
// Get your API key from Dashboard → Dev API

async function sendSmsOtp(phone, otp) {
  const url = "https://www.fast2sms.com/dev/bulkV2";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route:     "otp",           // Fast2SMS OTP route (free)
      variables_values: otp,      // the OTP value
      flash:     0,
      numbers:   phone,           // 10-digit Indian phone number
    }),
  });

  const data = await response.json();

  if (!data.return) {
    throw new Error(data.message || "Failed to send SMS");
  }
}

module.exports = { generateOtp, generateOtpToken, sendEmailOtp, sendSmsOtp };