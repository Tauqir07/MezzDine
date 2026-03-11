import Notification from "../models/Notification.js";
import MealPause from "../models/MealPause.js";
import Subscription from "../models/Subscription.js";
import Kitchen from "../models/kitchen.js";
import User from "../models/user.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

// ── Meal credit config ──
const MEALS_PER_PLAN = { one: 1, two: 2, three: 3 };
const DAY_MS = 24 * 60 * 60 * 1000;

function extensionPerMeal(mealPlan) {
  const mealsPerDay = MEALS_PER_PLAN[mealPlan] || 3;
  return DAY_MS / mealsPerDay;
}

/* ─────────────────────────────────────────
   GET /notifications/my
───────────────────────────────────────── */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, data: { notifications, unreadCount } });
});

/* ─────────────────────────────────────────
   PATCH /notifications/mark-read
───────────────────────────────────────── */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipientId: req.user.id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true });
});

/* ─────────────────────────────────────────
   POST /notifications/announce/:kitchenId
───────────────────────────────────────── */
export const sendAnnouncement = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { message } = req.body;

  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);
  if (!message?.trim()) throw new AppError("Message is required", 400);

  const kitchen = await Kitchen.findById(kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const subscriptions = await Subscription.find({ kitchenId });
  if (subscriptions.length === 0)
    return res.json({ success: true, message: "No subscribers to notify", sent: 0 });

  const notifications = subscriptions.map((sub) => ({
    recipientId: sub.userId,
    type: "announcement",
    title: `📢 ${kitchen.kitchenName}`,
    message: message.trim(),
    kitchenId,
  }));

  await Notification.insertMany(notifications);
  res.json({ success: true, sent: notifications.length });
});

/* ─────────────────────────────────────────
   Meal timing configuration
───────────────────────────────────────── */
const MEAL_TIMES = {
  breakfast: { hour: 7,  minute: 0  },
  lunch:     { hour: 12, minute: 30 },
  dinner:    { hour: 21, minute: 0  },
};

const CUTOFF_HOURS = {
  breakfast: 0,
  lunch:     3,
  dinner:    3,
};

function isCutoffPassed(dateStr, meal) {
  const now      = new Date();
  const mealTime = MEAL_TIMES[meal];
  const cutoffMs = CUTOFF_HOURS[meal] * 60 * 60 * 1000;

  const [year, month, day] = dateStr.split("-").map(Number);
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  const mealUTC   = Date.UTC(year, month - 1, day) - IST_OFFSET_MS
                    + (mealTime.hour * 60 + mealTime.minute) * 60 * 1000;
  const cutoffUTC = mealUTC - cutoffMs;

  return now.getTime() >= cutoffUTC;
}

/* ─────────────────────────────────────────
   POST /notifications/pause/:kitchenId
───────────────────────────────────────── */
export const pauseMeals = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { dates, meals } = req.body;

  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);
  if (!dates?.length) throw new AppError("At least one date is required", 400);

  const sub = await Subscription.findOne({ userId: req.user.id, kitchenId });
  if (!sub) throw new AppError("You are not subscribed to this kitchen", 403);

  // ✅ Cap to the meals in their actual plan
  const mealsToCheck = meals?.length
    ? meals
    : ["breakfast", "lunch", "dinner"].slice(0, MEALS_PER_PLAN[sub.mealPlan] || 3);

  const rejected = [];
  for (const date of dates) {
    for (const meal of mealsToCheck) {
      if (isCutoffPassed(date, meal)) rejected.push({ date, meal });
    }
  }
  if (rejected.length) {
    const detail = rejected.map((r) => `${r.meal} on ${r.date}`).join(", ");
    throw new AppError(
      `Cutoff passed for: ${detail}. Breakfast before 07:00; lunch & dinner 3 hrs before.`,
      400
    );
  }

  const existing      = await MealPause.findOne({ userId: req.user.id, kitchenId });
  const existingDates = existing?.dates || [];
  const newDates      = dates.filter(d => !existingDates.includes(d));

  let pause;
  if (existing) {
    existing.dates = [...new Set([...existing.dates, ...dates])];
    existing.meals = meals || [];
    pause = await existing.save();
  } else {
    pause = await MealPause.create({ userId: req.user.id, kitchenId, dates, meals: meals || [] });
  }

  if (newDates.length > 0) {
    const msPerMeal   = extensionPerMeal(sub.mealPlan);
    const totalMeals  = mealsToCheck.length * newDates.length;
    const extensionMs = msPerMeal * totalMeals;
    await Subscription.findOneAndUpdate(
      { userId: req.user.id, kitchenId },
      { $set: { endDate: new Date(sub.endDate.getTime() + extensionMs) } }
    );
  }

  const [kitchen, user] = await Promise.all([
    Kitchen.findById(kitchenId).select("ownerId kitchenName"),
    User.findById(req.user.id).select("name phone"),
  ]);

  await Notification.create({
    recipientId: kitchen.ownerId,
    type: "pause",
    title: "🍽 Meal Pause Request",
    message: `${user.name} (${user.phone || "no phone"}) paused ${mealsToCheck.join(", ")} for ${dates.join(", ")}.`,
    kitchenId,
  });

  res.json({ success: true, data: pause });
});

