import express from "express";
import { auth, authorize } from "../middlewares/auth.js";
import { kitchenValidator } from "../validators/kitchenValidator.js";
import validate from "../middlewares/validate.js";
import upload from "../middlewares/upload.js";
import multer from "multer";
import {
  createKitchen,
  getKitchens,
  myKitchen,
  getSingleKitchen,
  deleteKitchenImage,
  deleteKitchen,
  subscribeKitchen,
  unsubscribeKitchen,
  similarKitchens,
  updateKitchen,
  getSubscribersMap,
} from "../controllers/kitchenController.js";

const router = express.Router();

// Catches MulterError ("Unexpected field", "Too many files", etc.)
// and returns a clean JSON error instead of crashing
function handleUpload(maxCount) {
  return (req, res, next) => {
    upload.array("images", maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      if (err) {
        return res.status(500).json({
          success: false,
          message: "File upload failed",
        });
      }
      next();
    });
  };
}

// ── CREATE ──────────────────────────────────────
router.post(
  "/",
  auth,
  authorize("kitchenOwner"),
  handleUpload(20),   // up to 20 images in one go
  kitchenValidator,
  validate,
  createKitchen
);
router.get("/:kitchenId/subscribers-map", auth, authorize("kitchenOwner"), getSubscribersMap);

// ── SUBSCRIBE / UNSUBSCRIBE ─────────────────────
router.post("/:kitchenId/subscribe",     auth, subscribeKitchen);
router.delete("/:kitchenId/unsubscribe", auth, unsubscribeKitchen);

// ── SIMILAR (must be before /:kitchenId) ────────
router.get("/similar/:kitchenId", similarKitchens);

// ── READ ────────────────────────────────────────
router.get("/",    getKitchens);
router.get("/my",  auth, authorize("kitchenOwner"), myKitchen);
router.get("/:kitchenId", getSingleKitchen);

// ── UPDATE (appends new images to existing) ─────
router.put(
  "/:kitchenId",
  auth,
  authorize("kitchenOwner"),
  handleUpload(20),   // up to 20 new images per update call
  updateKitchen
);

// ── DELETE IMAGE ────────────────────────────────
router.delete(
  "/:kitchenId/image",
  auth,
  authorize("kitchenOwner"),
  deleteKitchenImage
);

// ── DELETE KITCHEN ──────────────────────────────
router.delete(
  "/:kitchenId",
  auth,
  authorize("kitchenOwner"),
  deleteKitchen
);

export default router;