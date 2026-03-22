import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import router from "./routes/useRoutes.js";
import { createServer } from "http";
import { initIO } from "./utils/socket.js";

// Load env variables
dotenv.config();
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
   origin:true,
  credentials: true
}));

app.use("/api",router)

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    connectDB()
  console.log(`Server running on port ${PORT}`);
});

initIO(httpServer);