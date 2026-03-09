// scripts/checkAddresses.js
// Run: node scripts/checkAddresses.js
// Shows what address is stored for each kitchen

import mongoose from "mongoose";
import Kitchen from "../models/Kitchen.js";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const kitchens = await Kitchen.find({}, "kitchenName address location");

kitchens.forEach(k => {
  console.log("─────────────────────────────");
  console.log("Name:     ", k.kitchenName);
  console.log("Address:  ", k.address);
  console.log("Location: ", k.location);
});

await mongoose.disconnect();