/* ─────────────────────────────────────────
   DELETE /notifications/pause/:kitchenId
───────────────────────────────────────── */
export const resumeMeals = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { dates } = req.body;

  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);

  // ── Block removal after cutoff ──
  if (dates?.length) {
    const today  = new Date().toISOString().slice(0, 10);
    const locked = dates.filter(d => {
      if (d < today) return true;
      if (d > today) return false;
      return isCutoffPassed(d, "dinner");
    });
    if (locked.length) {
      throw new AppError(
        `Cannot remove pause for ${locked.join(", ")} — cutoff has already passed. Your subscription has been extended.`,
        400
      );
    }
  }

  // ── Reverse endDate extension ──
  if (dates?.length) {
    const sub         = await Subscription.findOne({ userId: req.user.id, kitchenId });
    const pauseRecord = await MealPause.findOne({ userId: req.user.id, kitchenId });

    const pausedMeals = pauseRecord?.meals?.length
      ? pauseRecord.meals
      : ["breakfast", "lunch", "dinner"].slice(0, MEALS_PER_PLAN[sub?.mealPlan] || 3);

    const msPerMeal   = extensionPerMeal(sub?.mealPlan);
    const totalMeals  = pausedMeals.length * dates.length;
    const reductionMs = msPerMeal * totalMeals;
    const newEnd      = new Date(sub.endDate.getTime() - reductionMs);

    await Subscription.findOneAndUpdate(
      { userId: req.user.id, kitchenId },
      { $set: { endDate: newEnd > new Date() ? newEnd : sub.endDate } }
    );
  }

  await MealPause.findOneAndUpdate(
    { userId: req.user.id, kitchenId },
    { $pullAll: { dates: dates || [] } },
    { new: true }
  );

  const [kitchen, user] = await Promise.all([
    Kitchen.findById(kitchenId).select("ownerId kitchenName"),
    User.findById(req.user.id).select("name phone"),
  ]);

  if (kitchen) {
    await Notification.create({
      recipientId: kitchen.ownerId,
      type:        "pause",
      title:       "✅ Meal Pause Cancelled",
      message:     `${user.name} (${user.phone || "no phone"}) resumed their meals for ${dates?.join(", ") || "a date"}.`,
      kitchenId,
    });
  }

  res.json({ success: true });
});

/* ─────────────────────────────────────────
   GET /notifications/pause/:kitchenId
───────────────────────────────────────── */
export const getMyPause = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);

  // Simply fetch — history kept until renewal, no auto-delete
  const pause = await MealPause.findOne({ userId: req.user.id, kitchenId });

  res.json({ success: true, data: pause || null });
});

/* ─────────────────────────────────────────
   GET /notifications/kitchen-pause/:kitchenId
   ✅ FIXED — owner AND subscribers can both read kitchen pauses
   Owner  → manages the list
   Customer → reads it to show "🍳 By Kitchen" in their pause history
───────────────────────────────────────── */
export const getKitchenPause = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId pausedDates");
  if (!kitchen) throw new AppError("Kitchen not found", 404);

  const isOwner = kitchen.ownerId.toString() === req.user.id;
  const isSub   = await Subscription.exists({ userId: req.user.id, kitchenId });

  if (!isOwner && !isSub)
    throw new AppError("Not authorized", 403);

  res.json({ success: true, data: { dates: kitchen.pausedDates || [] } });
});

