"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || "kiri-ai-learning-local-dev-jwt-secret-key-32-chars-long";
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized", message: "Missing or malformed Authorization header." });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Fetch user from DB to ensure they exist and are active
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                displayName: true,
                userType: true,
                isActive: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: "Unauthorized", message: "User not found." });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Forbidden", message: "User account is deactivated." });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session token." });
    }
}
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await prisma_1.default.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    userType: true,
                    isActive: true,
                },
            });
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // Ignore invalid tokens for optional endpoints
        next();
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized", message: "Authentication required." });
        }
        if (!allowedRoles.includes(req.user.userType)) {
            return res.status(403).json({ error: "Forbidden", message: "Insufficient privileges to access this resource." });
        }
        next();
    };
}
