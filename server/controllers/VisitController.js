import Visit from "../models/Visit.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";

/* ─────────────────────────────────────────
   POST /visits/:entityType/:entityId
───────────────────────────────────────── */
export const recordVisit = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { ownerId } = req.body;

  if (!["kitchen", "room"].includes(entityType))
    throw new AppError("Invalid entity type", 400);

  // don't count owner visiting their own page
  if (req.user.id === ownerId) {
    return res.json({ success: true, skipped: true });
  }

  const date = new Date().toISOString().slice(0, 10);

  await Visit.findOneAndUpdate(
    { visitorId: req.user.id, entityId, date },
    { visitorId: req.user.id, entityId, entityType, ownerId, date },
    { upsert: true, new: true }
  );

  res.json({ success: true });
});

/* ─────────────────────────────────────────
   GET /visits/:entityType/:entityId
───────────────────────────────────────── */
export const getVisits = asyncHandler(async (req, res) => {
  const { entityId } = req.params;

  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 29);
  const monthStr = monthAgo.toISOString().slice(0, 10);

  // aggregate daily counts for last 30 days
  const raw = await Visit.aggregate([
    {
      $match: {
        entityId: new mongoose.Types.ObjectId(entityId),
        date: { $gte: monthStr, $lte: todayStr },
      },
    },
    {
      $group: {
        _id:   "$date",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // build a full 30-day array filling in 0s for missing days
  const dataMap = {};
  raw.forEach(r => { dataMap[r._id] = r.count; });

  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily.push({
      date:  key,
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count: dataMap[key] || 0,
    });
  }

  const total  = daily.reduce((s, d) => s + d.count, 0);
  const today  = dataMap[todayStr] || 0;
  const week   = daily.slice(-7).reduce((s, d) => s + d.count, 0);

  res.json({ success: true, data: { daily, today, week, total } });
});