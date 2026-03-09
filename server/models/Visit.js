import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    visitorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    entityId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ["kitchen", "room"], required: true },
    date:       { type: String, required: true }, // YYYY-MM-DD
  },
  { timestamps: true }
);

// one visit per visitor per entity per day
visitSchema.index({ visitorId: 1, entityId: 1, date: 1 }, { unique: true });

export default mongoose.model("Visit", visitSchema);