/* ─────────────────────────────────────────
   POST /notifications/kitchen-pause/:kitchenId
───────────────────────────────────────── */
export const pauseKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { dates, meals } = req.body;

  if (!dates?.length) throw new AppError("At least one date is required", 400);

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId kitchenName pausedDates");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const mealsToCheck = meals?.length ? meals : ["breakfast", "lunch", "dinner"];

  const rejected = [];
  for (const date of dates) {
    for (const meal of mealsToCheck) {
      if (isCutoffPassed(date, meal)) rejected.push({ date, meal });
    }
  }
  if (rejected.length) {
    const detail = rejected.map((r) => `${r.meal} on ${r.date}`).join(", ");
    throw new AppError(
      `Cutoff passed for: ${detail}. Breakfast before 07:00; lunch & dinner 3 hrs before.`,
      400
    );
  }

  for (const date of dates) {
    const ex = kitchen.pausedDates.find(p => p.date === date);
    if (ex) { ex.meals = meals || []; }
    else    { kitchen.pausedDates.push({ date, meals: meals || [] }); }
  }
  await kitchen.save();

  const allSubs = await Subscription.find({ kitchenId });
  for (const sub of allSubs) {
    const msPerMeal   = extensionPerMeal(sub.mealPlan);
    const totalMeals  = mealsToCheck.length * dates.length;
    const extensionMs = msPerMeal * totalMeals;
    await Subscription.findByIdAndUpdate(sub._id, {
      $set: { endDate: new Date(sub.endDate.getTime() + extensionMs) }
    });
  }

  if (allSubs.length > 0) {
    const mealLabel = meals?.length ? meals.join(", ") : "all meals";
    const notifications = allSubs.map((sub) => ({
      recipientId: sub.userId,
      type:        "pause",
      title:       `⏸ ${kitchen.kitchenName} — No Service`,
      message:     `The kitchen has paused ${mealLabel} on ${dates.join(", ")}. Your subscription has been extended.`,
      kitchenId,
    }));
    await Notification.insertMany(notifications);
  }

  res.json({ success: true, data: { dates: kitchen.pausedDates } });
});

/* ─────────────────────────────────────────
   DELETE /notifications/kitchen-pause/:kitchenId
───────────────────────────────────────── */
export const resumeKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { dates } = req.body;

  if (!dates?.length) throw new AppError("At least one date is required", 400);

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId pausedDates");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const allSubs = await Subscription.find({ kitchenId });
  for (const sub of allSubs) {
    const closedMeals = kitchen.pausedDates
      .filter(p => dates.includes(p.date))
      .flatMap(p => p.meals?.length ? p.meals : ["breakfast", "lunch", "dinner"]);
    const uniqueMeals = [...new Set(closedMeals)];
    const msPerMeal   = extensionPerMeal(sub.mealPlan);
    const reductionMs = msPerMeal * uniqueMeals.length * dates.length;
    const newEnd      = new Date(sub.endDate.getTime() - reductionMs);
    await Subscription.findByIdAndUpdate(sub._id, {
      $set: { endDate: newEnd > new Date() ? newEnd : sub.endDate }
    });
  }

  kitchen.pausedDates = kitchen.pausedDates.filter(p => !dates.includes(p.date));
  await kitchen.save();

  res.json({ success: true, data: { dates: kitchen.pausedDates } });
});

/* ─────────────────────────────────────────
   DELETE /notifications/pause-history/:kitchenId
   Customer clears their OWN pause history after paying
───────────────────────────────────────── */
export const clearMyPauseHistory = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);

  await MealPause.findOneAndUpdate(
    { userId: req.user.id, kitchenId },
    { $set: { dates: [], meals: [] } }
  );

  res.json({ success: true, message: "Your pause history has been cleared." });
});

/* ─────────────────────────────────────────
   DELETE /notifications/pause-history/:kitchenId/user/:userId
   Kitchen owner clears a specific customer's pause history after receiving payment
───────────────────────────────────────── */
export const clearUserPauseHistory = asyncHandler(async (req, res) => {
  const { kitchenId, userId } = req.params;

  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);
  if (!userId)    throw new AppError("User ID is required", 400);

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  await MealPause.findOneAndUpdate(
    { userId, kitchenId },
    { $set: { dates: [], meals: [] } }
  );

  res.json({ success: true, message: "Customer pause history cleared after payment." });
});
/* ─────────────────────────────────────────
   GET /notifications/pause/:kitchenId/user/:userId
   Kitchen owner reads a specific customer's pause history
───────────────────────────────────────── */
export const getUserPauseForKitchen = asyncHandler(async (req, res) => {
  const { kitchenId, userId } = req.params;

  if (!kitchenId) throw new AppError("Kitchen ID is required", 400);
  if (!userId)    throw new AppError("User ID is required", 400);

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId pausedDates");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const customerPause = await MealPause.findOne({ userId, kitchenId });

  res.json({
    success: true,
    data: {
      customerDates: customerPause?.dates || [],
      customerMeals: customerPause?.meals || [],
      kitchenDates:  kitchen.pausedDates  || [],
    }
  });
});