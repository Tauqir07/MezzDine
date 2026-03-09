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
    .withMessage("Address is required")
];
