import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import cron from "node-cron";

import authRoutes         from "./routes/auth.js";
import roomRoutes         from "./routes/rooms.js";
import kitchenRoutes      from "./routes/Kitchen.js";
import reviewRoutes       from "./routes/roomreview.js";
import chatRoutes         from "./routes/chatRoutes.js";
import errorHandler       from "./middlewares/errorHandler.js";
import kitchenMenuRoutes  from "./routes/KitchenMenu.js";
import subscriptionRoutes from "./routes/SubscriptionRoutes.js";
import kitchenreview      from "./routes/KitchenReviewRoutes.js";
import roomRentalRoutes   from "./routes/Roomrentalroutes.js";
import notificationRoutes from "./routes/Notificationroutes.js";
import deliveryRoutes     from "./routes/Deliveryroutes.js";
import visitRoutes        from "./routes/VisitRoutes.js";
import paymentRoutes      from "./routes/PaymentRoutes.js";

import Kitchen      from "./models/Kitchen.js";
import Payment      from "./models/Payment.js";
import Subscription from "./models/Subscription.js";
import MealPause    from "./models/MealPause.js";
import reportRoutes from "./routes/ReportRoutes.js";
import contactRoutes from "./routes/ContactRoutes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.use("/api/auth",            authRoutes);
app.use("/api/rooms",           roomRoutes);
app.use("/api/kitchens",        kitchenRoutes);
app.use("/api/notifications",   notificationRoutes);
app.use("/api/reviews",         reviewRoutes);
app.use("/api/chat",            chatRoutes);
app.use("/api/menu",            kitchenMenuRoutes);
app.use("/api/subscriptions",   subscriptionRoutes);
app.use("/api/kitchen-reviews", kitchenreview);
app.use("/api/room-rentals",    roomRentalRoutes);
app.use("/api/delivery",        deliveryRoutes);
app.use("/api/visits",          visitRoutes);
app.use("/api/payments",        paymentRoutes);   // ← was PaymentRoutes (bug fix)
app.use("/api/report", reportRoutes);
app.use("/api/contact",   contactRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.send("Server working"));

app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch(console.error);

// ── Cron: auto-generate monthly bills on the 1st of every month at midnight ──
const MEALS_PER_PLAN = { one: 1, two: 2, three: 3 };
const PRICE_KEY      = { one: "oneMealPrice", two: "twoMealPrice", three: "threeMealPrice" };

cron.schedule("0 0 1 * *", async () => {
  console.log("[CRON] Generating monthly bills...");
  try {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const kitchens = await Kitchen.find({});

    for (const kitchen of kitchens) {
      const subs = await Subscription.find({ kitchenId: kitchen._id });

      for (const sub of subs) {
        // Skip if bill already exists for this month
        const exists = await Payment.findOne({
          userId: sub.userId, kitchenId: kitchen._id, month, type: "monthly"
        });
        if (exists) continue;

        const mealsPerDay    = MEALS_PER_PLAN[sub.mealPlan] || 1;
        const monthlyPrice   = kitchen[PRICE_KEY[sub.mealPlan]] || 0;
        const mealRate       = monthlyPrice / (daysInMonth * mealsPerDay);

        // Count paused meals this month
        const pause       = await MealPause.findOne({ userId: sub.userId, kitchenId: kitchen._id });
        const pausedDates = (pause?.dates || []).filter(d => d.startsWith(month));
        const pausedMeals = pausedDates.length * mealsPerDay;
        const pauseDeduct = Math.round(pausedMeals * mealRate);

        // Deduct advance if this is the subscriber's first month
        const subMonth = sub.createdAt
          ? `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, "0")}`
          : null;
        const advancePaid = subMonth === month
          ? await Payment.findOne({ userId: sub.userId, kitchenId: kitchen._id, type: "advance", status: "paid" })
          : null;

        let finalAmount = Math.max(0, monthlyPrice - pauseDeduct);
        if (advancePaid) finalAmount = Math.max(0, finalAmount - advancePaid.finalAmount);

        await Payment.create({
          kitchenId:      kitchen._id,
          userId:         sub.userId,
          month,
          type:           "monthly",
          totalAmount:    monthlyPrice,
          pauseDeduction: pauseDeduct,
          finalAmount,
          status:         finalAmount === 0 ? "paid" : "pending",
          paidAt:         finalAmount === 0 ? new Date() : null,
        });
      }
    }
    console.log("[CRON] Monthly bills generated.");
  } catch (err) {
    console.error("[CRON] Bill generation failed:", err);
  }
});

// ── Socket.io ──────────────────────────────────────────────────────────────
const PORT   = 5001;
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

global.io = io;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("User joined:", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});