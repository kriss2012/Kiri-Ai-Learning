"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseLogin = firebaseLogin;
exports.getCurrentUser = getCurrentUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const admin = __importStar(require("firebase-admin"));
const prisma_1 = __importDefault(require("../config/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || "kiri-ai-learning-local-dev-jwt-secret-key-32-chars-long";
// Initialize Firebase Admin SDK if service account is available
let firebaseAppInitialized = false;
try {
    // If FIREBASE_CONFIG or google credentials are set, initialize
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp();
        firebaseAppInitialized = true;
        console.log("🔥 Firebase Admin SDK initialized successfully");
    }
}
catch (error) {
    console.warn("⚠️ Firebase Admin SDK could not be initialized. Using dev mock auth fallback only.", error);
}
async function firebaseLogin(req, res) {
    const { idToken, displayName, college, city } = req.body;
    if (!idToken) {
        return res.status(400).json({ error: "Bad Request", message: "Missing idToken in request body." });
    }
    try {
        let decodedToken;
        // 1. Check for local dev mock tokens
        if (idToken === "mock-student-token" || process.env.NODE_ENV !== "production" && idToken.startsWith("mock-")) {
            console.log(`🧪 Mock token detected: ${idToken}`);
            if (idToken === "mock-instructor-token") {
                // Find seeded instructor
                const instructor = await prisma_1.default.user.findFirst({
                    where: { userType: "educator" },
                });
                if (!instructor) {
                    return res.status(500).json({ error: "Server Error", message: "Seed database first to log in as instructor." });
                }
                decodedToken = {
                    uid: instructor.firebaseUid,
                    email: instructor.email,
                    name: instructor.displayName,
                    picture: instructor.profilePhoto || undefined,
                };
            }
            else {
                // Create or find mock student
                decodedToken = {
                    uid: "mock-student-uid-12345",
                    email: "student@kiriapp.com",
                    name: displayName || "Mock Student",
                    picture: "https://api.dicebear.com/7.x/adventurer/svg?seed=mock-student",
                };
            }
        }
        else {
            // 2. Real Firebase Verification
            if (!firebaseAppInitialized) {
                return res.status(500).json({
                    error: "Configuration Error",
                    message: "Firebase Admin SDK is not initialized. Cannot verify real token.",
                });
            }
            decodedToken = await admin.auth().verifyIdToken(idToken);
        }
        const email = decodedToken.email;
        if (!email) {
            return res.status(400).json({ error: "Bad Request", message: "Firebase identity token must include email." });
        }
        // 3. Find or upsert user profile
        let user = await prisma_1.default.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
        });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: email,
                    displayName: decodedToken.name || displayName || email.split("@")[0],
                    profilePhoto: decodedToken.picture || null,
                    userType: email.includes("admin") ? "admin" : "student", // Simple auto-admin detection
                    college: college || null,
                    city: city || null,
                    emailVerified: true,
                },
            });
            console.log(`🆕 User synced and registered via Firebase SSO: ${user.email}`);
        }
        else {
            // Keep name/photo updated from Firebase identity provider
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    displayName: decodedToken.name || user.displayName,
                    profilePhoto: decodedToken.picture || user.profilePhoto,
                },
            });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Forbidden", message: "This user profile has been deactivated." });
        }
        // 4. Generate Kiri Platform JWT Token
        const payload = {
            id: user.id,
            email: user.email,
            userType: user.userType,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "24h" });
        return res.status(200).json({
            message: "Authentication successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                profilePhoto: user.profilePhoto,
                userType: user.userType,
                college: user.college,
                city: user.city,
            },
        });
    }
    catch (error) {
        console.error("Firebase Login Verification Error:", error);
        return res.status(401).json({ error: "Unauthorized", message: "Failed to verify Firebase authentication token." });
    }
}
async function getCurrentUser(req, res) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized", message: "No active session." });
    }
    return res.status(200).json({ user: req.user });
}
