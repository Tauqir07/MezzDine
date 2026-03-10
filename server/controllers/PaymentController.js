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
  one:       1, // legacy: dinner only
  two:       2,
  three:     3,
};

// ── Meal cutoff times (24hr) ──────────────────────────────────────────────────
// Breakfast served:  before 6:00 AM cutoff
// Lunch served:      before 11:00 AM cutoff
// Dinner served:     before 6:00 PM cutoff
const CUT_BREAKFAST =  6; // subscribe before 6 AM  → get breakfast today
const CUT_LUNCH     = 11; // subscribe before 11 AM → get lunch today
const CUT_DINNER    = 18; // subscribe before 6 PM  → get dinner today, after → next day

// ── Helper: how many meals on the subscription START day based on signup time ─
// preferredMeal is only used when mealPlan === "one"
function mealsOnFirstDay(mealPlan, subscribeHour, preferredMeal) {
  if (mealPlan === "one") {
    // Use the customer's chosen meal time
    const meal = preferredMeal || "dinner"; // default to dinner if not set
    if (meal === "breakfast") return subscribeHour < CUT_BREAKFAST ? 1 : 0;
    if (meal === "lunch")     return subscribeHour < CUT_LUNCH     ? 1 : 0;
    if (meal === "dinner")    return subscribeHour < CUT_DINNER    ? 1 : 0;
  }
  if (mealPlan === "three") {
    if (subscribeHour < CUT_BREAKFAST) return 3; // all 3
    if (subscribeHour < CUT_LUNCH)     return 2; // lunch + dinner
    if (subscribeHour < CUT_DINNER)    return 1; // dinner only
    return 0;
  }
  if (mealPlan === "two") {
    if (subscribeHour < CUT_LUNCH)  return 2; // lunch + dinner
    if (subscribeHour < CUT_DINNER) return 1; // dinner only
    return 0;
  }
  return 0;
}

// ── Helper: price per meal ────────────────────────────────────────────────────
function pricePerMeal(kitchen, mealPlan) {
  const priceMap = {
    breakfast: kitchen.breakfastPrice,
    lunch:     kitchen.lunchPrice,
    dinner:    kitchen.dinnerPrice,
    one:       kitchen.dinnerPrice || kitchen.oneMealPrice, // legacy fallback
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

// ── Helper: get current YYYY-MM ───────────────────────────────────────────────
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Helper: how many paused meals in a given month (past dates only) ─────────
async function pausedMealsInMonth(userId, kitchenId, month, mealsPerDay) {
  const [year, mon] = month.split("-").map(Number);
  const start       = new Date(year, mon - 1, 1);
  const end         = new Date(year, mon, 0); // last day of month

  // Only count up to yesterday — upcoming pauses don't affect current bill
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff   = new Date(today.getTime() - 1); // end of yesterday

  const pause    = await MealPause.findOne({ userId, kitchenId });
  const dates    = pause?.dates || [];

  // Filter: must be within this month AND already happened (not today or future)
  const inMonth = dates.filter(d => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date >= start && date <= end && date < today;
  });

  return inMonth.length * mealsPerDay;
}

// ── Helper: count months with unpaid/pending bills ───────────────────────────
async function unpaidMonthsCount(userId, kitchenId) {
  const unpaid = await Payment.countDocuments({
    userId,
    kitchenId,
    status: { $in: ["pending", "submitted"] },
    type: "monthly",
  });
  return unpaid;
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /payments/bill/:kitchenId
   Returns the current month's bill for the logged-in customer
   Always charges only for days consumed so far (not full month)
───────────────────────────────────────────────────────────────────────────── */
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

  // ── Subscription start logic ─────────────────────────────────────────────
  const subStart        = new Date(sub.createdAt);
  const subMonth        = `${subStart.getFullYear()}-${String(subStart.getMonth() + 1).padStart(2, "0")}`;
  const isFirstSubMonth = subMonth === month;

  let mealsDelivered;
  let daysConsumed;

  if (isFirstSubMonth) {
    const startDay     = subStart.getDate();
    const subHour      = subStart.getHours(); // local hour of subscription

    // Meals on the actual subscription day (partial — depends on signup time)
    const firstDayMeals = mealsOnFirstDay(sub.mealPlan, subHour, sub.preferredMeal);

    // If they signed up after all cutoffs (e.g. 11pm), first day = 0 meals
    // so effectively their plan starts from next day
    const effectiveStartDay = firstDayMeals === 0 ? startDay + 1 : startDay;

    // Full days after the start day up to today
    const fullDaysAfter = Math.max(0, dayOfMonth - effectiveStartDay);

    daysConsumed  = Math.max(0, dayOfMonth - startDay + 1);
    mealsDelivered = firstDayMeals + (fullDaysAfter * mealsPerDay);
  } else {
    // Subscribed in a previous month — charge full days this month
    daysConsumed   = dayOfMonth;
    mealsDelivered = dayOfMonth * mealsPerDay;
  }

  mealsDelivered = Math.max(0, mealsDelivered);
  const pausedMeals    = await pausedMealsInMonth(req.user.id, kitchenId, month, mealsPerDay);
  const mealsCharged   = Math.max(0, mealsDelivered - pausedMeals);
  const pauseDeduct    = Math.round(pausedMeals * mealRate);

  const totalAmount = Math.round(mealsDelivered * mealRate);  // before pause deduction
  const finalAmount = Math.round(mealsCharged   * mealRate);  // actual due

  // Full month projection (reference only — shown as "monthly price")
  const projectedMonthly = Math.round(daysInMonth * mealsPerDay * mealRate);

  // Check if already has a payment record this month
  const existing = await Payment.findOne({
    userId: req.user.id, kitchenId, month, type: "monthly",
  });

  res.json({
    success: true,
    data: {
      month,
      mealPlan:          sub.mealPlan,
      monthlyPrice,                      // plan's flat price (for reference)
      projectedMonthly,                  // what full month would cost at daily rate
      daysConsumed,                      // days since subscription started
      daysInMonth,
      mealsDelivered,
      pausedMeals,
      pauseDeduction:    pauseDeduct,
      totalAmount,                       // mealsDelivered × rate (before pauses)
      finalAmount,                       // actual due = mealsCharged × rate
      status:            existing?.status || "not_generated",
      paymentId:         existing?._id   || null,
      upiId:             kitchen.upiId   || null,
      kitchenName:       kitchen.kitchenName,
    },
  });
});
/* ─────────────────────────────────────────────────────────────────────────────
   POST /payments/advance/:kitchenId
   Called right after subscribe — creates the advance payment record
   Customer then submits UTR via PATCH /payments/pay/:paymentId
───────────────────────────────────────────────────────────────────────────── */
export const createAdvancePayment = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  // mealPlan can come from body (pre-subscribe flow) or existing subscription
  const { mealPlan: mealPlanFromBody } = req.body;

  const [kitchen, sub] = await Promise.all([
    Kitchen.findById(kitchenId),
    Subscription.findOne({ userId: req.user.id, kitchenId }),
  ]);

  if (!kitchen) throw new AppError("Kitchen not found", 404);

  // Accept mealPlan from body when subscription doesn't exist yet (pay-first flow)
  const mealPlan = sub?.mealPlan || mealPlanFromBody;
  if (!mealPlan) throw new AppError("Meal plan required", 400);

  const month = currentMonth();

  // Idempotent — return existing record if already created
  const existing = await Payment.findOne({
    userId: req.user.id,
    kitchenId,
    month,
    type: "advance",
  });
  if (existing) return res.json({ success: true, data: existing });

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
    userId:      req.user.id,
    month,
    type:        "advance",
    totalAmount: amount,
    finalAmount: amount,
    status:      "pending",
  });

  res.status(201).json({ success: true, data: payment });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /payments/generate/:kitchenId
   Owner generates monthly bills for ALL subscribers at start of month
   Or customer can trigger their own bill generation
