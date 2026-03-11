import express from "express";
import { addReview, updateReview, getReviews } from "../controllers/KitchenReviewController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/:kitchenId", auth, addReview);
router.put("/:kitchenId", auth, updateReview);
router.get("/:kitchenId", getReviews);

export default router;