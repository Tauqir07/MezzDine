import express from "express";
import { auth, authorize } from "../middlewares/auth.js";
import {
  getMySubscription,
  pauseSubscription,
  resumeSubscription,
  getKitchenSubscribers
} from "../controllers/SubscriptionController.js";

const router = express.Router();

router.get("/my", auth, getMySubscription);
router.patch("/pause", auth, pauseSubscription);
router.patch("/resume", auth, resumeSubscription);
router.get("/kitchen/:kitchenId", auth, authorize("kitchenOwner"), getKitchenSubscribers);

export default router;