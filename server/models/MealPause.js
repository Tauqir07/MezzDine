import mongoose from "mongoose";

const mealPauseSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    kitchenId: { type: mongoose.Schema.Types.ObjectId, ref: "Kitchen", required: true },

    // dates the user wants paused (stored as YYYY-MM-DD strings for easy lookup)
    dates: [{ type: String, required: true }],

    // which meals to pause on those dates — empty array means ALL meals
    meals: {
      type: [String],
      enum: ["breakfast", "lunch", "dinner"],
      default: [],
    },
  },
  { timestamps: true }
);

// one pause doc per user+kitchen (upserted on change)
mealPauseSchema.index({ userId: 1, kitchenId: 1 });

export default mongoose.model("MealPause", mealPauseSchema);