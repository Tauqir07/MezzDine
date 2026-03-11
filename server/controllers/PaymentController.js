import Payment      from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import MealPause    from "../models/MealPause.js";
import Kitchen      from "../models/kitchen.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";

const MEALS_PER_PLAN = {
  breakfast: 1,
  lunch:     1,
  dinner:    1,
  one:       1,
  two:       2,
  three:     3,
};

const CUT_BREAKFAST =  6;
const CUT_LUNCH     = 11;
const CUT_DINNER    = 18;

function mealsOnFirstDay(mealPlan, subscribeHour, preferredMeal) {
  if (mealPlan === "one") {
    const meal = preferredMeal || "dinner";
    if (meal === "breakfast") return subscribeHour < CUT_BREAKFAST ? 1 : 0;
    if (meal === "lunch")     return subscribeHour < CUT_LUNCH     ? 1 : 0;
    if (meal === "dinner")    return subscribeHour < CUT_DINNER    ? 1 : 0;
  }
  if (mealPlan === "three") {
    if (subscribeHour < CUT_BREAKFAST) return 3;
    if (subscribeHour < CUT_LUNCH)     return 2;
    if (subscribeHour < CUT_DINNER)    return 1;
    return 0;
  }
  if (mealPlan === "two") {
    if (subscribeHour < CUT_LUNCH)  return 2;
    if (subscribeHour < CUT_DINNER) return 1;
    return 0;
  }
  return 0;
}

function pricePerMeal(kitchen, mealPlan) {
  const priceMap = {
    breakfast: kitchen.breakfastPrice,
    lunch:     kitchen.lunchPrice,
    dinner:    kitchen.dinnerPrice,
    one:       kitchen.dinnerPrice || kitchen.oneMealPrice,
    two:       kitchen.twoMealPrice,
    three:     kitchen.threeMealPrice,
  };
  const monthly      = priceMap[mealPlan] || 0;
  const mealsPerDay  = MEALS_PER_PLAN[mealPlan] || 1;
  const daysInMonth  = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  return monthly / (daysInMonth * mealsPerDay);
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function pausedMealsInMonth(userId, kitchenId, month, mealsPerDay) {
  const [year, mon] = month.split("-").map(Number);
  const start       = new Date(year, mon - 1, 1);
  const end         = new Date(year, mon, 0);

  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff   = new Date(today.getTime() - 1);

  const pause    = await MealPause.findOne({ userId, kitchenId });
  const dates    = pause?.dates || [];

  const inMonth = dates.filter(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date >= start && date <= end && date < today;
  });

  return inMonth.length * mealsPerDay;
}

async function unpaidMonthsCount(userId, kitchenId) {
  const unpaid = await Payment.countDocuments({
    userId,
    kitchenId,
    status: { $in: ["pending", "submitted"] },
    type: "monthly",
  });
  return unpaid;
}

