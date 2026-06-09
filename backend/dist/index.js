"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security headers with Helmet
app.use((0, helmet_1.default)({
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
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later." }
});
app.use("/v1", apiLimiter);
// Middleware
app.use((0, cors_1.default)({
    origin: "*", // Adjust this in production to specific frontend domains
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Kiri-App-Version"],
}));
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// Actuator Healthcheck (for cron-job uptime checks)
app.get("/actuator/health", (req, res) => {
    res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Root ping endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Kiri AI Learning Platform API is online.",
        version: "1.0.0",
        docs: "/v1/docs"
    });
});
// Basic v1 Router setup
const routes_1 = require("./routes");
app.use("/v1", routes_1.apiRouter);
// Global Error Handler
app.use((err, req, res, next) => {
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
exports.default = app;
