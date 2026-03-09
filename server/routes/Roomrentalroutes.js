import express from "express";
import {
  addTenant,
  getRoomTenants,
  markRentPaid,
  removeTenant
} from "../controllers/RoomrentalController.js";
import { auth, authorize } from "../middlewares/auth.js";

const router = express.Router();

// get all tenants for a room
router.get("/:roomId",            auth, authorize("roomProvider"), getRoomTenants);

// add a new tenant
router.post("/:roomId",           auth, authorize("roomProvider"), addTenant);

// mark rent paid for current month
router.patch("/:rentalId/pay",    auth, authorize("roomProvider"), markRentPaid);

// remove tenant
router.delete("/:rentalId",       auth, authorize("roomProvider"), removeTenant);

export default router;