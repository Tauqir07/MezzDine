import express from "express";
import { createMenu, getKitchenMenu, deleteMenu } from "../controllers/KitchenMenuController.js";
import { auth, authorize } from "../middlewares/auth.js";
import { memoryUpload } from "../middlewares/upload.js";

const router = express.Router();

const menuImageFields = [];
["breakfast", "lunch", "dinner"].forEach(meal => {
  for (let i = 0; i < 7; i++) {
    menuImageFields.push({ name: `image_${i}_${meal}`, maxCount: 1 });
  }
});

router.post(
  "/:kitchenId",
  auth,
  authorize("kitchenOwner"),
  memoryUpload.fields(menuImageFields), // fast — just buffers in RAM
  createMenu
);

router.get("/:kitchenId", getKitchenMenu);

router.delete(
  "/:kitchenId",
  auth,
  authorize("kitchenOwner"),
  deleteMenu
);

export default router;