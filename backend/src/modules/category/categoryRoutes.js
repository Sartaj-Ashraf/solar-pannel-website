import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkCreateCategories,
  deleteAllCategories,
  getParentCategoriesWithChildren,
  getParentCategories,
  getCategoriesByParentId,
  getRentedParentCategoriesWithChildren
} from './categoryController.js';

import upload from '../../middlewares/multer.js';

const router = express.Router();

// Upload single image for category optional field named 'image'
router.delete('/all', deleteAllCategories);
router.get('/parent-with-children', getParentCategoriesWithChildren);
router.get('/rented-categories', getRentedParentCategoriesWithChildren);
router.get('/parent', getParentCategories);
router.get('/parent/:id', getCategoriesByParentId);

router.post('/', upload.single('image'), createCategory);

router.get('/', getCategories);

router.get('/:id', getCategoryById);

router.put('/:id', upload.single('image'), updateCategory);

router.delete('/:id', deleteCategory);

router.post('/bulk', bulkCreateCategories);


export default router;
