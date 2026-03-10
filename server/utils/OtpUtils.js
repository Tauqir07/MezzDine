import nodemailer from "nodemailer";
import crypto     from "crypto";

// ── Generate a secure 6-digit OTP ────────────────────────────────────────────
export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// ── Generate a unique session token ──────────────────────────────────────────
export function generateOtpToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── Nodemailer transporter (Gmail) ────────────────────────────────────────────
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Send OTP email ────────────────────────────────────────────────────────────
export async function sendEmailOtp(email, otp) {
  const mailOptions = {
    from: `"MeZzDiNe" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your MeZzDiNe verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f7f3ee;border-radius:16px;">
        <h2 style="font-size:24px;color:#1c1a17;margin:0 0 8px;">Verify your email</h2>
        <p style="color:#64748b;margin:0 0 28px;">Use the code below to complete your MeZzDiNe registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:800;color:#c2692a;border:2px solid #fde8c8;">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ── Send OTP via Fast2SMS ─────────────────────────────────────────────────────
export async function sendSmsOtp(phone, otp) {
  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route:            "otp",
      variables_values: otp,
      flash:            0,
      numbers:          phone,
    }),
  });

  const data = await response.json();
  if (!data.return) throw new Error(data.message || "Failed to send SMS");
}