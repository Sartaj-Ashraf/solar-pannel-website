import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  deleteAllProducts,
  getProductsByCategorySlug,
  searchProducts,
  getProductBySlug,
  getProductAccessories,
  getPersonalizedProducts,
  getPersonalizedAccessories,
  deleteProductImage,
} from './productController.js';

import upload from '../../middlewares/multer.js';

const router = express.Router();

router.post('/bulk', bulkCreateProducts);
router.delete('/all', deleteAllProducts);
router.get('/search', searchProducts);
router.get('/personalized', getPersonalizedProducts);
router.get('/personalized/accessories', getPersonalizedAccessories); 
router.get('/slug/:slug', getProductBySlug);
router.get('/accessories/:id', getProductAccessories); 

router.post('/', upload.array('images', 10), createProduct);
router.post('/image', deleteProductImage);

router.get('/', getProducts);
router.get('/category-slug', getProductsByCategorySlug);
router.get('/:id', getProductById); 

router.put('/:id', upload.array('images', 10), updateProduct);
router.delete('/:id', deleteProduct);

export default router;