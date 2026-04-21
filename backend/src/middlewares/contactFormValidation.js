import { body, param, validationResult } from "express-validator";
import { badRequestErr, NotFoundErr } from "../errors/customErors.js";
import ContactForm from "../models/contactFormModel.js";

// Middleware to handle validation errors
const withValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        if (errorMessages[0].startsWith("no enquiry found")) {
          throw new NotFoundErr(errorMessages);
        }
        throw new badRequestErr(errorMessages);
      }
      next();
    },
  ];
};

// Validate enquiry input
export const validateContactFormInput = withValidationErrors([
  // English fields
  body("name")
    .notEmpty()
    .withMessage("Please provide your name")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("phone").notEmpty().withMessage("Please provide your phone number"),
]);

// Validate ID parameter
export const validateContactFormIdParam = withValidationErrors([
  param("id")
    .notEmpty()
    .withMessage("Enquiry id is required")
    .custom(async (value) => {
      const enquiry = await ContactForm.findById(value);
      if (!enquiry) {
        throw new NotFoundErr(`no enquiry found`);
      }
    }),
]);
