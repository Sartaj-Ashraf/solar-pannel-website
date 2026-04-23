import Category from './categoryModel.js';
// import Product from '../models/productModel.js';
import {
  compressAndSaveImage,
  generateFilename,
  deleteImage
} from '../../utils/imageUtils.js';
import { makeSlug, getUniqueSlug } from '../../utils/slugUtils.js';
const pathName = 'categories';
/**
 * CREATE a new category
 */
const flattenDedup = (arrays) => [...new Set([].concat(...arrays))];


export const createCategory = async (req, res) => {
  try {
    const { name, description, parent } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Slug generation
    const baseSlug = makeSlug(name);
    const slug = await getUniqueSlug(Category, baseSlug);

    // Image handling
    let image = null;
    if (req.file) {
      const filename = generateFilename(req.file.originalname);
      image = await compressAndSaveImage(req.file.buffer, filename, pathName);
    }

    // Create category
    const category = new Category({
      name,
      slug,
      description,
      parent: parent || null,
      image
    });

    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * GET all categories as a flat list (frontend can build a tree if needed)
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parent', 'name _id').lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET category by ID with its parent populated
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name _id' )
      .exec();

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCategoriesByParentId = async (req, res) => {
  try {
    const cat = await Category.findOne({ slug: req.params.id });
    
    if (!cat) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent category not found' 
      });
    }
    
    const categoriesWithHasChild = await Category.aggregate([
      // Match categories with the specified parent
      { $match: { parent: cat._id } },
      
      // Lookup to check if each category has children
      {
        $lookup: {
          from: 'medicocategories', // Your collection name
          localField: '_id',
          foreignField: 'parent',
          as: 'children'
        }
      },
      
      // Add hasChild field
      {
        $addFields: {
          hasChild: { $gt: [{ $size: '$children' }, 0] }
        }
      },
      
      // Remove the children array
      {
        $project: {
          children: 0
        }
      }
    ]);
    
    res.json({ success: true, data: categoriesWithHasChild ,parent:cat});
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * GET parent categories with their children
 */
export const getParentCategoriesWithChildren = async (req, res) => {
  try {
    // Fetch all categories
    const categories = await Category.find({}).lean();
    // Build a map of _id to category object
    const map = {};
    categories.forEach(cat => {
      cat.children = [];
      map[cat._id.toString()] = cat;
    });
    
    // Populate children arrays
    const roots = [];
    categories.forEach(cat => {
      
      if (cat.parent) {
        const parent = map[cat.parent.toString()];
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        roots.push(cat);
      }
    });


    res.json({ success: true, data: roots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getRentedParentCategoriesWithChildren =  async (req,res) => {

  try{
     // 1️⃣ Fetch all products that are either:
      //    - rented products
      //    - OR accessories
      //    Using `$or` to include both conditions
      const rentedProducts = await Product.find({
        $or: [
          { isRented: true },
          { type: "accessories" },
        ],
      }).lean(); // `lean()` returns plain JS objects for better performance
      // 2️⃣ Extract category IDs from each product
      //    Each product may have multiple categories
      const CategoryIds = rentedProducts.map(product => {
        return product.categories;
      });


      // 3️⃣ Flatten nested category arrays and remove duplicate IDs
      //    Result: a unique list of category ObjectIds
      const allCategoryIds = flattenDedup(CategoryIds);


      // 4️⃣ Fetch all category documents matching the collected IDs
      const CategoriesByIds = await Category.find({
        _id: { $in: allCategoryIds },
      }).lean();


      // 5️⃣ Create a lookup map of categories by their ID
      //    This helps us quickly find parent categories
      const map = {};
      CategoriesByIds.forEach(cat => {
        cat.children = []; // Initialize children array for tree structure
        map[cat._id.toString()] = cat;
      });


      // 6️⃣ Build a hierarchical category tree
      //    - If a category has a parent, add it to the parent's children
      //    - Otherwise, treat it as a root category
      const roots = [];
      CategoriesByIds.forEach(cat => {
        if (cat.parent) {
          const parent = map[cat.parent.toString()];
          if (parent) {
            parent.children.push(cat);
          }
        } else {
          roots.push(cat); // Top-level categories
        }
      });
          res.status(200).json({ success: true, data: roots });

    }
    catch(error){ 
       res.status(500).json({ success: false, message: error.message });
    }

  }

  
    

export const getParentCategories = async (req, res) => {
  try {
    const categoriesWithHasChild = await Category.aggregate([
      // Match parent categories only
      { $match: { parent: null } },
      
      // Lookup children for each category
      {
        $lookup: {
          from: 'medicocategories', // Your collection name
          localField: '_id',
          foreignField: 'parent',
          as: 'children'
        }
      },
      
      // Add hasChild field
      {
        $addFields: {
          hasChild: { $gt: [{ $size: '$children' }, 0] }
        }
      },
      
      // Remove the children array (we only need the hasChild boolean)
      {
        $project: {
          children: 0
        }
      }
    ]);
    
    res.json({ success: true, data: categoriesWithHasChild });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE category by ID
 */
export const updateCategory = async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Slug update if name changed
    if (name && name !== category.name) {
      const baseSlug = makeSlug(name);
      const uniqueSlug = await getUniqueSlug(Category, baseSlug, category._id);
      category.slug = uniqueSlug;
    }

    // Image update
    if (req.file) {
      if (category.image) {
        deleteImage(category.image);
      }
      const filename = generateFilename(req.file.originalname);
      category.image = await compressAndSaveImage(req.file.buffer, filename, pathName);
    }

    if (name) category.name = name;
    if (description) category.description = description;
    category.parent = parent || null;

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE category by ID
 */

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Prevent deletion if category has children
    const childCount = await Category.countDocuments({ parent: category._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete or reassign them first.',
      });
    }

    // Prevent deletion if any product is related to this category
    const linkedProductCount = await Product.countDocuments({ categories: category._id });
    if (linkedProductCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. There are products associated with this category. Remove or reassign them first.',
      });
    }

    // Remove image from disk if exists
    if (category.image) {
      deleteImage(category.image);
    }

    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// for test purpose

  export const bulkCreateCategories = async (req, res) => {
    try {
      const { parentCategories, subCategories, subSubCategories } = req.body;

      if (!Array.isArray(parentCategories) || parentCategories.length === 0) {
        return res.status(400).json({ success: false, message: 'parentCategories array is required' });
      }

      // 1. Insert parent categories with slug
      const parentDocs = [];
      for (const cat of parentCategories) {
        if (!cat.name) continue;
        const baseSlug = makeSlug(cat.name);
        const slug = await getUniqueSlug(Category, baseSlug);
        const category = new Category({
          name: cat.name,
          description: cat.description || '',
          slug
        });
        await category.save();
        parentDocs.push(category);
      }

      // Map parentName => ObjectId
      const parentNameToId = {};
      for (const doc of parentDocs) {
        parentNameToId[doc.name] = doc._id;
      }

      // 2. Insert subcategories, link to parents by name, with slug
      const subDocs = [];
      if (Array.isArray(subCategories)) {
        for (const cat of subCategories) {
          if (!cat.name || !cat.parentName) continue;
          const parentId = parentNameToId[cat.parentName];
          if (!parentId) continue;
          const baseSlug = makeSlug(cat.name);
          // Check uniqueness scoped globally (you may scope per parent if you want)
          const slug = await getUniqueSlug(Category, baseSlug);
          const category = new Category({
            name: cat.name,
            description: cat.description || '',
            parent: parentId,
            slug
          });
          await category.save();
          subDocs.push(category);
        }
      }

      // Map subCategoryName => ObjectId for next level
      const subNameToId = {};
      for (const doc of subDocs) {
        subNameToId[doc.name] = doc._id;
      }

      // 3. Insert sub-subcategories, link to subcategories by name, with slug
      const subSubDocs = [];
      if (Array.isArray(subSubCategories)) {
        for (const cat of subSubCategories) {
          if (!cat.name || !cat.parentName) continue;
          const parentId = subNameToId[cat.parentName];
          if (!parentId) continue;
          const baseSlug = makeSlug(cat.name);
          const slug = await getUniqueSlug(Category, baseSlug);
          const category = new Category({
            name: cat.name,
            description: cat.description || '',
            parent: parentId,
            slug
          });
          await category.save();
          subSubDocs.push(category);
        }
      }

      res.status(201).json({
        success: true,
        parentCategories: parentDocs,
        subCategories: subDocs,
        subSubCategories: subSubDocs
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };


export const deleteAllCategories = async (req, res) => {
  try {
    await Category.deleteMany();
    res.json({ success: true, message: 'All categories deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};