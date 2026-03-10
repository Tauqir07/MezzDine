import express from "express";
import { submitContact } from "../controllers/ContactControllers.js";

const router = express.Router();

router.post("/", submitContact); // public — no auth required

export default router;