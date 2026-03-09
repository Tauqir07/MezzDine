import express from "express";
import { recordVisit, getVisits } from "../controllers/VisitController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/:entityType/:entityId", auth, recordVisit);
router.get("/:entityType/:entityId",  auth, getVisits);

export default router;