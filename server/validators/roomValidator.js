import { body } from "express-validator";

export const roomValidator = [

  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("price")
    .isNumeric()
    .withMessage("Price must be a number"),

  body("address")
    .notEmpty()
    .withMessage("Address is required"),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string"),

  body("bedrooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Bedrooms must be a non-negative number"),

  body("bathrooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Bathrooms must be a non-negative number"),

  body("beds")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Beds must be a non-negative number"),

  body("amenities")
    .optional()
    .customSanitizer(value => {
      if (typeof value === "string") {
        try { return JSON.parse(value); } catch { return []; }
      }
      return value;
    }),

  body("amenities.*")
    .optional()
    .isString()
    .withMessage("Each amenity must be a string"),

  body("propertyType")
    .optional()
    .isIn(["Apartment", "House", "Studio"])
    .withMessage("Invalid property type"),

  body("hostLanguage")
    .optional()
    .isIn(["English", "Hindi", "Urdu", "Odia", "Bengali"])
    .withMessage("Invalid host language"),

  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("Availability must be true or false")

];