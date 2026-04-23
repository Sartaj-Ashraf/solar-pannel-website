import Product from './productModel.js';
import Category from '../category/categoryModel.js';
import { getPaginationParams, getPaginationInfo } from '../../utils/pagination.js';
import { getUniqueSlug, makeSlug } from '../../utils/slugUtils.js';


const flattenDedup = (arrays) => [...new Set([].concat(...arrays))];

const safeNumber = (val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return Number(val);
};

const getCategoryPath = async (categoryId) => {
  const ids = [];
  let current = await Category.findById(categoryId).lean();
  while (current) {
    ids.push(current._id.toString());
    current = current.parent ? await Category.findById(current.parent).lean() : null;
  }
  return ids;
};

const fillWithSimilarItems = async (existingIds, type, countNeeded) => {
  return Product.find({ _id: { $nin: existingIds }, type })
    .sort({ createdAt: -1 })
    .limit(countNeeded)
    .populate('categories')
    .populate('parent');
};

// ─── Controllers ─────────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
  try {
    let {
      name, briefDescription, description, whatIsInBox,
      priceMin, priceMax, modalNumber, categories, type, parent,
    } = req.body;

    priceMin = safeNumber(priceMin);
    priceMax = safeNumber(priceMax);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (priceMax !== undefined && priceMax < priceMin) {
      return res.status(400).json({
        success: false,
        message: 'priceMax must be greater than or equal to priceMin.',
      });
    }

    const slug = await getUniqueSlug(Product, makeSlug(name));

    // Upload all images to Cloudinary
    const images = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const result = await uploadImageToCloudinary(file.buffer);
        images.push(result); // { url, publicId }
      }
    }

    // Resolve full category ancestry
    const inputCategoryIds = categories ? JSON.parse(categories) : [];
    let allCategoryIds = [];
    for (const id of inputCategoryIds) {
      allCategoryIds.push(await getCategoryPath(id));
    }
    allCategoryIds = flattenDedup(allCategoryIds);

    const product = new Product({
      name,
      slug,
      briefDescription,
      description,
      whatIsInBox,
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      modalNumber,
      images,
      categories: allCategoryIds,
      type: type || 'product',
      parent: parent ? JSON.parse(parent) : [],
      partner: partner || null,
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let {
      name, briefDescription, description, whatIsInBox,
      priceMin, priceMax, modalNumber, categories,
      type, parent, partner,
    } = req.body;

    priceMin = safeNumber(priceMin);
    priceMax = safeNumber(priceMax);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (priceMin !== undefined) {
      if (isNaN(priceMin)) return res.status(400).json({ success: false, message: 'priceMin must be a valid number.' });
      product.priceMin = priceMin;
    }

    if (priceMax !== undefined) {
      if (isNaN(priceMax)) return res.status(400).json({ success: false, message: 'priceMax must be a valid number.' });
      const effectivePriceMin = priceMin ?? product.priceMin;
      if (priceMax < effectivePriceMin) {
        return res.status(400).json({
          success: false,
          message: 'priceMax must be greater than or equal to priceMin.',
        });
      }
      product.priceMax = priceMax;
    }

    if (name && name !== product.name) {
      product.slug = await getUniqueSlug(Product, makeSlug(name), product._id);
      product.name = name;
    }

    // Append new images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadImageToCloudinary(file.buffer);
        product.images.push(result); // { url, publicId }
      }
    }

    if (briefDescription !== undefined) product.briefDescription = briefDescription;
    if (modalNumber !== undefined) product.modalNumber = modalNumber;
    if (description !== undefined) product.description = description;
    if (whatIsInBox !== undefined) product.whatIsInBox = whatIsInBox;

    if (categories !== undefined) {
      const inputCategoryIds = JSON.parse(categories);
      let allCategoryIds = [];
      for (const id of inputCategoryIds) {
        allCategoryIds.push(await getCategoryPath(id));
      }
      product.categories = flattenDedup(allCategoryIds);
    }

    if (type !== undefined) product.type = type;
    if (parent !== undefined) product.parent = JSON.parse(parent);
    if (partner !== undefined) product.partner = partner;

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { productId, publicId } = req.body;

    if (!productId || !publicId) {
      return res.status(400).json({ success: false, message: 'productId and publicId are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const imageIndex = product.images.findIndex((img) => img.publicId === publicId);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found in product' });
    }

    await deleteImageFromCloudinary(publicId);
    product.images.splice(imageIndex, 1);
    await product.save();

    res.json({ success: true, message: 'Image deleted successfully', data: product.images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete all images from Cloudinary
    for (const image of product.images) {
      await deleteImageFromCloudinary(image.publicId);
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductAccessories = async (req, res) => {
  try {
    const products = await Product.find({ parent: req.params.id })
      .populate('categories')
      .populate('parent');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const filter = {};
    if (req.query.category) filter.categories = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.partner) filter.partner = req.query.partner;
    
    const [products, totalDocs] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('categories')
        .populate('parent')
        .populate('partner')
        .populate('brochure')
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data: products, pagination: getPaginationInfo(totalDocs, page, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const products = await Product.find({
      name: { $regex: req.query.search, $options: 'i' },
    }).select('name slug').limit(20);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('categories').populate('parent').populate('features')
      .populate('faqs').populate('specifications').populate('partner').populate('brochure');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories').populate('parent');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPersonalizedProducts = async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);

    if (ids.length === 0) {
      const products = await Product.find({ type: 'product' })
        .populate('categories').populate('parent')
        .limit(8).sort({ updatedAt: -1 });
      return res.json({ success: true, data: products });
    }

    const products = await Product.find({ _id: { $in: ids }, type: 'product' })
      .populate('categories').populate('parent').limit(8);

    const countNeeded = 8 - products.length;
    const extra = countNeeded > 0
      ? await fillWithSimilarItems(products.map((p) => p._id), 'product', countNeeded)
      : [];

    res.json({ success: true, data: [...products, ...extra] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPersonalizedAccessories = async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);

    if (ids.length === 0) {
      const accessories = await Product.find({ type: 'accessories' })
        .populate('categories').populate('parent')
        .limit(8).sort({ updatedAt: -1 });
      return res.json({ success: true, data: accessories });
    }

    const accessories = await Product.find({ _id: { $in: ids }, type: 'accessories' })
      .populate('categories').populate('parent').limit(8);

    const countNeeded = 8 - accessories.length;
    const extra = countNeeded > 0
      ? await fillWithSimilarItems(accessories.map((p) => p._id), 'accessories', countNeeded)
      : [];

    res.json({ success: true, data: [...accessories, ...extra] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page, limit, skip } = getPaginationParams(req);
    const filter = { categories: categoryId };

    const [products, totalDocs] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit)
        .populate('categories').populate('parent').sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data: products, pagination: getPaginationInfo(totalDocs, page, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug, search, partner } = req.query;
    const { page, limit, skip } = getPaginationParams(req);
    const filter = {};

    if (slug) {
      const category = await Category.findOne({ slug }).lean();
      if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
      filter.categories = category._id;
    }

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (req.query.type) filter.type = req.query.type;
    if (partner) filter.partner = partner;

    const [products, totalDocs] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit)
        .populate('categories').populate('parent').sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    const category = slug ? await Category.findOne({ slug }).lean() : null;

    res.json({
      success: true,
      data: products,
      pagination: getPaginationInfo(totalDocs, page, limit),
      category: category
        ? { _id: category._id, name: category.name, slug: category.slug, description: category.description }
        : null,
      filters: { slug: slug || null, search: search || null },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'products array is required' });
    }

    const created = [];

    for (const data of products) {
      const { name, briefDescription, description, whatIsInBox, priceMin, priceMax, sku, type, categoryName, imagesData } = data;

      if (priceMin > priceMax) {
        return res.status(400).json({ success: false, message: 'priceMin must be <= priceMax' });
      }

      const category = await Category.findOne({ name: categoryName }).lean();
      if (!category) {
        return res.status(404).json({ success: false, message: `Category "${categoryName}" not found` });
      }

      const slug = await getUniqueSlug(Product, makeSlug(name));

      // Upload base64 images to Cloudinary
      const images = [];
      if (Array.isArray(imagesData)) {
        for (const base64 of imagesData) {
          const buffer = Buffer.from(base64.split(';base64,').pop(), 'base64');
          const result = await uploadImageToCloudinary(buffer);
          images.push(result); // { url, publicId }
        }
      }

      const prod = new Product({
        name, slug, briefDescription, description, whatIsInBox,
        priceMin, priceMax, sku, images,
        categories: [category._id],
        type: type || 'product',
        parent: [],
      });

      await prod.save();
      created.push(prod);
    }

    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAllProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ success: true, message: 'All products deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};