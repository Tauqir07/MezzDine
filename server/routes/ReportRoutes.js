import express from "express";
import { submitReport, getReports, updateReportStatus } from "../controllers/ReportController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post  ("/",           submitReport);          // public — no auth required
router.get   ("/",    auth,  getReports);            // admin only
router.patch ("/:reportId", auth, updateReportStatus); // admin only

export default router;