import api from "./axios";

// CREATE
export const createKitchen = (formData) =>
  api.post("/kitchens", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// GET ALL
export const getKitchens = () =>
  api.get("/kitchens");

// GET MY
export const getMyKitchens = () =>
  api.get("/kitchens/my");

// GET SINGLE
export const getSingleKitchen = (id) =>
  api.get(`/kitchens/${id}`);
// DELETE KITCHEN
export const deleteKitchen = (id) =>
  api.delete(`/kitchens/${id}`);

