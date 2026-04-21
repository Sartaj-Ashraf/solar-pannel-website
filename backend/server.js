import "express-async-errors";

// config env
import * as dotenv from "dotenv";
dotenv.config();

// create app
import express from "express";
const app = express();

// packages
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import cors from "cors";

// Router imports goes here...

import userRouter from "./src/modules/auth/userRouter.js";
import testimonialRouter from "./src/modules/testimonails/testimonialsRoutes.js";

//public
import path, { dirname } from "path";
import { fileURLToPath } from "url";

//middleware
import errorHandlerMiddleware from "./src/middlewares/errorhandlerMiddleware.js";

// cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.static(path.resolve(__dirname, "./public")));
app.use(express.json());
app.use(cookieParser());


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // This is crucial for PayU
app.set("trust proxy", true);


const allowedOrigins = [
  "https://aijazfurnishers.in",
  "https://www.aijazfurnishers.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, server-side)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// IMPORTANT: handle preflight
app.options("*", cors());


//user router
app.use("/api/v1/auth", userRouter);
//testimonial router
app.use("/api/v1/testimonials", testimonialRouter);

//not found
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

//err HANDLING middleware
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

try {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB connected successfully");

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("Server startup error:", error);
  process.exit(1);
}
