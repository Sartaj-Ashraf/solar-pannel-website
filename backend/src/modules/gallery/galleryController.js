import DevillazGallery from "./gallery.js";
import { uploadImagesToCloudinary, deleteImagesFromCloudinary } from "../../utils/imageHandler.js";
import { badRequestErr, NotFoundErr } from "../../errors/customErors.js";


export const createGalleryImages = async (req, res) => {
  try {
    const { type } = req.body;
    const files = req.files;

    // Validation
    if (!type) {
      throw new badRequestErr("Image type is required");
    }

    if (!files || files.length === 0) {
      throw new badRequestErr("At least one image file is required");
    }

    // Validate type against enum values
    const validTypes = [
      "Room",
      "Outdoors", 
      "Facade",
      "Washroom",
      "Entrance",
      "Reception",
      "Common Area",
      "Restaurant",
      "Play Area"
    ];

    if (!validTypes.includes(type)) {
      throw new badRequestErr(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }

    // Upload images to Cloudinary
    const uploadedImages = await uploadImagesToCloudinary(files);

    // Create gallery entries in database
    const galleryEntries = uploadedImages.map(image => ({
      url: image.url,
      publicId: image.publicId,
      type: type
    }));

    const savedImages = await DevillazGallery.insertMany(galleryEntries);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${savedImages.length} images`,
      data: savedImages,
      count: savedImages.length
    });

  } catch (error) {
    console.error("Error creating gallery images:", error);
    
    // If images were uploaded to Cloudinary but database save failed, clean up
    if (error.uploadedImages) {
      try {
        const publicIds = error.uploadedImages.map(img => img.publicId);
        await deleteImagesFromCloudinary(publicIds);
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded images:", cleanupError);
      }
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create gallery images"
    });
  }
};

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
export const getAllGalleryImages = async (req, res) => {
  try {
    const { type, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Build filter object
    const filter = {};
    if (type) {
      filter.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get images with pagination
    const images = await DevillazGallery.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination info
    const totalImages = await DevillazGallery.countDocuments(filter);
    const totalPages = Math.ceil(totalImages / parseInt(limit));

    // Group images by type for easy frontend consumption
    const imagesByType = await DevillazGallery.aggregate([
      ...(type ? [{ $match: { type } }] : []),
      {
        $group: {
          _id: "$type",
          images: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        images,
        imagesByType,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalImages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images"
    });
  }
};

// @desc    Get gallery images by type
// @route   GET /api/gallery/type/:type
// @access  Public
export const getGalleryImagesByType = async (req, res) => {
  try {
    const { type } = req.params;
    // Validate type
    const validTypes = [
      "Room",
      "Outdoors",
      "Facade", 
      "Washroom",
      "Entrance",
      "Reception",
      "Common Area",
      "Restaurant",
      "Play Area"
    ];

    if (!validTypes.includes(type)) {
      throw new badRequestErr(`Invalid type. Must be one of: ${validTypes.join(", ")}`);
    }

    // Get images
    const images = await DevillazGallery.find({ type })
    const totalImages = await DevillazGallery.countDocuments({ type });

    res.status(200).json({
      success: true,
      data: {
        type,
        images,
        totalImages
      }
    });

  } catch (error) {
    console.error("Error fetching images by type:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch images by type"
    });
  }
};

// @desc    Delete single gallery image
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
export const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await DevillazGallery.findById(id);

    if (!image) {
      throw new NotFoundErr("Gallery image not found");
    }

    // Delete from Cloudinary
    await deleteImagesFromCloudinary([image.publicId]);

    // Delete from database
    await DevillazGallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting gallery image:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete gallery image"
    });
  }
};

// @desc    Delete multiple gallery images
// @route   DELETE /api/gallery/bulk
// @access  Private/Admin
export const deleteBulkGalleryImages = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      throw new badRequestErr("Array of image IDs is required");
    }

    // Get images to delete
    const imagesToDelete = await DevillazGallery.find({
      _id: { $in: imageIds }
    });

    if (imagesToDelete.length === 0) {
      throw new NotFoundErr("No images found with provided IDs");
    }

    // Extract public IDs for Cloudinary deletion
    const publicIds = imagesToDelete.map(image => image.publicId);

    // Delete from Cloudinary
    await deleteImagesFromCloudinary(publicIds);

    // Delete from database
    const deleteResult = await DevillazGallery.deleteMany({
      _id: { $in: imageIds }
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} images`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error("Error deleting bulk gallery images:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete gallery images"
    });
  }
};

export const getGalleryImageTypesWithCount = async (req, res) => {
    const imageTypes = await DevillazGallery.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]).sort({ _id: 1 });
    res.status(200).json({
      success: true,
      data: imageTypes
    }); 
};