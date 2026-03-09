import { body } from "express-validator";

export const kitchenValidator = [

body("kitchenName")
.notEmpty()
.withMessage("Kitchen name is required"),

body("address")
.notEmpty()
.withMessage("Address is required"),

body("foodType")
.notEmpty()
.withMessage("Food type is required")
.isIn(["veg","nonveg","both"])
.withMessage("Invalid food type"),

body("maxSubscribers")
.notEmpty()
.withMessage("Max subscribers required")
.isNumeric()
.withMessage("Must be number"),

body("halal")
.optional()
.isBoolean(),

body("oneMealPrice")
.optional()
.isNumeric(),

body("twoMealPrice")
.optional()
.isNumeric(),

body("threeMealPrice")
.optional()
.isNumeric()

];