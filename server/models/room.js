import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true,
  },

  description: String,

  price: {
    type: Number,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  // ── location is lat/lng only — the old String field is removed ──
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  bedrooms:  { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  beds:      { type: Number, default: 0 },

  amenities: {
    type: [String],
    default: [],
  },

  propertyType:  String,
  hostLanguage:  String,

  isAvailable: {
    type: Boolean,
    default: true,
  },

  genderPreference: {
    type: String,
    enum: ["any", "male", "female", "family"],
    default: "any",
  },

  images: [
    {
      url:       String,
      public_id: String,
    },
  ],

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  listingType: {
    type: String,
    enum: ["owner", "roommate"],
    default: "owner",
  },

}, { timestamps: true });

export default mongoose.model("Room", roomSchema);