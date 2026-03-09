import express from "express";
import { auth } from "../middlewares/auth.js";

import {
  startConversation,
  sendMessage,
  getMessages,
  getConversations,
  getReceiver,
} from "../controllers/chatcontroller.js";

const router = express.Router();

router.post("/start",       auth, startConversation);
router.get("/",             auth, getConversations);
router.get("/:id/receiver", auth, getReceiver);   // must be before /:id
router.get("/:id",          auth, getMessages);
router.post("/:id",         auth, sendMessage);

export default router;