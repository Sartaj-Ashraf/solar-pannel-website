import Testimonial from "./testimonialModel.js";
import cloudinary from "../../../config/cloudinary.js";
import streamifier from "streamifier";
import { getPaginationParams, getPaginationInfo } from "../../utils/pagination.js";
export const createTestimonial = async (req, res) => {
    try {
        const { name, message, rating, displayType } = req.body;

        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: "Name and message are required",
            });
        }

        const count = await Testimonial.countDocuments();

        let imageData = null;

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "gofixy/testimonials" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });

            imageData = {
                url: result.secure_url,
                public_id: result.public_id,
            };
        }

        const testimonial = await Testimonial.create({
            name,
            message,
            rating: rating || 5,
            displayType: displayType || "normal",
            order: count,
            isActive: false,
            ...(imageData && { image: imageData }),
        });

        res.status(201).json({
            success: true,
            testimonial,
        });

    } catch (error) {
        console.error("Create testimonial error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getTestimonials = async (req, res) => {
    try {
        // Extract pagination params using helper
        const { page, limit, skip } = getPaginationParams(req);

        const {
            status = "active",
            displayType = "normal",
        } = req.query;

        let query = {};

        // Status filter
        if (status === "active") query.isActive = false;
        if (status === "inactive") query.isActive = false;

        // Display type filter
        if (displayType && displayType !== "all") {
            query.displayType = displayType;
        }

        // Get total documents count
        const totalDocs = await Testimonial.countDocuments(query);

        // Fetch paginated data
        const testimonials = await Testimonial.find(query)
            .sort({ order: -1 })
            .skip(skip)
            .limit(limit);

        // Generate pagination info
        const pagination = getPaginationInfo(totalDocs, page, limit);

        res.status(200).json({
            success: true,
            testimonials,
            pagination,
        });

    } catch (error) {
        console.error("Get testimonials error:", error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

/* ================= UPDATE ================= */
export const updateTestimonial = async (req, res) => {
    try {

        const { id } = req.params;

        const testimonial = await Testimonial.findById(id);

        if (!testimonial) {
            return res.status(404).json({ success: false });
        }

        const { name, message, rating, displayType } = req.body;

        testimonial.name = name || testimonial.name;
        testimonial.message = message || testimonial.message;
        testimonial.rating = rating || testimonial.rating;

        if (displayType) {
            testimonial.displayType = displayType;
        }

        if (req.file) {

            if (testimonial.image?.public_id) {
                await cloudinary.uploader.destroy(testimonial.image.public_id);
            }

            const result = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    { folder: "gofixy/testimonials" },
                    (error, result) => {
                        if (error) reject(error);
                        resolve(result);
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);

            });

            testimonial.image = {
                url: result.secure_url,
                public_id: result.public_id,
            };
        }

        await testimonial.save();

        res.status(200).json({
            success: true
        });

    } catch {

        res.status(500).json({
            success: false
        });

    }
};

export const toggleFeaturedTestimonial = async (req, res) => {
    try {

        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial)
            return res.status(404).json({ success: false });

        testimonial.featured = !testimonial.featured;

        await testimonial.save();

        res.status(200).json({ success: true });

    } catch {
        res.status(500).json({ success: false });
    }
};
/* ================= DELETE ================= */
export const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findById(id);
        if (!testimonial)
            return res.status(404).json({ success: false });

        if (testimonial.image?.public_id) {
            await cloudinary.uploader.destroy(
                testimonial.image.public_id
            );
        }

        await testimonial.deleteOne();

        // reindex order
        const list = await Testimonial.find().sort({ order: 1 });
        for (let i = 0; i < list.length; i++) {
            list[i].order = i;
            await list[i].save();
        }

        res.status(200).json({ success: true });

    } catch {
        res.status(500).json({ success: false });
    }
};


/* ================= TOGGLE ================= */
export const toggleTestimonial = async (req, res) => {
    try {

        const testimonial = await Testimonial.findById(req.params.id);

        testimonial.isActive = !testimonial.isActive;

        await testimonial.save();

        res.status(200).json({
            success: true
        });

    } catch {

        res.status(500).json({
            success: false
        });

    }
};

/* ================= REORDER ================= */
export const updateTestimonialOrder = async (req, res) => {
    try {
        const { id } = req.params;
        let { order } = req.body;
        order = Number(order);

        const list = await Testimonial.find().sort({ order: 1 });

        const index = list.findIndex(
            (t) => t._id.toString() === id
        );

        const [moved] = list.splice(index, 1);

        if (order < 0) order = 0;
        if (order > list.length) order = list.length;

        list.splice(order, 0, moved);

        for (let i = 0; i < list.length; i++) {
            list[i].order = i;
            await list[i].save();
        }

        res.status(200).json({ success: true });

    } catch {
        res.status(500).json({ success: false });
    }
};
export const getTestimonialStats = async (req, res) => {
    try {

        const stats = await Testimonial.aggregate([
            {
                $group: {
                    _id: null,

                    totalTestimonials: { $sum: 1 },

                    activeTestimonials: {
                        $sum: {
                            $cond: [{ $eq: ["$isActive", true] }, 1, 0]
                        }
                    },

                    featuredTestimonials: {
                        $sum: {
                            $cond: [{ $eq: ["$displayType", "featured"] }, 1, 0]
                        }
                    },

                    storyTestimonials: {
                        $sum: {
                            $cond: [{ $eq: ["$displayType", "story"] }, 1, 0]
                        }
                    },

                    averageRating: { $avg: "$rating" }

                }
            }
        ]);

        const result = stats[0] || {
            totalTestimonials: 0,
            activeTestimonials: 0,
            featuredTestimonials: 0,
            storyTestimonials: 0,
            averageRating: 0
        };

        const averageRating = Number(result.averageRating.toFixed(2));

        const ratingPercentage = Number(
            ((averageRating / 5) * 100).toFixed(2)
        );

        res.json({
            success: true,

            totalTestimonials: result.totalTestimonials,
            activeTestimonials: result.activeTestimonials,
            featuredTestimonials: result.featuredTestimonials,
            storyTestimonials: result.storyTestimonials,

            averageRating,
            ratingPercentage,
            score: `${averageRating}/5`
        });

    } catch (error) {

        console.error("Testimonial Stats Error:", error);

        res.status(500).json({
            success: false
        });

    }
};
export const updateDisplayType = async (req, res) => {
    try {

        const { id } = req.params;
        const { displayType } = req.body;

        const testimonial = await Testimonial.findById(id);

        if (!testimonial) {
            return res.status(404).json({ success: false });
        }

        testimonial.displayType = displayType;

        await testimonial.save();

        res.status(200).json({
            success: true
        });

    } catch (error) {

        res.status(500).json({
            success: false
        });

    }
};