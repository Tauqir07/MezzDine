import mongoose from "mongoose";

const roomRentalSchema = new mongoose.Schema({

  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },

  // ── tenantId is optional — owner may add tenant by name/phone only ──
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // store name + phone directly so it works without a user account
  tenantName:  { type: String, default: "" },
  tenantPhone: { type: String, default: "" },

  tenantType: {
    type: String,
    enum: ["bachelor_male", "bachelor_female", "family"],
    required: true,
  },

  familyMembers: {
    adults:   { type: Number, default: 2 },
    children: { type: Number, default: 0 },
  },

  monthlyRent: { type: Number, required: true },

  rentDueDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 28,
  },

  startDate: { type: Date, required: true },
  endDate:   { type: Date, default: null  },
  isActive:  { type: Boolean, default: true },

  payments: [
    {
      month:  { type: Number, required: true },
      year:   { type: Number, required: true },
      paidOn: { type: Date,   default: null  },
      isPaid: { type: Boolean, default: false },
      amount: { type: Number },
    }
  ],

  notes: { type: String, default: "" },

}, { timestamps: true });

export default mongoose.model("RoomRental", roomRentalSchema);