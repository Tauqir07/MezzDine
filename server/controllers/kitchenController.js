import Kitchen      from "../models/kitchen.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";
import cloudinary   from "../config/cloudinary.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import { geocodeAddress } from "../utils/geocode.js";
import User from "../models/user.js";

export const createKitchen = asyncHandler(async (req, res) => {

  console.log("BODY:", req.body);

  const {
    kitchenName, description, address, foodType,
    halal, maxSubscribers,
    oneMealPrice, twoMealPrice, threeMealPrice,  // legacy / multi-meal
    breakfastPrice, lunchPrice, dinnerPrice,      // ← NEW specific plans
  } = req.body;

  if (!kitchenName || !address || !foodType || !maxSubscribers) {
    throw new AppError("Kitchen name, address, food type and capacity are required", 400);
  }

  const images = req.files
    ? req.files.map(file => ({ url: file.path, public_id: file.filename }))
    : [];

  const kitchen = await Kitchen.create({
    ownerId:            req.user.id,
    kitchenName, description, address, foodType,
    halal:              halal === "true",
    maxSubscribers:     Number(maxSubscribers),
    currentSubscribers: 0,
    oneMealPrice:       oneMealPrice   ? Number(oneMealPrice)   : undefined,
    twoMealPrice:       twoMealPrice   ? Number(twoMealPrice)   : undefined,
    threeMealPrice:     threeMealPrice ? Number(threeMealPrice) : undefined,
    breakfastPrice:     breakfastPrice ? Number(breakfastPrice) : undefined, // ← NEW
    lunchPrice:         lunchPrice     ? Number(lunchPrice)     : undefined, // ← NEW
    dinnerPrice:        dinnerPrice    ? Number(dinnerPrice)    : undefined, // ← NEW
    images,
  });

  // ── Auto-geocode address → lat/lng ──
  const coords = await geocodeAddress(address);
  if (coords) {
    kitchen.location = coords;
    await kitchen.save();
  }

  res.status(201).json({ success: true, data: kitchen });
});

export const getKitchens = asyncHandler(async (req, res) => {
  const kitchens = await Kitchen.find().lean();
  const counts = await Subscription.aggregate([
    { $group: { _id: "$kitchenId", count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[String(c._id)] = c.count; });
  const data = kitchens.map(k => ({
    ...k,
    currentSubscribers: countMap[String(k._id)] || 0,
  }));
  res.json({ success: true, data });
});

export const myKitchen = asyncHandler(async (req, res) => {
  const kitchens = await Kitchen.find({ ownerId: req.user.id }).lean();
  const counts = await Subscription.aggregate([
    { $group: { _id: "$kitchenId", count: { $sum: 1 } } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[String(c._id)] = c.count; });
  const data = kitchens.map(k => ({
    ...k,
    currentSubscribers: countMap[String(k._id)] || 0,
  }));
  res.json({ success: true, data });
});

export const getSingleKitchen = asyncHandler(async (req, res) => {
  const kitchen = await Kitchen.findById(req.params.kitchenId).lean();
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  const liveCount = await Subscription.countDocuments({ kitchenId: kitchen._id });
  res.json({ success: true, data: { ...kitchen, currentSubscribers: liveCount } });
});

export const updateKitchen = asyncHandler(async (req, res) => {

  const kitchen = await Kitchen.findById(req.params.kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);

  const {
    kitchenName, description, address, foodType,
    halal, maxSubscribers,
    oneMealPrice, twoMealPrice, threeMealPrice,
    breakfastPrice, lunchPrice, dinnerPrice,      // ← NEW
    upiId,
  } = req.body;

  if (kitchenName)         kitchen.kitchenName    = kitchenName;
  if (description)         kitchen.description    = description;
  if (foodType)            kitchen.foodType       = foodType;
  if (halal !== undefined) kitchen.halal          = halal === "true";
  if (maxSubscribers)      kitchen.maxSubscribers = Number(maxSubscribers);
  if (oneMealPrice)        kitchen.oneMealPrice   = Number(oneMealPrice);
  if (twoMealPrice)        kitchen.twoMealPrice   = Number(twoMealPrice);
  if (threeMealPrice)      kitchen.threeMealPrice = Number(threeMealPrice);
  if (breakfastPrice)      kitchen.breakfastPrice = Number(breakfastPrice); // ← NEW
  if (lunchPrice)          kitchen.lunchPrice     = Number(lunchPrice);     // ← NEW
  if (dinnerPrice)         kitchen.dinnerPrice    = Number(dinnerPrice);    // ← NEW
  if (upiId !== undefined) kitchen.upiId          = upiId.trim();

  // ── Re-geocode only if address changed ──
  if (address && address !== kitchen.address) {
    kitchen.address = address;
    const coords = await geocodeAddress(address);
    if (coords) kitchen.location = coords;
  }

  // Append new images — never replaces existing ones
  if (req.files && req.files.length > 0) {
    kitchen.images.push(
      ...req.files.map(file => ({ url: file.path, public_id: file.filename }))
    );
  }

  await kitchen.save();
  res.json({ success: true, data: kitchen });
});

export const deleteKitchenImage = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { public_id } = req.body;
  const kitchen = await Kitchen.findById(kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);
  await cloudinary.uploader.destroy(public_id);
  kitchen.images = kitchen.images.filter(img => img.public_id !== public_id);
  await kitchen.save();
  res.json({ success: true, message: "Image deleted" });
});

export const deleteKitchen = asyncHandler(async (req, res) => {
  const kitchen = await Kitchen.findById(req.params.kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);
  await kitchen.deleteOne();
  res.json({ success: true, message: "Kitchen deleted" });
});

export const subscribeKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { mealPlan, preferredMeal } = req.body;

  // preferredMeal required when mealPlan is "one"
  if (mealPlan === "one" && !["breakfast", "lunch", "dinner"].includes(preferredMeal)) {
    throw new AppError("Please select which meal you want (breakfast, lunch, or dinner)", 400);
  }

  const kitchen = await Kitchen.findById(kitchenId).populate("ownerId", "name");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  const liveCount = await Subscription.countDocuments({ kitchenId });
  if (liveCount >= kitchen.maxSubscribers) throw new AppError("Kitchen full", 400);

  const exists = await Subscription.findOne({ userId: req.user.id, kitchenId });
  if (exists) return res.status(409).json({ success: false, message: "Already subscribed" });

  const subscription = await Subscription.create({
    userId:        req.user.id,
    kitchenId,
    mealPlan,
    preferredMeal: mealPlan === "one" ? preferredMeal : null,
    startDate:     new Date(),
    endDate:       new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });

  kitchen.currentSubscribers += 1;
  await kitchen.save();

  const mealLabel = mealPlan === "one"
    ? `1 meal (${preferredMeal})`
    : `${mealPlan} meal plan`;

    const user = await User.findById(req.user.id).select("name phone");

  await Notification.create({
    recipientId: kitchen.ownerId._id,
    type:        "subscription",
    title:       "🎉 New Subscriber!",
     message:     `${user.name} (ph- ${user.phone || "N/A"}) subscribed to ${kitchen.kitchenName} (${mealLabel}).`,
    kitchenId,
  });

  res.status(201).json({ success: true, data: subscription });
});

