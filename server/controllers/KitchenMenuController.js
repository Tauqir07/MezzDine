import KitchenMenu from "../models/KitchenMenu.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/* helper — upload a single buffer to Cloudinary, returns { url, public_id } */
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mern-food-house",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* =======================================================
   CREATE OR UPDATE MENU
======================================================= */
export const createMenu = asyncHandler(async (req, res) => {

  const { kitchenId } = req.params;
  if (!kitchenId) throw new AppError("Kitchen ID required", 400);

  let { weeks } = req.body;
  if (!weeks) throw new AppError("Menu data required", 400);

  if (typeof weeks === "string") {
    try { weeks = JSON.parse(weeks); }
    catch { throw new AppError("Invalid menu format", 400); }
  }

  /* collect every image that needs uploading into one array
     so we can fire them ALL to Cloudinary at the same time */

  const uploadTasks = [];

  weeks.forEach((week, weekIndex) => {
    week.days?.forEach((day, dayIndex) => {
      ["breakfast", "lunch", "dinner"].forEach(mealType => {
        if (!day[mealType]) day[mealType] = {};
        day[mealType].name = day[mealType].name || "";

        const fieldName = `image_${dayIndex}_${mealType}`;
        const file = req.files?.[fieldName]?.[0];

        if (file) {
          uploadTasks.push({
            weekIndex,
            dayIndex,
            mealType,
            buffer: file.buffer
          });
        }
      });
    });
  });

  /* upload everything in parallel — instead of waiting for each one
     sequentially, all uploads fire at the same time */
  if (uploadTasks.length > 0) {
    const results = await Promise.all(
      uploadTasks.map(task => uploadBuffer(task.buffer))
    );

    // write results back into the weeks structure
    results.forEach((result, i) => {
      const { weekIndex, dayIndex, mealType } = uploadTasks[i];
      weeks[weekIndex].days[dayIndex][mealType].image = { url: result.url };
    });
  }

  /* SAVE */
  let menu = await KitchenMenu.findOne({ kitchenId });

  if (menu) {
    menu.weeks = weeks;
    await menu.save();
  } else {
    menu = await KitchenMenu.create({ kitchenId, weeks });
  }

  res.status(200).json({ success: true, data: menu });
});

/* =======================================================
   GET MENU
======================================================= */
export const getKitchenMenu = asyncHandler(async (req, res) => {

  const { kitchenId } = req.params;
  if (!kitchenId) throw new AppError("Kitchen ID required", 400);

  const menu = await KitchenMenu.findOne({ kitchenId });

  res.status(200).json({
    success: true,
    data: menu || { kitchenId, weeks: [] }
  });
});

/* =======================================================
   DELETE MENU
======================================================= */
export const deleteMenu = asyncHandler(async (req, res) => {

  const { kitchenId } = req.params;
  if (!kitchenId) throw new AppError("Kitchen ID required", 400);

  const menu = await KitchenMenu.findOne({ kitchenId });
  if (!menu) throw new AppError("Menu not found", 404);

  await menu.deleteOne();

  res.status(200).json({ success: true, message: "Menu deleted" });
});