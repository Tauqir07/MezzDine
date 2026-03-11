import Deliverystatus from "../models/DeliveryStatus.js";
import Kitchen        from "../models/KitchenModal.js";
import Notification   from "../models/Notification.js";
import Subscription   from "../models/Subscription.js";
import asyncHandler   from "../utils/asyncHandler.js";
import AppError       from "../utils/AppError.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ─────────────────────────────────────────────────────────────
   GET /delivery/status/:kitchenId
   Anyone (customer/owner) fetches today's delivery status.
───────────────────────────────────────────────────────────── */
export const getTodayStatus = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  const status = await Deliverystatus.findOne({
    kitchenId,
    date: todayStr(),
  });

  // if no doc yet, it means the kitchen hasn't started today
  res.json({
    success: true,
    data: status || {
      kitchenId,
      date:   todayStr(),
      status: "preparing",
      note:   "",
    },
  });
});

/* ─────────────────────────────────────────────────────────────
   PATCH /delivery/status/:kitchenId
   Owner updates today's delivery status.
   Body: { status: "out_for_delivery" | "delivered" | "preparing", note?: string }
───────────────────────────────────────────────────────────── */
export const updateStatus = asyncHandler(async (req, res) => {
  const { kitchenId }      = req.params;
  const { status, note="" } = req.body;

  const VALID = ["preparing", "out_for_delivery", "delivered"];
  if (!VALID.includes(status))
    throw new AppError("Invalid status", 400);

  // verify ownership
  const kitchen = await Kitchen.findById(kitchenId);
  if (!kitchen) throw new AppError("Kitchen not found", 404);
  if (String(kitchen.ownerId) !== String(req.user.id))
    throw new AppError("Not authorized", 403);

  // upsert today's status doc
  const delivery = await Deliverystatus.findOneAndUpdate(
    { kitchenId, date: todayStr() },
    { status, note, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  // notify all subscribers when status changes to out_for_delivery or delivered
  if (status === "out_for_delivery" || status === "delivered") {
    const subs = await Subscription.find({ kitchenId });

    const statusLabel = {
      out_for_delivery: "🚴 Food is on the way!",
      delivered:        "✅ Food has been delivered!",
    }[status];

    const notifications = subs.map(sub => ({
      recipientId: sub.userId,
      type:        "announcement",
      title:       `${statusLabel} — ${kitchen.kitchenName}`,
      message:     note || statusLabel,
      kitchenId,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }
  }

  res.json({ success: true, data: delivery });
});