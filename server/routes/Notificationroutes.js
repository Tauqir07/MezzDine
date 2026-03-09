import express from "express";
import {
  getMyNotifications,
  markAllRead,
  sendAnnouncement,
  pauseMeals,
  resumeMeals,
  getMyPause,
   getKitchenPause,
  pauseKitchen,
  resumeKitchen,
   clearMyPauseHistory,
  clearUserPauseHistory,
  getUserPauseForKitchen,
} from "../controllers/Notificationcontroller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// ── General notifications ──────────────────────────
router.get("/my",          auth, getMyNotifications);
router.patch("/mark-read", auth, markAllRead);

// ── Owner: send announcement to all subscribers ────
router.post("/announce/:kitchenId", auth, sendAnnouncement);

// ── Customer: pause / resume meals ────────────────
router.post(  "/pause/:kitchenId", auth, pauseMeals);
router.delete("/pause/:kitchenId", auth, resumeMeals);
router.get(   "/pause/:kitchenId", auth, getMyPause);

router.get("/kitchen-pause/:kitchenId",    auth, getKitchenPause);
router.post("/kitchen-pause/:kitchenId",   auth, pauseKitchen);
router.delete("/kitchen-pause/:kitchenId", auth, resumeKitchen);
router.get("/pause/:kitchenId/user/:userId", auth, getUserPauseForKitchen);
// Customer clears own history after payment
router.delete("/pause-history/:kitchenId", auth, clearMyPauseHistory);

// Kitchen owner clears a specific customer's history after receiving payment
router.delete("/pause-history/:kitchenId/user/:userId", auth, clearUserPauseHistory);
export default router;