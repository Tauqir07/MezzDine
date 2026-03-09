// scripts/backfill.js
import mongoose from "mongoose";
import Kitchen from "../models/Kitchen.js";
import { geocodeAddress } from "../utils/geocode.js";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const kitchens = await Kitchen.find({
  $or: [{ "location.lat": null }, { location: { $exists: false } }]
});

console.log(`Found ${kitchens.length} kitchens to geocode`);

for (const k of kitchens) {
  const coords = await geocodeAddress(k.address);
  console.log(`${k.kitchenName} → ${coords ? `${coords.lat}, ${coords.lng}` : "FAILED"}`);
  if (coords) {
    k.location = coords;
    await k.save();
  }
  await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit
}

console.log("Done!");
await mongoose.disconnect();