import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // Add slug here
  image: String,
  description: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
});

export default mongoose.model("Category", categorySchema);
