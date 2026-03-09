import express from "express";
import { getTodayStatus, updateStatus } from "../controllers/Deliverycontroller.js";
import { auth, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Customer + owner: get today's status for a kitchen
router.get("/status/:kitchenId", auth, getTodayStatus);

// Owner only: update today's status
router.patch("/status/:kitchenId", auth, authorize("kitchenOwner"), updateStatus);

export default router;