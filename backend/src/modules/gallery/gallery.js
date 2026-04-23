import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gallery", gallerySchema);
