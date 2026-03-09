import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  contact: {
    type:     String,
    required: true,
  },
  method: {
  type:     String,
  enum:     ["email", "phone", "forgot-password"],
  required: true,
},
  otp: {
    type:     String,
    required: true,
  },
  otpToken: {
    type:     String,
    required: true,
    unique:   true,
  },
  pendingUser: {
    name:     String,
    password: String,
    role:     String,
  },
  verified: {
    type:    Boolean,
    default: false,
  },
  expiresAt: {
    type:     Date,
    required: true,
    index:    { expireAfterSeconds: 0 },
  },
});

export default mongoose.model("Otp", otpSchema);