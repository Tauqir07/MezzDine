import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";
import { transporter } from "../utils/otpUtils.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { type, name, company, email, phone, message } = req.body;

  if (!name?.trim())                        throw new AppError("Name is required", 400);
  if (!email?.trim() || !email.includes("@")) throw new AppError("Valid email is required", 400);
  if (!message?.trim() || message.trim().length < 20)
    throw new AppError("Please provide more detail", 400);

  // Send email to admin
  try {
    await transporter.sendMail({
      from:    `"MeZzDiNe Contact" <${process.env.GMAIL_USER}>`,
      to:      process.env.GMAIL_USER,
      replyTo: email,
      subject: `[${type?.toUpperCase()}] New enquiry from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#c2692a">New Contact Enquiry</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#555;width:120px">Type</td><td style="padding:8px">${type}</td></tr>
            <tr style="background:#f9f9f7"><td style="padding:8px;font-weight:bold;color:#555">Name</td><td style="padding:8px">${name}</td></tr>
            ${company ? `<tr><td style="padding:8px;font-weight:bold;color:#555">Company</td><td style="padding:8px">${company}</td></tr>` : ""}
            <tr style="background:#f9f9f7"><td style="padding:8px;font-weight:bold;color:#555">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px;font-weight:bold;color:#555">Phone</td><td style="padding:8px">${phone}</td></tr>` : ""}
          </table>
          <h3 style="color:#333;margin-top:20px">Message</h3>
          <p style="background:#f5f5f3;padding:16px;border-radius:8px;line-height:1.6">${message}</p>
          <p style="color:#aaa;font-size:12px;margin-top:24px">Submitted via MeZzDiNe Contact Form</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("[Contact] Email failed:", mailErr.message);
    // Still respond success — don't block user
  }

  res.status(201).json({
    success: true,
    message: "Message received. We'll get back to you within 24–48 hours.",
  });
});