import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/useRoutes.js";

// Load env variables
dotenv.config();
const app = express();
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://postify-git-main-vikrams-projects-c74312bb.vercel.app"
// ];

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
   origin: [
    "http://localhost:5173",
    "postify-git-main-vikrams-projects-c74312bb.vercel.app"
  ],
  credentials: true
}));

app.use("/api",router)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    connectDB()
  console.log(`Server running on port ${PORT}`);
});