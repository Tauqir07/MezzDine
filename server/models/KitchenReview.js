import mongoose from "mongoose";

const kitchenReviewSchema = new mongoose.Schema(
  {
    kitchen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

// FIX: one review per user per kitchen — enforced at DB level
kitchenReviewSchema.index({ kitchen: 1, user: 1 }, { unique: true });

export default mongoose.model("KitchenReview", kitchenReviewSchema);