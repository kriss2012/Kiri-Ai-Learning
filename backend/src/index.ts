import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://api.dicebear.com", "https://cdn.kiriapp.com"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
      connectSrc: ["'self'", "*"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later." }
});
app.use("/v1", apiLimiter);

// Middleware
app.use(cors({
  origin: "*", // Adjust this in production to specific frontend domains
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Kiri-App-Version"],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

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

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Kiri AI Learning Backend running on http://localhost:${PORT}`);
  });
}

export default app;
