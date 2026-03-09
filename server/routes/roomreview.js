
import express from "express";

import {
createReview,
getRoomReviews
}
from "../controllers/roomreviewController.js";

import { auth } from "../middlewares/auth.js";

const router = express.Router();


router.get(
"/:roomId",
getRoomReviews
);


router.post(
"/:roomId",
auth,
createReview
);


export default router;
