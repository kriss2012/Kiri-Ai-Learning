import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*", // Adjust this in production to specific frontend domains
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Kiri-App-Version"],
}));
app.use(express.json());

// Actuator Healthcheck (for cron-job uptime checks)
app.get("/actuator/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root ping endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Kiri AI Learning Platform API is online.",
    version: "1.0.0",
    docs: "/v1/docs"
  });
});

// Basic v1 Router setup
import { apiRouter } from "./routes";
app.use("/v1", apiRouter);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Kiri AI Learning Backend running on http://localhost:${PORT}`);
});
