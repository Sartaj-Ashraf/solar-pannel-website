  import multer from 'multer';
  import sharp from 'sharp';
  import path from 'path';
  import fs from 'fs';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Ensure uploads directory exists dynamically
  export const ensureUploadsDir = (folderPath) => {
    const uploadsDir = path.join(__dirname, '../public/uploads', folderPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    return uploadsDir;
  };

  // Multer in-memory storage for image uploads
  export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB limit
    },
  });

  // Compress and save uploaded image buffer
  export const compressAndSaveImage = async (buffer, filename, folderPath, type = 'jpeg') => {
    try {
      const uploadsDir = ensureUploadsDir(folderPath);
      const outputPath = path.join(uploadsDir, filename);

      await sharp(buffer)
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        [type]({ quality: 90, progressive: true })
        .toFile(outputPath);

      // Return path relative to /public to use in URLs
      return `/uploads/${folderPath}/${filename}`;
    } catch (error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
  };

  // Generate a unique filename for uploaded file
  export const generateFilename = (originalname) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(originalname);
    return `${timestamp}-${random}${ext}`;
  };

  // Delete image given a relative public path (starting with /uploads)
  export const deleteImage = (imagePath) => {
    try {
      const fullPath = path.join(__dirname, '../public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
