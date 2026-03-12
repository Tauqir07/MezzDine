import bcrypt       from "bcryptjs";
import jwt          from "jsonwebtoken";
import crypto       from "crypto";
import nodemailer   from "nodemailer";

import User         from "../models/user.js";
import Otp          from "../models/Otp.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";


console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_PASS length:", process.env.GMAIL_PASS?.length);

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateOtp      = () => String(crypto.randomInt(100000, 999999));
const generateOtpToken = () => crypto.randomBytes(32).toString("hex");

// ── Send OTP email ────────────────────────────────────────────────────────────

async function sendEmailOtp(email, otp, type = "register") {
  const isReset  = type === "reset";
  const subject  = isReset ? "Reset your MeZzDiNe password" : "Your MeZzDiNe verification code";
  const heading  = isReset ? "Reset your password" : "Verify your email";
  const bodyText = isReset
    ? "Use the code below to reset your password. It expires in <strong>10 minutes</strong>."
    : "Use the code below to complete your MeZzDiNe registration. It expires in <strong>10 minutes</strong>.";

  const transporter = nodemailer.createTransport({
  host:   "smtp.gmail.com",
  port:   587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

  await transporter.sendMail({
    from:    `"MeZzDiNe" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f7f3ee;border-radius:16px;">
        <h2 style="font-size:24px;color:#1c1a17;margin:0 0 8px;">${heading}</h2>
        <p style="color:#64748b;margin:0 0 28px;">${bodyText}</p>
        <div style="background:#fff;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:800;color:#c2692a;border:2px solid #fde8c8;">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register/send-otp
// Body: { name, email, password, role, phone }
// ─────────────────────────────────────────────────────────────────────────────

export const sendOtp = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;  // ← phone added

  // ── Validate phone ────────────────────────────────────────────────────────
  if (!phone?.trim()) throw new AppError("Phone number is required", 400);
  if (!/^\d{10}$/.test(phone.trim())) throw new AppError("Enter a valid 10-digit phone number", 400);

  // ── Check duplicate ───────────────────────────────────────────────────────
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email is already registered", 409);

  // ── Clear any old unverified OTPs for this email ──────────────────────────
  await Otp.deleteMany({ contact: email, verified: false });

  // ── Generate OTP + token, hash password ──────────────────────────────────
  const otp       = generateOtp();
  const otpToken  = generateOtpToken();
  const hashedPwd = await bcrypt.hash(password, 10);

  await Otp.create({
    contact:     email,
    method:      "email",
    otp,
    otpToken,
    pendingUser: { name, password: hashedPwd, role, phone: phone.trim() }, // ← phone stored
    expiresAt:   new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmailOtp(email, otp);

  res.status(200).json({
    success:  true,
    otpToken,
    message:  "Verification code sent to your email",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register/verify-otp
// Body: { email, otp, otpToken }
// ─────────────────────────────────────────────────────────────────────────────

export const verifyOtp = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  if (!otp || !otpToken) throw new AppError("OTP and token are required", 400);

  const record = await Otp.findOne({ otpToken });
  if (!record)         throw new AppError("Session expired. Please register again.", 400);
  if (record.verified) throw new AppError("OTP already used.", 400);

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError("OTP has expired. Please register again.", 400);
  }

  if (record.otp !== otp.trim()) throw new AppError("Incorrect OTP. Please try again.", 400);

  // ── Create user ───────────────────────────────────────────────────────────
  const { name, password, role, phone } = record.pendingUser; // ← phone destructured

  const user = await User.create({
    name,
    email:    record.contact,
    password,
    role,
    phone:    phone || "",   // ← phone saved to user
  });

  await Otp.deleteOne({ _id: record._id });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone,  // ← phone returned
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register/resend-otp
// Body: { otpToken }
// ─────────────────────────────────────────────────────────────────────────────

export const resendOtp = asyncHandler(async (req, res) => {
  const { otpToken } = req.body;

  const record = await Otp.findOne({ otpToken });
  if (!record) throw new AppError("Session not found. Please register again.", 400);

  const newOtp      = generateOtp();
  const newOtpToken = generateOtpToken();

  record.otp       = newOtp;
  record.otpToken  = newOtpToken;
  record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  record.verified  = false;
  await record.save();

  await sendEmailOtp(record.contact, newOtp);

  res.status(200).json({
    success:  true,
    otpToken: newOtpToken,
    message:  "Verification code resent",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new AppError("Email and password are required", 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid credentials", 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone || "",  // ← phone returned on login
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /auth/phone
// Body: { phone }
// Lets existing users (who registered before this field existed) add their number
// ─────────────────────────────────────────────────────────────────────────────

export const updatePhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone?.trim()) throw new AppError("Phone number is required", 400);
  if (!/^\d{10}$/.test(phone.trim())) throw new AppError("Enter a valid 10-digit phone number", 400);

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { phone: phone.trim() },
    { new: true }
  ).select("-password");

  res.json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /auth/location
// ─────────────────────────────────────────────────────────────────────────────

export const updateMyLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) throw new AppError("lat and lng are required", 400);

  await User.findByIdAndUpdate(req.user.id, {
    deliveryLocation: {
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      updatedAt: new Date(),
    },
  });

  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password/send-otp
// Body: { email }
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPasswordSendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new AppError("No account found with this email", 404);

  await Otp.deleteMany({ contact: email, method: "forgot-password" });

  const otp      = generateOtp();
  const otpToken = generateOtpToken();

  await Otp.create({
    contact:   email,
    method:    "forgot-password",
    otp,
    otpToken,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmailOtp(email, otp, "reset");

  res.status(200).json({
    success:  true,
    otpToken,
    message:  "Verification code sent to your email",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password/verify-otp
// Body: { email, otp, otpToken }
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPasswordVerifyOtp = asyncHandler(async (req, res) => {
  const { otp, otpToken } = req.body;

  if (!otp || !otpToken) throw new AppError("OTP and token are required", 400);

  const record = await Otp.findOne({ otpToken, method: "forgot-password" });
  if (!record)         throw new AppError("Session expired. Please try again.", 400);
  if (record.verified) throw new AppError("OTP already used.", 400);

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError("OTP has expired. Please try again.", 400);
  }

  if (record.otp !== otp.trim()) throw new AppError("Incorrect OTP. Please try again.", 400);

  const resetToken = generateOtpToken();
  record.verified  = true;
  record.otpToken  = resetToken;
  record.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await record.save();

  res.status(200).json({
    success:  true,
    otpToken: resetToken,
    message:  "OTP verified successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/forgot-password/reset
// Body: { email, otpToken, password }
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPasswordReset = asyncHandler(async (req, res) => {
  const { email, otpToken, password } = req.body;

  if (!email || !otpToken || !password) throw new AppError("All fields are required", 400);
  if (password.length < 6) throw new AppError("Password must be at least 6 characters", 400);

  const record = await Otp.findOne({
    contact:  email,
    otpToken,
    method:   "forgot-password",
    verified: true,
  });

  if (!record) throw new AppError("Invalid or expired reset session. Please try again.", 400);

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    throw new AppError("Reset session expired. Please request a new OTP.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate({ email }, { password: hashedPassword });
  await Otp.deleteOne({ _id: record._id });

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw new AppError("User not found", 404);

  // ── Update name ───────────────────────────────────────────────────────────
  if (name?.trim()) {
    user.name = name.trim();
  }

  // ── Update email ──────────────────────────────────────────────────────────
  if (email?.trim() && email !== user.email) {
    const emailTaken = await User.findOne({ email: email.trim() });
    if (emailTaken) throw new AppError("Email is already in use", 409);
    user.email = email.trim();
  }

  // ── Update password ───────────────────────────────────────────────────────
  if (newPassword) {
    if (!currentPassword) throw new AppError("Current password is required to set a new one", 400);
    if (newPassword.length < 6) throw new AppError("New password must be at least 6 characters", 400);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError("Current password is incorrect", 401);

    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  res.json({
    success: true,
    data: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      phone: user.phone || "",
    },
  });
});