export const unsubscribeKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const subscription = await Subscription.findOne({ userId: req.user.id, kitchenId })
    .populate("userId", "name");
  if (!subscription) throw new AppError("Subscription not found", 404);

  const kitchen = await Kitchen.findById(kitchenId).populate("ownerId", "name");
  if (!kitchen) throw new AppError("Kitchen not found", 404);

  // ── Calculate refund estimate ──────────────────────────────────────────
  const PRICE_KEY = {
    breakfast: "breakfastPrice",
    lunch:     "lunchPrice",
    dinner:    "dinnerPrice",
    one:       "dinnerPrice",   // legacy fallback → dinner price
    two:       "twoMealPrice",
    three:     "threeMealPrice",
  };
  const MEALS_PER = {
    breakfast: 1, lunch: 1, dinner: 1,
    one: 1, two: 2, three: 3,
  };

  const priceField  = PRICE_KEY[subscription.mealPlan] || "oneMealPrice";
  const monthlyPrice = (kitchen[priceField] || kitchen.oneMealPrice) || 0;
  const mealsPerDay  = MEALS_PER[subscription.mealPlan] || 1;

  const today       = new Date();
  const endOfMonth  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft    = Math.max(0, Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24)));
  const daysInMonth = endOfMonth.getDate();
  const dailyRate   = monthlyPrice / daysInMonth;
  const refundEst   = Math.round(dailyRate * daysLeft);
  const mealsLeft   = daysLeft * mealsPerDay;

  const subscriberName   = subscription.userId?.name || "A subscriber";
  const ownerRecipientId = kitchen.ownerId?._id ?? kitchen.ownerId;

  // ── Notify owner ───────────────────────────────────────────────────────
  try {
    await Notification.create({
      recipientId: ownerRecipientId,
      type:        "unsubscription",
      title:       "👋 Subscriber Left",
      message:     `${subscriberName} unsubscribed from ${kitchen.kitchenName}. `
                  + `They had ${daysLeft} days (${mealsLeft} meals) remaining this month. `
                  + (refundEst > 0
                      ? `Estimated refund: ₹${refundEst}. Contact them if you wish to settle.`
                      : "No refund amount outstanding."),
      kitchenId,
      meta: {
        subscriberName,
        mealPlan:  subscription.mealPlan,
        daysLeft,
        mealsLeft,
        refundEst,
      },
    });
  } catch (notifErr) {
    console.error("[unsubscribe] Notification create failed:", notifErr.message);
  }

  // ── Delete subscription and update count ───────────────────────────────
  await subscription.deleteOne();

  if (kitchen.currentSubscribers > 0) {
    kitchen.currentSubscribers -= 1;
    await kitchen.save();
  }

  res.json({ success: true, message: "Unsubscribed successfully" });
});

export const similarKitchens = asyncHandler(async (req, res) => {
  const kitchen = await Kitchen.findById(req.params.kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  const kitchens = await Kitchen.find({
    _id: { $ne: kitchen._id },
    foodType: kitchen.foodType,
  }).limit(4);
  res.json({ success: true, data: kitchens });
});

export const getSubscribersMap = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (String(kitchen.ownerId) !== String(req.user.id))
    throw new AppError("Not authorized", 403);

  const subscriptions = await Subscription.find({ kitchenId })
    .populate("userId", "name deliveryLocation");

  const data = subscriptions.map(sub => ({
    name:              sub.userId?.name || "Subscriber",
    mealPlan:          sub.mealPlan,
    lat:               sub.userId?.deliveryLocation?.lat  || null,
    lng:               sub.userId?.deliveryLocation?.lng  || null,
    locationUpdatedAt: sub.userId?.deliveryLocation?.updatedAt || null,
  }));

  res.json({ success: true, data });
});