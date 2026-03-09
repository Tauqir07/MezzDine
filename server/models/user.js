import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  phone:    { type: String, default: "" },   // ← ADDED
  role: {
    type: String,
    enum: ["user", "roomProvider", "kitchenOwner"]
  },
  deliveryLocation: {
    lat:       { type: Number, default: null },
    lng:       { type: Number, default: null },
    updatedAt: { type: Date,   default: null },
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;