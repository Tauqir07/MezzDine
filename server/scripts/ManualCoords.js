// scripts/manualCoords.js
// Run: node scripts/manualCoords.js
// Manually sets coordinates for kitchens that couldn't be geocoded

import mongoose from "mongoose";
import Kitchen from "../models/Kitchen.js";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

// Jagmohan Nagar, near ITER College, Bhubaneswar, Odisha
const coords = { lat: 20.2961, lng: 85.8245 };

// Update ALL kitchens that still have null coordinates
const result = await Kitchen.updateMany(
  { "location.lat": null },
  { $set: { location: coords } }
);

console.log(`✓ Updated ${result.modifiedCount} kitchens`);
console.log(`  lat: ${coords.lat}, lng: ${coords.lng}`);
console.log("  (Jagmohan Nagar, near ITER College, Bhubaneswar)");

await mongoose.disconnect();