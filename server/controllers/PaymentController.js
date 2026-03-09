import Payment      from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import MealPause    from "../models/MealPause.js";
import Kitchen      from "../models/kitchen.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError     from "../utils/AppError.js";

const MEALS_PER_PLAN = { one: 1, two: 2, three: 3 };

// ── Helper: price per meal ────────────────────────────────────────────────────
function pricePerMeal(kitchen, mealPlan) {
  const priceMap = {
    one:   kitchen.oneMealPrice,
    two:   kitchen.twoMealPrice,
    three: kitchen.threeMealPrice,
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

// ── Helper: how many paused meals in a given month ────────────────────────────
async function pausedMealsInMonth(userId, kitchenId, month, mealsPerDay) {
  const [year, mon] = month.split("-").map(Number);
  const start       = new Date(year, mon - 1, 1);
  const end         = new Date(year, mon, 0); // last day of month

  const pause    = await MealPause.findOne({ userId, kitchenId });
  const dates    = pause?.dates || [];

  // Filter dates that fall within this month
  const inMonth = dates.filter(d => {
    const date = new Date(d);
    return date >= start && date <= end;
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
    one:   kitchen.oneMealPrice,
    two:   kitchen.twoMealPrice,
    three: kitchen.threeMealPrice,
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
   GET /payments/bill/:kitchenId
   Returns the current month's bill for the logged-in customer
   Supports early/mid-month calculation via ?early=true
───────────────────────────────────────────────────────────────────────────── */
export const getMyBill = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;
  const { early }     = req.query; // ?early=true for mid-month payment

  const [kitchen, sub] = await Promise.all([
    Kitchen.findById(kitchenId),
    Subscription.findOne({ userId: req.user.id, kitchenId }),
  ]);

  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (!sub)     throw new AppError("Subscription not found", 403);

  const month        = currentMonth();
  const mealsPerDay  = MEALS_PER_PLAN[sub.mealPlan] || 1;
  const priceMap     = { one: kitchen.oneMealPrice, two: kitchen.twoMealPrice, three: kitchen.threeMealPrice };
  const monthlyPrice = priceMap[sub.mealPlan] || 0;

  // Paused meals this month
  const pausedMeals  = await pausedMealsInMonth(req.user.id, kitchenId, month, mealsPerDay);
  const mealRate     = pricePerMeal(kitchen, sub.mealPlan);
  const pauseDeduct  = Math.round(pausedMeals * mealRate);

  let totalAmount  = monthlyPrice;
  let finalAmount  = monthlyPrice - pauseDeduct;

  // Mid-month early payment: only charge meals delivered so far
  if (early === "true") {
    const now          = new Date();
    const dayOfMonth   = now.getDate();
    const mealsToDate  = dayOfMonth * mealsPerDay;
    const pausedSoFar  = await pausedMealsInMonth(req.user.id, kitchenId, month, mealsPerDay);
    const mealsCharged = Math.max(0, mealsToDate - pausedSoFar);
    totalAmount        = Math.round(mealsCharged * mealRate);
    finalAmount        = totalAmount;
  }

  // Check if already has a payment record this month
  const existing = await Payment.findOne({
    userId: req.user.id, kitchenId, month, type: "monthly",
  });

  // Return bill breakdown
  res.json({
    success: true,
    data: {
      month,
      mealPlan:       sub.mealPlan,
      monthlyPrice,
      pausedMeals,
      pauseDeduction: pauseDeduct,
      totalAmount,
      finalAmount,
      status:         existing?.status || "not_generated",
      paymentId:      existing?._id || null,
      upiId:          kitchen.upiId || null,
      kitchenName:    kitchen.kitchenName,
    },
  });
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
  const priceMap = { one: kitchen.oneMealPrice, two: kitchen.twoMealPrice, three: kitchen.threeMealPrice };

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