import RoomRental from "../models/Roomrental.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* =======================================================
   ADD TENANT TO ROOM
   POST /api/room-rentals/:roomId
======================================================= */
export const addTenant = asyncHandler(async (req, res) => {

  const { roomId } = req.params;
  const {
    tenantId,
    tenantName,
    tenantPhone,
    tenantType,
    familyMembers,
    monthlyRent,
    rentDueDay,
    startDate,
    notes,
  } = req.body;

  if (!monthlyRent) throw new AppError("Monthly rent is required", 400);
  if (!tenantType)  throw new AppError("Tenant type is required", 400);

  // close any existing active rental for this tenant in this room
  if (tenantId) {
    await RoomRental.updateMany(
      { roomId, tenantId, isActive: true },
      { isActive: false, endDate: new Date() }
    );
  }

  const rental = await RoomRental.create({
    roomId,
    tenantId:      tenantId    || null,
    tenantName:    tenantName  || "",
    tenantPhone:   tenantPhone || "",
    tenantType,
    familyMembers: familyMembers || { adults: 2, children: 0 },
    monthlyRent:   Number(monthlyRent),
    rentDueDay:    rentDueDay ? Number(rentDueDay) : 1,
    startDate:     startDate  || new Date(),
    notes:         notes      || "",
    payments:      [],
  });

  res.status(201).json({ success: true, data: rental });
});

/* =======================================================
   GET ALL TENANTS FOR A ROOM
   GET /api/room-rentals/:roomId
======================================================= */
export const getRoomTenants = asyncHandler(async (req, res) => {

  const { roomId } = req.params;

  const rentals = await RoomRental.find({ roomId, isActive: true })
    .populate("tenantId", "name email phone");

  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const enriched = rentals.map(r => {
    const obj      = r.toObject();
    const thisMonth = obj.payments?.find(
      p => p.month === currentMonth && p.year === currentYear
    );

    const dueDate  = new Date(currentYear, currentMonth, r.rentDueDay);
    const diffMs   = dueDate - now;
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    obj.currentMonthPaid   = thisMonth?.isPaid  || false;
    obj.currentMonthPaidOn = thisMonth?.paidOn  || null;
    obj.daysUntilDue       = daysLeft;
    obj.isOverdue          = daysLeft < 0 && !obj.currentMonthPaid;

    return obj;
  });

  res.json({ success: true, data: enriched });
});

/* =======================================================
   MARK RENT AS PAID
   PATCH /api/room-rentals/:rentalId/pay
======================================================= */
export const markRentPaid = asyncHandler(async (req, res) => {

  const { rentalId } = req.params;
  const rental = await RoomRental.findById(rentalId);
  if (!rental) throw new AppError("Rental not found", 404);

  const now          = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const existing = rental.payments.find(
    p => p.month === currentMonth && p.year === currentYear
  );

  if (existing) {
    existing.isPaid = true;
    existing.paidOn = now;
    existing.amount = req.body.amount || rental.monthlyRent;
  } else {
    rental.payments.push({
      month:  currentMonth,
      year:   currentYear,
      isPaid: true,
      paidOn: now,
      amount: req.body.amount || rental.monthlyRent,
    });
  }

  await rental.save();
  res.json({ success: true, data: rental });
});

/* =======================================================
   REMOVE TENANT
   DELETE /api/room-rentals/:rentalId
======================================================= */
export const removeTenant = asyncHandler(async (req, res) => {

  const { rentalId } = req.params;
  const rental = await RoomRental.findById(rentalId);
  if (!rental) throw new AppError("Rental not found", 404);

  rental.isActive = false;
  rental.endDate  = new Date();
  await rental.save();

  res.json({ success: true, message: "Tenant removed" });
});