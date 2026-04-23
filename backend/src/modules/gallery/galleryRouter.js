import express from "express";

import {
  createGalleryImages,
  getAllGalleryImages,
  getGalleryImagesByType,
  deleteGalleryImage,
  deleteBulkGalleryImages,
  getGalleryImageTypesWithCount,
} from "./galleryController.js";
import upload from "../../middlewares/multer.js";
// import {
//   authenticateUser,
//   authorizePermissions,
// } from "../../middleware/authMiddleware.js";

const router = express.Router();


// Public routes
router.get("/", getAllGalleryImages);                     // GET /api/gallery
router.get("/type/:type", getGalleryImagesByType);       // GET /api/gallery/type/Room

// Protected routes (Add your auth middleware here)
// router.use(authenticateUser);
// router.use(authorizePermissions("admin"));

router.delete("/bulk", deleteBulkGalleryImages);                   // DELETE /api/gallery/bulk
router.post("/", upload.array('images'), createGalleryImages);     // POST /api/gallery
router.delete("/:id", deleteGalleryImage);                         // DELETE /api/gallery/:id
router.get("/type", getGalleryImageTypesWithCount);                // GET /api/gallery/type

export default router;