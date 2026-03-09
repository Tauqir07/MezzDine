// scripts/backfillRooms.js
// Run: node scripts/backfillRooms.js
// Geocodes all existing rooms that have no coordinates yet

import mongoose from "mongoose";
import Room from "../models/room.js";
import { geocodeAddress } from "../utils/geocode.js";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const rooms = await Room.find({
  $or: [{ "location.lat": null }, { "location.lat": { $exists: false } }]
});

console.log(`Found ${rooms.length} rooms to geocode`);

for (const r of rooms) {
  const coords = await geocodeAddress(r.address);
  console.log(`${r.title} | ${r.address} → ${coords ? `${coords.lat}, ${coords.lng}` : "FAILED"}`);
  if (coords) {
    r.location = coords;
    await r.save();
  }
  await new Promise(res => setTimeout(res, 1100)); // Nominatim rate limit: 1 req/sec
}

console.log("Done!");
await mongoose.disconnect();