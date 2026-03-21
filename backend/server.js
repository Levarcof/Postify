import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/useRoutes.js";

// Load env variables
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

app.use("/api",router)

const PORT = 5000;

app.listen(PORT, () => {
    connectDB()
  console.log(`Server running on port ${PORT}`);
});