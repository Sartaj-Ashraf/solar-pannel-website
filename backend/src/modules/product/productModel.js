import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    briefDescription: { type: String },
    description: { type: String },
    whatIsInBox: { type: String },
    priceMin: { type: Number },
    priceMax: { type: Number },
    modalNumber: { type: String },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      }
    ],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    type: {
      type: String,
      enum: ['product', 'accessories'],
      default: 'product',
    },
    parent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
export default mongoose.models.Product || mongoose.model('Product', productSchema);