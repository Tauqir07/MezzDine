import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import asyncHandler from "../utils/asyncHandler.js";

webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* ── Save / update subscription ── */
export const saveSubscription = asyncHandler(async (req, res) => {
  const { subscription } = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ message: "Invalid subscription" });
  }

  await PushSubscription.findOneAndUpdate(
    { userId: req.user.id },
    { userId: req.user.id, subscription },
    { upsert: true, new: true }
  );

  res.json({ success: true });
});

/* ── Delete subscription (logout) ── */
export const deleteSubscription = asyncHandler(async (req, res) => {
  await PushSubscription.findOneAndDelete({ userId: req.user.id });
  res.json({ success: true });
});

/* ── Get VAPID public key (frontend needs this) ── */
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

/* ── Send push to a specific user (called internally) ── */
export async function sendPushToUser(userId, payload) {
  try {
    const record = await PushSubscription.findOne({ userId });
    if (!record) return;

    await webpush.sendNotification(
      record.subscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    // if subscription is expired/invalid, remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      await PushSubscription.findOneAndDelete({ userId });
    }
    console.error("[Push] Failed to send:", err.message);
  }
}

/* ── Send push to multiple users ── */
export async function sendPushToMany(userIds, payload) {
  await Promise.all(userIds.map(id => sendPushToUser(id, payload)));
}