───────────────────────────────────────────────────────────────────────────── */
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
    // Skip if already generated
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

    // First month — deduct advance from bill
    const advancePaid = await Payment.findOne({
      userId: sub.userId, kitchenId, type: "advance", status: "paid",
    });

    // If this is effectively month 1 and advance was paid, adjust
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

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /payments/pay/:paymentId
   Customer submits UTR number — marks as "submitted" for owner to verify
───────────────────────────────────────────────────────────────────────────── */
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
   Owner confirms payment after verifying UTR
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

  res.json({ success: true, data: payment });
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /payments/my/:kitchenId
   Customer's full payment history for a kitchen
───────────────────────────────────────────────────────────────────────────── */
export const getMyPayments = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const payments = await Payment.find({
    userId: req.user.id,
    kitchenId,
  }).sort({ month: -1 });

  res.json({ success: true, data: payments });
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /payments/kitchen/:kitchenId
   Owner sees ALL subscribers' payment status with color coding
───────────────────────────────────────────────────────────────────────────── */
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

      // Color logic
      let paymentColor = "green";
      if      (unpaidMonths >= 4) paymentColor = "deepred";
      else if (unpaidMonths === 3) paymentColor = "red";
      else if (unpaidMonths >= 1) paymentColor = "yellow";

      // Latest payment record
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

/* ─────────────────────────────────────────────────────────────────────────────
   GET /payments/subscriber/:kitchenId/:userId
   Owner sees one subscriber's full payment history
───────────────────────────────────────────────────────────────────────────── */
export const getSubscriberPayments = asyncHandler(async (req, res) => {
  const { kitchenId, userId } = req.params;

  const kitchen = await Kitchen.findById(kitchenId).select("ownerId");
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (kitchen.ownerId.toString() !== req.user.id)
    throw new AppError("Not authorized", 403);

  const payments = await Payment.find({ kitchenId, userId }).sort({ month: -1 });

  res.json({ success: true, data: payments });
});