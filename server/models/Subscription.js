import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  kitchenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kitchen",
    required: true,
  },

  mealPlan: {
    type: String,
    enum: ["one", "two", "three"],
    required: true,
  },
  preferredMeal: {
  type:    String,
  enum:    ["breakfast", "lunch", "dinner", null],
  default: null,
  // Only relevant when mealPlan === "one"
  // Tells the kitchen which meal to serve this subscriber
},

  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },

  isPaused: { type: Boolean, default: false },
  pausedAt: { type: Date,    default: null  },

  // ── NEW: which meals are paused + for how many days ──
  pausedMeals: {
    breakfast: { type: Boolean, default: false },
    lunch:     { type: Boolean, default: false },
    dinner:    { type: Boolean, default: false },
  },

  pauseDays: {
    type: Number,   // how many days the pause lasts (null = indefinite)
    default: null,
  },

  pauseEndsAt: {
    type: Date,     // auto-resume date (null = manual resume)
    default: null,
  },
  // ADD these fields to your Subscription schema:
breakfastCreditDays: { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);