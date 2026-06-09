"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCertificate = verifyCertificate;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_service_1 = require("../services/crypto.service");
async function verifyCertificate(req, res) {
    const { cert_id } = req.params;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    try {
        // 1. Fetch certificate details
        const certificate = await prisma_1.default.certificate.findUnique({
            where: { certificateId: cert_id },
            include: {
                user: {
                    select: {
                        displayName: true,
                        profilePhoto: true,
                        userType: true,
                        college: true,
                        city: true,
                    },
                },
                course: {
                    select: {
                        title: true,
                        category: true,
                        level: true,
                        durationHours: true,
                    },
                },
            },
        });
        if (!certificate) {
            return res.status(404).json({
                verified: false,
                status: "NOT_FOUND",
                message: "No certificate with this ID exists in our registry.",
            });
        }
        // 2. Log Scan Audit Event (PRD FR-QR-003)
        const ipHash = crypto_1.default.createHash("sha256").update(ip).digest("hex");
        const uaHash = crypto_1.default.createHash("sha256").update(userAgent).digest("hex");
        await prisma_1.default.certificateAuditLog.create({
            data: {
                certificateId: certificate.id,
                event: "qr_scanned",
                ipHash,
                userAgentHash: uaHash,
            },
        });
        // 3. Handle Revoked Status (PRD FR-CERT-008)
        if (certificate.status === "revoked") {
            return res.status(200).json({
                verified: false,
                status: "REVOKED",
                message: "This certificate has been revoked.",
                revocationDetails: {
                    revokedAt: certificate.revokedAt,
                    reason: certificate.revokedReason,
                },
                certificateDetails: {
                    certificateId: certificate.certificateId,
                    learnerName: certificate.learnerNameSnapshot,
                    courseTitle: certificate.courseTitleSnapshot,
                },
            });
        }
        // 4. Verify cryptographic signature integrity (PRD SEC-CERT-005)
        const metadataPayload = {
            certificateId: certificate.certificateId,
            userId: certificate.userId,
            courseId: certificate.courseId,
            completionId: certificate.completionId,
            score: certificate.scoreSnapshot,
            issuedAt: certificate.issuedAt.toISOString(),
        };
        const isSignatureValid = (0, crypto_service_1.verifySignature)(JSON.stringify(metadataPayload), certificate.signatureHash);
        if (!isSignatureValid) {
            return res.status(200).json({
                verified: false,
                status: "TAMPERED",
                message: "Cryptographic signature validation failed. This certificate data has been altered.",
                certificateDetails: {
                    certificateId: certificate.certificateId,
                    learnerName: certificate.learnerNameSnapshot,
                    courseTitle: certificate.courseTitleSnapshot,
                },
            });
        }
        // 5. Fetch sponsor information based on saved snapshot
        let sponsorsList = [];
        try {
            const sponsorIds = JSON.parse(certificate.sponsorIdsSnapshot);
            if (sponsorIds.length > 0) {
                sponsorsList = await prisma_1.default.sponsor.findMany({
                    where: {
                        id: { in: sponsorIds },
                    },
                    select: {
                        name: true,
                        logoUrl: true,
                        websiteUrl: true,
                        tier: true,
                    },
                });
            }
        }
        catch (e) {
            console.warn("Failed to parse sponsor snapshots:", e);
        }
        // 6. Return verified dataset
        return res.status(200).json({
            verified: true,
            status: "AUTHENTIC",
            verificationDate: new Date().toISOString(),
            certificateDetails: {
                certificateId: certificate.certificateId,
                issuedAt: certificate.issuedAt,
                pdfUrl: certificate.pdfUrl,
                grade: certificate.scoreSnapshot,
                instructorName: certificate.instructorNameSnapshot,
            },
            learner: {
                fullName: certificate.learnerNameSnapshot,
                profilePhoto: certificate.user.profilePhoto,
                userType: certificate.user.userType,
                college: certificate.user.college,
                city: certificate.user.city,
            },
            course: {
                title: certificate.courseTitleSnapshot,
                category: certificate.course.category,
                level: certificate.course.level,
                durationHours: certificate.course.durationHours,
            },
            sponsors: sponsorsList,
            integrity: {
                algorithm: "RSA-SHA256",
                signatureHash: certificate.signatureHash,
                signedAt: certificate.issuedAt,
            },
        });
    }
    catch (error) {
        console.error("Verification Controller Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to perform certificate validation." });
    }
}
