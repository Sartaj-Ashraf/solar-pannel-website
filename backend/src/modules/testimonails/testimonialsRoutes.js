import express from "express";
import upload from "../../middlewares/multer.js";
import { authenticateUser } from "../../middlewares/authMiddleware.js";

import {
    createTestimonial,
    getTestimonials,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonial,
    updateTestimonialOrder,
    updateDisplayType,
    getTestimonialStats,
} from "./testimonialController.js";

const router = express.Router();

/* CREATE */
router.post(
    "/",
    authenticateUser,
    upload.single("image"),
    createTestimonial
);

/* GET */
router.get("/", getTestimonials);
router.get("/stats", getTestimonialStats);

/* UPDATE */
router.put(
    "/:id",
    authenticateUser,
    upload.single("image"),
    updateTestimonial
);

/* DELETE */
router.delete("/:id", authenticateUser, deleteTestimonial);

/* TOGGLE ACTIVE */
router.patch("/:id/toggle", authenticateUser, toggleTestimonial);

/* UPDATE DISPLAY TYPE */
router.patch("/:id/display-type", authenticateUser, updateDisplayType);

/* REORDER */
router.patch("/:id/order", authenticateUser, updateTestimonialOrder);

export default router;