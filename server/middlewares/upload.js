import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/* ── Cloudinary storage (used for kitchens, rooms, profiles etc.) ── */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "mern-food-house",
    allowed_formats: ["jpg", "png", "jpeg", "webp","avif",],
    resource_type: "image",
    public_id: Date.now() + "-" + file.originalname.split(".")[0]
  })
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/* ── Memory storage (used for menu — we upload to Cloudinary manually
      in the controller using Promise.all so all images go in parallel) ── */

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default upload;