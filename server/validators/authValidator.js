import { body } from "express-validator";

// ── Register ──────────────────────────────────────────────────────────────────

export const registerValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .notEmpty()
    .withMessage("Role is required"),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{10}$/)
    .withMessage("Enter a valid 10-digit phone number"),
];

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ── OTP validators (commented out — uncomment when ready) ─────────────────────

// export const sendOtpValidator = [
//   body("name")
//     .notEmpty()
//     .withMessage("Name is required"),
//
//   body("email")
//     .notEmpty()
//     .withMessage("Email is required")
//     .isEmail()
//     .withMessage("Valid email is required"),
//
//   body("phone")
//     .notEmpty()
//     .withMessage("Phone number is required")
//     .matches(/^\d{10}$/)
//     .withMessage("Enter a valid 10-digit phone number"),
//
//   body("password")
//     .isLength({ min: 6 })
//     .withMessage("Password must be at least 6 characters"),
//
//   body("role")
//     .notEmpty()
//     .withMessage("Role is required"),
// ];

// export const verifyOtpValidator = [
//   body("otp")
//     .notEmpty()
//     .withMessage("OTP is required")
//     .isLength({ min: 6, max: 6 })
//     .withMessage("OTP must be exactly 6 digits")
//     .isNumeric()
//     .withMessage("OTP must contain only numbers"),
//
//   body("otpToken")
//     .notEmpty()
//     .withMessage("OTP token is required"),
// ];

// export const resendOtpValidator = [
//   body("otpToken")
//     .notEmpty()
//     .withMessage("OTP token is required"),
// ];

// ── Forgot password validators (commented out — uncomment when ready) ──────────

// export const forgotSendOtpValidator = [
//   body("email")
//     .isEmail()
//     .withMessage("Valid email is required"),
// ];

// export const forgotVerifyOtpValidator = [
//   body("otp")
//     .notEmpty()
//     .withMessage("OTP is required")
//     .isLength({ min: 6, max: 6 })
//     .withMessage("OTP must be exactly 6 digits")
//     .isNumeric()
//     .withMessage("OTP must contain only numbers"),
//
//   body("otpToken")
//     .notEmpty()
//     .withMessage("OTP token is required"),
// ];

// export const forgotResetValidator = [
//   body("email")
//     .isEmail()
//     .withMessage("Valid email is required"),
//
//   body("otpToken")
//     .notEmpty()
//     .withMessage("Reset token is required"),
//
//   body("password")
//     .isLength({ min: 6 })
//     .withMessage("Password must be at least 6 characters"),
// ];