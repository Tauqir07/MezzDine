import Subscription from "../models/Subscription.js";
import asyncHandler  from "../utils/asyncHandler.js";
import Menu          from "../models/KitchenMenu.js";
import Notification  from "../models/Notification.js";
import MealPause from "../models/MealPause.js";
// GET MY SUBSCRIPTIONS
export const getMySubscription = asyncHandler(async (req, res) => {
  const subs = await Subscription
    .find({ userId: req.user.id })
    .populate("kitchenId");

  if (!subs.length) return res.json({ success: true, data: [] });

  const result = await Promise.all(
    subs.map(async (sub) => {
      const menu = await Menu.findOne({ kitchenId: sub.kitchenId._id });
      return { subscription: sub, menu };
    })
  );

  res.json({ success: true, data: result });
});

// PAUSE SUBSCRIPTION
// Body: { meals: ["breakfast","lunch","dinner"], days: 3 }
// meals → which meals to pause (required)
// days  → how many days (optional — omit for indefinite)
export const pauseSubscription = asyncHandler(async (req, res) => {
  const { meals = [], days = null, kitchenId } = req.body;

  if (!meals.length)
    return res.status(400).json({ message: "Select at least one meal to pause" });

  const query = kitchenId
    ? { userId: req.user.id, kitchenId }
    : { userId: req.user.id };

  const sub = await Subscription.findOne(query);
  if (!sub) return res.status(404).json({ message: "No subscription found" });
  if (sub.isPaused) return res.status(400).json({ message: "Already paused" });

  sub.isPaused       = true;
  sub.pausedAt       = new Date();
  sub.pauseDays      = days ? Number(days) : null;
  sub.pauseEndsAt    = days ? new Date(Date.now() + Number(days) * 864e5) : null;
  sub.pausedMeals    = {
    breakfast: meals.includes("breakfast"),
    lunch:     meals.includes("lunch"),
    dinner:    meals.includes("dinner"),
  };

  await sub.save();

  // notify kitchen owner
  const kitchen = sub.kitchenId;
  if (kitchen) {
    const mealList = meals.join(", ");
    const dayText  = days ? `for ${days} day${days > 1 ? "s" : ""}` : "indefinitely";
    await Notification.create({
      recipientId: kitchen.ownerId || sub.kitchenId,
      type:        "pause",
      title:       "⏸ Subscriber paused meals",
      message:     `A subscriber paused ${mealList} ${dayText}.`,
      kitchenId:   sub.kitchenId,
    }).catch(() => {}); // don't fail if notification errors
  }

  res.json({ success: true, data: sub });
});

// RESUME SUBSCRIPTION
export const resumeSubscription = asyncHandler(async (req, res) => {
  const { kitchenId } = req.body;

  const query = kitchenId
    ? { userId: req.user.id, kitchenId }
    : { userId: req.user.id };

  const sub = await Subscription.findOne(query);
  if (!sub)          return res.status(404).json({ message: "No subscription found" });
  if (!sub.isPaused) return res.status(400).json({ message: "Subscription is not paused" });

  // extend endDate by the paused duration
  const pausedDuration = Date.now() - new Date(sub.pausedAt).getTime();
  sub.endDate    = new Date(sub.endDate.getTime() + pausedDuration);

  sub.isPaused    = false;
  sub.pausedAt    = null;
  sub.pauseDays   = null;
  sub.pauseEndsAt = null;
  sub.pausedMeals = { breakfast: false, lunch: false, dinner: false };

  await sub.save();

  res.json({ success: true, data: sub });
});

// GET KITCHEN SUBSCRIBERS (for owner dashboard)
// REPLACE getKitchenSubscribers with:
export const getKitchenSubscribers = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const [subscribers, pauses] = await Promise.all([
    Subscription.find({ kitchenId }).populate("userId", "name email phone"),
    MealPause.find({ kitchenId }),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const data = subscribers.map(sub => {
    const pause = pauses.find(p => String(p.userId) === String(sub.userId._id));
    const hasActivePause = pause?.dates?.some(d => d >= today) || false;

    return {
      ...sub.toObject(),
      isPaused:       sub.isPaused || hasActivePause,
      mealPauseRecord: pause || null,
    };
  });

  res.json({ success: true, data });
});