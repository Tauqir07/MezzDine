import Conversation  from "../models/conversation.js";
import Message       from "../models/message.js";
import Notification  from "../models/Notification.js";
import User          from "../models/user.js";
import { sendPushToUser } from "./PushController.js";

function getUserId(req) {
  return req.user?.id || req.user?._id || null;
}

// START OR CREATE CONVERSATION
export const startConversation = async (req, res) => {
  try {
    const userId     = getUserId(req);
    const receiverId = req.body.receiverId;

    if (!userId)     return res.status(401).json({ message: "Unauthorized" });
    if (!receiverId) return res.status(400).json({ message: "receiverId missing" });

    let convo = await Conversation.findOne({
      participants: { $all: [userId, receiverId] }
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [userId, receiverId]
      });
    }

    res.json(convo);
  } catch (err) {
    console.error("[startConversation]", err);
    res.status(500).json({ message: "Failed to start conversation" });
  }
};

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const convoId = req.params.id;
    if (!convoId || convoId === "undefined")
      return res.status(400).json({ message: "Invalid conversation ID" });

    const { text, replyTo } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });

    const message = await Message.create({
      conversation: convoId,
      sender:       userId,
      text,
      ...(replyTo ? { replyTo } : {}),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name")
      .populate({
        path:     "replyTo",
        select:   "text sender",
        populate: { path: "sender", select: "name" },
      });

    await Conversation.findByIdAndUpdate(convoId, {
      lastMessage: message._id,
    });

    const convo = await Conversation.findById(convoId)
      .populate("participants", "name");

    const msgToEmit = {
      _id:          populatedMessage._id.toString(),
      text:         populatedMessage.text,
      sender:       populatedMessage.sender,
      replyTo:      populatedMessage.replyTo ?? null,
      conversation: convoId,
      createdAt:    populatedMessage.createdAt,
      updatedAt:    populatedMessage.updatedAt,
    };

    // emit socket to every participant
    convo.participants.forEach(p => {
      global.io.to(p._id.toString()).emit("newMessage", msgToEmit);
    });

    const sender = await User.findById(userId).select("name");

    const recipient = convo.participants.find(
      p => String(p._id) !== String(userId)
    );

    if (recipient) {
      // save notification to DB (for offline badge on next login)
      const notif = await Notification.create({
        recipientId:    recipient._id,
        type:           "message",
        title:          `💬 New message from ${sender?.name || "Someone"}`,
        message:        text.length > 80 ? text.slice(0, 80) + "…" : text,
        conversationId: convoId,
        kitchenId:      null,
      });

      // emit notification socket (for online badge)
      if (global.io) {
        global.io.to(String(recipient._id)).emit("newNotification", notif.toObject());
      }

      // send OS push notification (works even when browser is closed)
      await sendPushToUser(recipient._id, {
        title: `💬 ${sender?.name || "Someone"}`,
        body:  text.length > 80 ? text.slice(0, 80) + "…" : text,
        url:   `/chat/${convoId}`,
      });
    }

    res.json(populatedMessage);
  } catch (err) {
    console.error("[sendMessage]", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// GET ALL CONVERSATIONS
export const getConversations = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const convos = await Conversation.find({ participants: userId })
      .populate("participants", "name")
      .populate({
        path:     "lastMessage",
        select:   "text sender createdAt",
        populate: { path: "sender", select: "name" },
      })
      .sort({ updatedAt: -1 });

    res.json(convos);
  } catch (err) {
    console.error("[getConversations]", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// GET ALL MESSAGES
export const getMessages = async (req, res) => {
  try {
    const userId  = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const convoId = req.params.id;
    if (!convoId || convoId === "undefined")
      return res.status(400).json({ message: "Invalid conversation ID" });

    const messages = await Message.find({ conversation: convoId })
      .populate("sender", "name")
      .populate({
        path:     "replyTo",
        select:   "text sender",
        populate: { path: "sender", select: "name" },
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("[getMessages]", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// GET RECEIVER OF A CONVERSATION
export const getReceiver = async (req, res) => {
  try {
    const userId  = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const convoId = req.params.id;
    if (!convoId || convoId === "undefined")
      return res.status(400).json({ message: "Invalid conversation ID" });

    const convo = await Conversation.findById(convoId)
      .populate("participants", "name");

    if (!convo)
      return res.status(404).json({ message: "Conversation not found" });

    const receiver = convo.participants.find(
      p => String(p._id) !== String(userId)
    );

    if (!receiver)
      return res.status(404).json({ message: "Receiver not found" });

    res.json(receiver);
  } catch (err) {
    console.error("[getReceiver]", err);
    res.status(500).json({ message: "Failed to fetch receiver" });
  }
};