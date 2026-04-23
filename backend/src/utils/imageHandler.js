import { v2 as cloudinary } from "cloudinary";
import { badRequestErr } from "../errors/customErors.js";

// Helper function to upload images to Cloudinary
export const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "dk-electronics-gallery", 
            transformation: [
              { width: 800, height: 600, crop: "fill" },  
              { quality: "auto" }, 
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          }
        )
        .end(file.buffer);
    });
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new badRequestErr("Failed to upload images to Cloudinary");
  }
};

// Helper function to delete images from Cloudinary
export const deleteImagesFromCloudinary = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) return;

  const deletePromises = publicIds.map((publicId) =>
    cloudinary.uploader.destroy(publicId)
  );

  try {
    await Promise.all(deletePromises);
  } catch (error) {
    throw new badRequestErr("Failed to delete images from Cloudinary");
  }
};
