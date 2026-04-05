import bcrypt       from "bcryptjs";
import jwt          from "jsonwebtoken";
import crypto       from "crypto";
import User         from "../models/user.js";
import Otp          from "../models/Otp.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";
import SibApiV3Sdk from "sib-api-v3-sdk";


const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

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

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.to      = [{ email }];
  sendSmtpEmail.sender  = { name: "MeZzDiNe", email: process.env.BREVO_SENDER_EMAIL };
  sendSmtpEmail.htmlContent = `
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
  `;
  await brevoClient.sendTransacEmail(sendSmtpEmail);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { name, email, password, role, phone }
// ─────────────────────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!phone?.trim()) throw new AppError("Phone number is required", 400);
  if (!/^\d{10}$/.test(phone.trim())) throw new AppError("Enter a valid 10-digit phone number", 400);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email is already registered", 409);

  const hashedPwd = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPwd,
    role,
    phone: phone.trim(),
  });

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
        phone: user.phone,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OTP REGISTRATION FLOW
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/register/send-otp  →  Body: { name, email, password, role, phone }
export const sendOtp = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!phone?.trim()) throw new AppError("Phone number is required", 400);
  if (!/^\d{10}$/.test(phone.trim())) throw new AppError("Enter a valid 10-digit phone number", 400);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email is already registered", 409);

  await Otp.deleteMany({ contact: email, verified: false });

  const otp       = generateOtp();
  const otpToken  = generateOtpToken();
  const hashedPwd = await bcrypt.hash(password, 10);

  await Otp.create({
    contact:     email,
    method:      "email",
    otp,
    otpToken,
    pendingUser: { name, password: hashedPwd, role, phone: phone.trim() },
    expiresAt:   new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmailOtp(email, otp);

  res.status(200).json({
    success:  true,
    otpToken,
    message:  "Verification code sent to your email",
  });
});

// POST /auth/register/verify-otp  →  Body: { otp, otpToken }
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

  const { name, password, role, phone } = record.pendingUser;

  const user = await User.create({
    name,
    email:    record.contact,
    password,
    role,
    phone:    phone || "",
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    },
  });
});

// POST /auth/register/resend-otp  →  Body: { otpToken }
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
        phone: user.phone || "",
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
// FORGOT PASSWORD FLOW
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/forgot-password/send-otp  →  Body: { email }
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

// POST /auth/forgot-password/verify-otp
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

// POST /auth/forgot-password/reset
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

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /auth/profile
// ─────────────────────────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw new AppError("User not found", 404);

  if (name?.trim()) {
    user.name = name.trim();
  }

  if (email?.trim() && email !== user.email) {
    const emailTaken = await User.findOne({ email: email.trim() });
    if (emailTaken) throw new AppError("Email is already in use", 409);
    user.email = email.trim();
  }

  if (newPassword) {
    if (!currentPassword) throw new AppError("Current password is required to set a new one", 400);
    if (newPassword.length < 6) throw new AppError("New password must be at least 6 characters", 400);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError("Current password is incorrect", 401);

    await User.findByIdAndUpdate(req.user.id, { password: await bcrypt.hash(newPassword, 10) });
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