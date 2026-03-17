import express from "express";
import {
  saveSubscription,
  deleteSubscription,
  getVapidPublicKey
} from "../controllers/PushController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/vapid-public-key",  getVapidPublicKey);
router.post("/subscribe",    auth, saveSubscription);
router.delete("/subscribe",  auth, deleteSubscription);

export default router;  // ← this line must be there