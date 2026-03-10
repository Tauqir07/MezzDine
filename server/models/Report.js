import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["fraud", "fake", "harassment", "food", "payment", "privacy", "review", "technical", "other"],
    required: true,
  },
  subject:     { type: String, required: true },
  description: { type: String, required: true },
  email:       { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status:      { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
  adminNote:   { type: String, default: "" },
}, { timestamps: true });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;