export const getMyBill = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const [kitchen, sub] = await Promise.all([
    Kitchen.findById(kitchenId),
    Subscription.findOne({ userId: req.user.id, kitchenId }),
  ]);

  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (!sub)     throw new AppError("Subscription not found", 403);

  const month        = currentMonth();
  const mealsPerDay  = MEALS_PER_PLAN[sub.mealPlan] || 1;
  const priceMap     = {
    breakfast: kitchen.breakfastPrice,
    lunch:     kitchen.lunchPrice,
    dinner:    kitchen.dinnerPrice,
    one:       kitchen.dinnerPrice || kitchen.oneMealPrice,
    two:       kitchen.twoMealPrice,
    three:     kitchen.threeMealPrice,
  };
  const monthlyPrice = priceMap[sub.mealPlan] || 0;
  const mealRate     = pricePerMeal(kitchen, sub.mealPlan);

  const now         = new Date();
  const dayOfMonth  = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const subStart        = new Date(sub.createdAt);
  const subMonth        = `${subStart.getFullYear()}-${String(subStart.getMonth() + 1).padStart(2, "0")}`;
  const isFirstSubMonth = subMonth === month;

  let mealsDelivered;
  let daysConsumed;

  if (isFirstSubMonth) {
    const startDay      = subStart.getDate();
    const subHour       = subStart.getHours();
    const firstDayMeals = mealsOnFirstDay(sub.mealPlan, subHour, sub.preferredMeal);
    const effectiveStartDay = firstDayMeals === 0 ? startDay + 1 : startDay;
    const fullDaysAfter = Math.max(0, dayOfMonth - effectiveStartDay);
    daysConsumed   = Math.max(0, dayOfMonth - startDay + 1);
    mealsDelivered = firstDayMeals + (fullDaysAfter * mealsPerDay);
  } else {
    daysConsumed   = dayOfMonth;
    mealsDelivered = dayOfMonth * mealsPerDay;
  }

  mealsDelivered = Math.max(0, mealsDelivered);
  const pausedMeals    = await pausedMealsInMonth(req.user.id, kitchenId, month, mealsPerDay);
  const mealsCharged   = Math.max(0, mealsDelivered - pausedMeals);
  const pauseDeduct    = Math.round(pausedMeals * mealRate);
  const totalAmount    = Math.round(mealsDelivered * mealRate);
  const finalAmount    = Math.round(mealsCharged   * mealRate);
  const projectedMonthly = Math.round(daysInMonth * mealsPerDay * mealRate);

  const existing = await Payment.findOne({
    userId: req.user.id, kitchenId, month, type: "monthly",
  });

  res.json({
    success: true,
    data: {
      month,
      mealPlan:          sub.mealPlan,
      monthlyPrice,
      projectedMonthly,
      daysConsumed,
      daysInMonth,
      mealsDelivered,
      pausedMeals,
      pauseDeduction:    pauseDeduct,
      totalAmount,
      finalAmount,
      status:            existing?.status || "not_generated",
      paymentId:         existing?._id   || null,
      upiId:             kitchen.upiId   || null,
      kitchenName:       kitchen.kitchenName,
    },
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /payments/advance/:kitchenId
   CHANGE 1: saves mealPlan + preferredMeal so owner approval can create sub
───────────────────────────────────────────────────────────────────────────── */
export const createAdvancePayment = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { mealPlan: mealPlanFromBody, preferredMeal } = req.body; // ← added preferredMeal

  const [kitchen, sub] = await Promise.all([
    Kitchen.findById(kitchenId),
    Subscription.findOne({ userId: req.user.id, kitchenId }),
  ]);

  if (!kitchen) throw new AppError("Kitchen not found", 404);

  const mealPlan = sub?.mealPlan || mealPlanFromBody;
  if (!mealPlan) throw new AppError("Meal plan required", 400);

  const month = currentMonth();

  const existing = await Payment.findOne({
  userId: req.user.id,
  kitchenId,
  month,
  type: "advance",
});

if (existing) {
  if (existing.status === "paid") {
    existing.status      = "pending";
    existing.utrNumber   = "";
    existing.paymentNote = "";
    existing.mealPlan      = mealPlan;       // ← update with new plan
    existing.preferredMeal = preferredMeal || null;
     await existing.save();
}
  return res.json({ success: true, data: existing });
}

  const priceMap = {
    breakfast: kitchen.breakfastPrice,
    lunch:     kitchen.lunchPrice,
    dinner:    kitchen.dinnerPrice,
    one:       kitchen.dinnerPrice || kitchen.oneMealPrice,
    two:       kitchen.twoMealPrice,
    three:     kitchen.threeMealPrice,
  };

  const amount = priceMap[mealPlan] || 0;

  const payment = await Payment.create({
    kitchenId,
    userId:        req.user.id,
    month,
    type:          "advance",
    mealPlan,                             // ← CHANGE 1a: save mealPlan
    preferredMeal: preferredMeal || null, // ← CHANGE 1b: save preferredMeal
    totalAmount:   amount,
    finalAmount:   amount,
    status:        "pending",
  });

  res.status(201).json({ success: true, data: payment });
});

export const generateMonthlyBill = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const month         = currentMonth();

  const kitchen = await Kitchen.findById(kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const subs = await Subscription.find({ kitchenId });
  const priceMap = {
    breakfast: kitchen.breakfastPrice,
    lunch:     kitchen.lunchPrice,
    dinner:    kitchen.dinnerPrice,
    one:       kitchen.dinnerPrice || kitchen.oneMealPrice,
    two:       kitchen.twoMealPrice,
    three:     kitchen.threeMealPrice,
  };

  const results = [];

  for (const sub of subs) {
    const exists = await Payment.findOne({
      userId: sub.userId, kitchenId, month, type: "monthly",
    });
    if (exists) { results.push({ userId: sub.userId, status: "already_exists" }); continue; }

    const mealsPerDay  = MEALS_PER_PLAN[sub.mealPlan] || 1;
    const monthlyPrice = priceMap[sub.mealPlan] || 0;
    const pausedMeals  = await pausedMealsInMonth(sub.userId, kitchenId, month, mealsPerDay);
    const mealRate     = monthlyPrice / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() * mealsPerDay);
    const pauseDeduct  = Math.round(pausedMeals * mealRate);
    const finalAmount  = Math.max(0, monthlyPrice - pauseDeduct);

    const advancePaid = await Payment.findOne({
      userId: sub.userId, kitchenId, type: "advance", status: "paid",
    });

    const isFirstMonth = sub.createdAt &&
      `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, "0")}` === month;

    const adjustedFinal = isFirstMonth && advancePaid
      ? Math.max(0, finalAmount - advancePaid.finalAmount)
      : finalAmount;

    const payment = await Payment.create({
      kitchenId,
      userId:      sub.userId,
      month,
      type:        "monthly",
      totalAmount: monthlyPrice,
      pauseDeduction: pauseDeduct,
      finalAmount: adjustedFinal,
      status:      adjustedFinal === 0 ? "paid" : "pending",
      paidAt:      adjustedFinal === 0 ? new Date() : null,
    });

    results.push({ userId: sub.userId, status: "created", payment });
  }

  res.json({ success: true, generated: results.length, results });
});

