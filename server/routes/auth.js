import express from "express";

import {
  register,
  login,
  getMe,
  updateMyLocation,
  updatePhone,
  // sendOtp,
  // verifyOtp,
  // resendOtp,
  // forgotPasswordSendOtp,
  // forgotPasswordVerifyOtp,
  // forgotPasswordReset,
  updateProfile,
} from "../controllers/authController.js";

import {
  loginValidator,
  registerValidator,
  // sendOtpValidator,
  // verifyOtpValidator,
  // resendOtpValidator,
  // forgotSendOtpValidator,
  // forgotVerifyOtpValidator,
  // forgotResetValidator,
} from "../validators/authValidator.js";

import validate  from "../middlewares/validate.js";
import { auth }  from "../middlewares/auth.js";

const router = express.Router();

// ── Protected ─────────────────────────────────────────────────────────────────
router.get  ("/me",       auth, getMe);
router.patch("/location", auth, updateMyLocation);
router.patch("/phone",    auth, updatePhone);
router.patch("/profile",  auth, updateProfile);

// ── Registration ──────────────────────────────────────────────────────────────
router.post("/register", registerValidator, validate, register);

// ── Registration (OTP flow — commented out, uncomment when ready) ─────────────
// router.post("/register/send-otp",   sendOtpValidator,   validate, sendOtp);
// router.post("/register/verify-otp", verifyOtpValidator, validate, verifyOtp);
// router.post("/register/resend-otp", resendOtpValidator, validate, resendOtp);

// ── Forgot password (commented out, uncomment when ready) ─────────────────────
// router.post("/forgot-password/send-otp",   forgotSendOtpValidator,   validate, forgotPasswordSendOtp);
// router.post("/forgot-password/verify-otp", forgotVerifyOtpValidator, validate, forgotPasswordVerifyOtp);
// router.post("/forgot-password/reset",      forgotResetValidator,     validate, forgotPasswordReset);

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", loginValidator, validate, login);

export default router;