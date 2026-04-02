import Room           from "../models/room.js";
import asyncHandler   from "../utils/asyncHandler.js";
import AppError       from "../utils/AppError.js";
import cloudinary     from "../config/cloudinary.js";
import { geocodeAddress } from "../utils/geocode.js"; // ← ADD THIS


// CREATE ROOM
export const createRoom = asyncHandler(async (req, res) => {

  const {
    title, price, address, description,
    propertyType, hostLanguage, isAvailable,
    genderPreference, listingType,
  } = req.body;

  const bedrooms  = req.body.bedrooms  ? Number(req.body.bedrooms)  : 0;
  const bathrooms = req.body.bathrooms ? Number(req.body.bathrooms) : 0;
  const beds      = req.body.beds      ? Number(req.body.beds)      : 0;
  const amenities = req.body.amenities
  ? (typeof req.body.amenities === "string"
      ? (() => { try { return JSON.parse(req.body.amenities); } catch { return req.body.amenities.split(","); } })()
      : req.body.amenities)
  : [];

  if (!title || !price || !address)
    throw new AppError("Title, price and address required", 400);

  const images = req.files ? req.files.map(file => ({
    url: file.path, public_id: file.filename,
  })) : [];

  const room = await Room.create({
    title, description,
    price:           Number(price),
    address,
    bedrooms, bathrooms, beds, amenities,
    propertyType, hostLanguage,
    isAvailable:     isAvailable ?? true,
    genderPreference,
    listingType,
    images,
    ownerId:         req.user.id,
  });

  // ── Auto-geocode address → lat/lng ──
  const coords = await geocodeAddress(address);
  console.log("Room geocode:", address, "→", coords);
  if (coords) {
    room.location = coords;
    await room.save();
  }

  res.status(201).json({ success: true, data: room });
});


// GET ALL ROOMS
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find()
    .populate("ownerId", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: rooms });
});


// GET MY ROOMS
export const myRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ ownerId: req.user.id })
    .populate("ownerId", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: rooms });
});


// GET SINGLE ROOM
export const getSingleRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId)
    .populate("ownerId", "name phone");
  if (!room) throw new AppError("Room not found", 404);
  res.json({ success: true, data: room });
});


// GET SIMILAR ROOMS
export const getSimilarRooms = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);
  if (!room) throw new AppError("Room not found", 404);

  // similar by propertyType or genderPreference instead of location string
  const similar = await Room.find({
    _id:          { $ne: room._id },
    propertyType: room.propertyType,
  })
    .populate("ownerId", "name")
    .limit(4)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: similar });
});


// UPDATE ROOM
export const updateRoom = asyncHandler(async (req, res) => {

  const room = await Room.findById(req.params.roomId);
  if (!room)                                   throw new AppError("Room not found", 404);
  if (room.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);

  const oldAddress = room.address;

  // ── safely apply only known scalar fields ──
  const { title, description, price, address, bedrooms, bathrooms,
          beds, amenities, propertyType, hostLanguage,
          isAvailable, genderPreference, listingType } = req.body;

  if (title)            room.title            = title;
  if (description)      room.description      = description;
  if (price)            room.price            = Number(price);
  if (address)          room.address          = address;
  if (bedrooms)         room.bedrooms         = Number(bedrooms);
  if (bathrooms)        room.bathrooms        = Number(bathrooms);
  if (beds)             room.beds             = Number(beds);
  if (amenities)        room.amenities        = typeof amenities === "string"
                                                  ? JSON.parse(amenities)
                                                  : amenities;
  if (propertyType)     room.propertyType     = propertyType;
  if (hostLanguage)     room.hostLanguage     = hostLanguage;
  if (isAvailable !== undefined) room.isAvailable = isAvailable;
  if (genderPreference) room.genderPreference = genderPreference;
  if (listingType)      room.listingType      = listingType;

  // ── re-geocode only if address changed ──
  if (address && address !== oldAddress) {
    const coords = await geocodeAddress(address);
    console.log("Room re-geocode:", address, "→", coords);
    if (coords) room.location = coords;
  }

  // ── add new images ──
  if (req.files && req.files.length > 0) {
    room.images.push(
      ...req.files.map(file => ({ url: file.path, public_id: file.filename }))
    );
  }

  // ── delete images ──
  if (req.body.deletedImages) {
    const deletedImages = JSON.parse(req.body.deletedImages);
    for (const public_id of deletedImages) {
      await cloudinary.uploader.destroy(public_id);
    }
    room.images = room.images.filter(img => !deletedImages.includes(img.public_id));
  }

  await room.save();
  res.json({ success: true, data: room });
});

// DELETE IMAGE
export const deleteRoomImage = asyncHandler(async (req, res) => {
  const { roomId }    = req.params;
  const { public_id } = req.body;

  const room = await Room.findById(roomId);
  if (!room)                              throw new AppError("Room not found", 404);
  if (room.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);

  await cloudinary.uploader.destroy(public_id);
  room.images = room.images.filter(img => img.public_id !== public_id);
  await room.save();

  res.json({ success: true, message: "Image deleted" });
});


// DELETE ROOM
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.roomId);
  if (!room)                              throw new AppError("Room not found", 404);
  if (room.ownerId.toString() !== req.user.id) throw new AppError("Not authorized", 403);

  for (const img of room.images) {
    await cloudinary.uploader.destroy(img.public_id);
  }

  await room.deleteOne();
  res.json({ success: true, message: "Room deleted" });
});