export const submitPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { utrNumber, paymentNote } = req.body;

  if (!utrNumber?.trim()) throw new AppError("UTR number is required", 400);

  const payment = await Payment.findById(paymentId);
  if (!payment)                                    throw new AppError("Payment not found", 404);
  if (payment.userId.toString() !== req.user.id)  throw new AppError("Not authorized", 403);
  if (payment.status === "paid")                   throw new AppError("Already marked as paid", 400);

  payment.utrNumber   = utrNumber.trim();
  payment.paymentNote = paymentNote?.trim() || "";
  payment.status      = "submitted";
  await payment.save();

  res.json({ success: true, data: payment });
});

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /payments/mark-paid/:paymentId
   CHANGE 2: auto-creates subscription when owner approves an advance payment
───────────────────────────────────────────────────────────────────────────── */
export const markPaymentPaid = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate("kitchenId", "ownerId");
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.kitchenId.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  payment.status        = "paid";
  payment.paidAt        = new Date();
  payment.markedByOwner = req.user.id;
  await payment.save();

  // ── CHANGE 2: auto-create subscription on advance payment approval ──
  if (payment.type === "advance") {
    const existingSub = await Subscription.findOne({
      userId:    payment.userId,
      kitchenId: payment.kitchenId._id,
    });

    if (!existingSub) {
      const now     = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      await Subscription.create({
        userId:        payment.userId,
        kitchenId:     payment.kitchenId._id,
        mealPlan:      payment.mealPlan,
        preferredMeal: payment.preferredMeal || null,
        startDate:     now,
        endDate,
      });
    }
  }

  res.json({ success: true, data: payment });
});

/* ─────────────────────────────────────────────────────────────────────────────
   CHANGE 3: NEW — PATCH /payments/reject/:paymentId
   Owner rejects a submitted payment — resets so user can resubmit correct UTR
───────────────────────────────────────────────────────────────────────────── */
export const rejectPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate("kitchenId", "ownerId");
  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.kitchenId.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);
  if (payment.status === "paid")
  throw new AppError("Cannot reject an already paid payment", 400);

  payment.status      = "pending";
  payment.utrNumber   = "";
  payment.paymentNote = "";
  await payment.save();

  res.json({ success: true, data: payment });
});

/* ─────────────────────────────────────────────────────────────────────────────
   CHANGE 4: NEW — GET /payments/pending/:kitchenId
   Owner fetches all payments with status "submitted" awaiting their approval
───────────────────────────────────────────────────────────────────────────── */
export const getPendingPayments = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const pending = await Payment.find({ kitchenId, status: "submitted" })
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: pending });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const payments = await Payment.find({
    userId: req.user.id,
    kitchenId,
  }).sort({ month: -1 });

  res.json({ success: true, data: payments });
});

export const getKitchenPayments = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const subs = await Subscription.find({ kitchenId })
    .populate("userId", "name phone email");

  const result = await Promise.all(
    subs.map(async (sub) => {
      const unpaidMonths = await unpaidMonthsCount(sub.userId._id, kitchenId);

      let paymentColor = "green";
      if      (unpaidMonths >= 4)  paymentColor = "deepred";
      else if (unpaidMonths === 3) paymentColor = "red";
      else if (unpaidMonths >= 1)  paymentColor = "yellow";

      const latestPayment = await Payment.findOne({
        userId: sub.userId._id, kitchenId,
      }).sort({ createdAt: -1 });

      return {
        userId:       sub.userId._id,
        name:         sub.userId.name,
        phone:        sub.userId.phone,
        email:        sub.userId.email,
        mealPlan:     sub.mealPlan,
        unpaidMonths,
        paymentColor,
        latestPayment,
      };
    })
  );

  res.json({ success: true, data: result });
});

export const getSubscriberPayments = asyncHandler(async (req, res) => {
  const { kitchenId, userId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const payments = await Payment.find({ kitchenId, userId }).sort({ month: -1 });

  res.json({ success: true, data: payments });
});