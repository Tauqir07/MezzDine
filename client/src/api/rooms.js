import api from "./axios";


// GET MY ROOMS

export const getMyRooms =
() => api.get("/rooms/my");


// CREATE ROOM (FIXED)

export const createRoom =
(formData) =>
  api.post(
    "/rooms",
    formData
  );


// DELETE ROOM

export const deleteRoom =
(id) =>
  api.delete(
    `/rooms/${id}`
  );


// GET ALL ROOMS

export const getRooms =
() => api.get("/rooms");


// GET SINGLE ROOM

export const getSingleroom =
(id) =>
  api.get(
    `/rooms/${id}`
  );
