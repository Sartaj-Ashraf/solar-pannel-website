// utils/imageLocalHandler.js
import { compressAndSaveImage, generateFilename, deleteImage } from './imageUtils.js';

// Upload multiple images (array of multer files) to local folder
export const uploadImagesLocally = async (files, folder = 'Gallery') => {
  const uploads = [];
  try {
    for (const file of files) {
      const filename = generateFilename(file.originalname);
      const localUrl = await compressAndSaveImage(file.buffer, filename, folder);
      uploads.push({
        url: localUrl,
        filename,
      });
    }
    return uploads;
  } catch (error) {
    // On error, cleanup already saved files
    for (const img of uploads) {
      deleteImage(img.url);
    }
    throw new Error('Failed to upload images locally: ' + error.message);
  }
};

// Delete images by local URLs (relative to /uploads)
export const deleteImagesLocally = async (urls = []) => {
  for (const url of urls) {
    deleteImage(url);
  }
};
