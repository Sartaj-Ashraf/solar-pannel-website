import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        rating: {
            type: Number,
            default: 5,
            min: 1,
            max: 5
        },

        image: {
            url: {
                type: String,
                default: ""
            },
            public_id: {
                type: String,
                default: ""
            }
        },

        displayType: {
            type: String,
            enum: ["normal", "featured", "story"],
            default: "normal",
            index: true
        },

        order: {
            type: Number,
            default: 0,
            index: true
        },

        isActive: {
            type: Boolean,
            default: false,
            index: true
        }

    },
    {
        timestamps: true
    }
);

export default mongoose.model("Testimonial", testimonialSchema); 