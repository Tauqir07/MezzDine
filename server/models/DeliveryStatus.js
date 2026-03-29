import mongoose from "mongoose";

// Tracks the delivery status for a kitchen on a given date.
// The owner updates it once per day; all subscribers see it.

const deliveryStatusSchema = new mongoose.Schema(
  {
    kitchenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
      required: true,
    },

    // date as YYYY-MM-DD string — one doc per kitchen per day
    date: {
      type: String,
      required: true,
    },

    // status flow: preparing → out_for_delivery → delivered
    status: {
      type: String,
      enum: ["preparing", "out_for_delivery", "delivered"],
      default: "preparing",
    },

    // optional note the owner can attach ("Lunch delayed by 30 min")
    note: {
      type: String,
      default: "",
    },

    // when the owner last updated the status
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// one doc per kitchen per day
deliveryStatusSchema.index({ kitchenId: 1, date: 1 }, { unique: true });

export default mongoose.model("DeliveryStatus", deliveryStatusSchema);