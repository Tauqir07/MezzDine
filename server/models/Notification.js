import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // who receives this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // "subscription" | "announcement" | "pause" | "message"
    type: {
      type: String,
      enum: ["subscription", "unsubscription", "announcement", "pause", "message"],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // link the notification to a kitchen
    kitchenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
      default: null,
    },

    // for message notifications — links to the conversation
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },

    // extra structured data (e.g. refund estimate on unsubscription)
    meta: { type: mongoose.Schema.Types.Mixed, default: null },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);