import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },

  kitchen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kitchen"
  },

  // ── fix: was String, must be ObjectId ref for populate() to work ──────────
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  }

}, {
  timestamps: true
});

export default mongoose.model("Conversation", conversationSchema);