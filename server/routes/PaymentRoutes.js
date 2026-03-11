import express from "express";
import {auth} from "../middlewares/auth.js";
import {
  createAdvancePayment,
  getMyBill,
  generateMonthlyBill,
  submitPayment,
  markPaymentPaid,
  getMyPayments,
  getKitchenPayments,
  getSubscriberPayments,
  getPendingPayments, // ← NEW
  rejectPayment,      // ← NEW
} from "../controllers/PaymentController.js";

const router = express.Router();

// ── Customer ──────────────────────────────────────────────────────────────────
router.post  ("/advance/:kitchenId",            auth, createAdvancePayment);  // on subscribe
router.get   ("/bill/:kitchenId",               auth, getMyBill);             // current bill
router.get   ("/my/:kitchenId",                 auth, getMyPayments);         // history
router.patch ("/pay/:paymentId",                auth, submitPayment);         // submit UTR

// ── Owner ─────────────────────────────────────────────────────────────────────
router.post  ("/generate/:kitchenId",           auth, generateMonthlyBill);   // generate bills
router.patch ("/mark-paid/:paymentId",          auth, markPaymentPaid);       // approve payment
router.patch ("/reject/:paymentId",             auth, rejectPayment);         // ← NEW: reject payment
router.get   ("/pending/:kitchenId",            auth, getPendingPayments);    // ← NEW: pending approvals
router.get   ("/kitchen/:kitchenId",            auth, getKitchenPayments);    // all subs status
router.get   ("/subscriber/:kitchenId/:userId", auth, getSubscriberPayments); // one sub history

export default router;