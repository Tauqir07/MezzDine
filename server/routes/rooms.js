import express from "express";

import {

  createRoom,

  getRooms,

  myRooms,

  getSingleRoom,

  deleteRoom,

  deleteRoomImage,

  updateRoom,
  getSimilarRooms


} from "../controllers/roomController.js";


import {

  auth,

  authorize

} from "../middlewares/auth.js";


import {

  roomValidator

} from "../validators/roomValidator.js";


import validate

from "../middlewares/validate.js";


import upload

from "../middlewares/upload.js";


const router = express.Router();



// =====================================
// CREATE ROOM
// =====================================

router.post(

  "/",

  auth,

  authorize("roomProvider"),

  upload.array("images", 5),

  roomValidator,

  validate,

  createRoom

);



// =====================================
// UPDATE ROOM (FIXED)
// =====================================

router.put(

  "/:roomId",

  auth,

  authorize("roomProvider"),

  upload.array("images", 5),   // ⭐ THIS WAS MISSING

  updateRoom

);



// =====================================
// GET MY ROOMS
// =====================================

router.get(

  "/my",

  auth,

  authorize("roomProvider"),

  myRooms

);



// =====================================
// GET ALL ROOMS
// =====================================

router.get("/", getRooms);



// =====================================
// GET SINGLE ROOM
// =====================================

router.get("/:roomId", getSingleRoom);

router.get(
"/similar/:roomId",
getSimilarRooms
);


// =====================================
// DELETE SINGLE IMAGE
// =====================================

router.delete(

  "/:roomId/image",

  auth,

  authorize("roomProvider"),

  deleteRoomImage

);



// =====================================
// DELETE ROOM
// =====================================

router.delete(

  "/:roomId",

  auth,

  authorize("roomProvider"),

  deleteRoom

);



export default router;
