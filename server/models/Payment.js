import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: "Kitchen", required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },

    // "YYYY-MM" — e.g. "2025-03". "advance" type uses the subscription start month.
    month: { type: String, required: true }, // YYYY-MM

    type: {
      type: String,
      enum: ["advance", "monthly"],
      required: true,
    },

    // Bill breakdown
    totalAmount:    { type: Number, required: true }, // full monthly price
    pauseDeduction: { type: Number, default: 0 },     // amount deducted for paused meals
    finalAmount:    { type: Number, required: true },  // totalAmount - pauseDeduction

    status: {
      type: String,
      enum: ["pending", "submitted", "paid","cancelled"],
      default: "pending",
    },

    // Customer fills these when paying
    utrNumber:   { type: String, default: "" },
    paymentNote: { type: String, default: "" },
    
    mealPlan:      { type: String },
    preferredMeal: { type: String },
    markedByOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Owner confirms
    markedByOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    paidAt:        { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique bill per user per kitchen per month per type
paymentSchema.index({ kitchenId: 1, userId: 1, month: 1, type: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;