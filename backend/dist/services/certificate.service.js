"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificate = generateCertificate;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_service_1 = require("./crypto.service");
const PUBLIC_DIR = path_1.default.join(__dirname, "../../public");
const CERT_DIR = path_1.default.join(PUBLIC_DIR, "certificates");
// Ensure certificate storage folders exist
if (!fs_1.default.existsSync(CERT_DIR)) {
    fs_1.default.mkdirSync(CERT_DIR, { recursive: true });
}
/**
 * Generates an 8-character random uppercase alphanumeric string
 */
function generateRandomSuffix() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function generateCertificate(userId, courseId, completionId, score) {
    try {
        // 1. Fetch User, Course, and Instructor details
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: true,
                sponsors: true,
            },
        });
        if (!user || !course) {
            throw new Error("User or Course details not found.");
        }
        // 2. Generate Certificate ID: KIRI-YYYY-XXXXXXXX
        const year = new Date().getFullYear();
        const suffix = generateRandomSuffix();
        const certificateId = `KIRI-${year}-${suffix}`;
        // 3. Serialize metadata and sign it (PRD SEC-CERT-004)
        const metadataPayload = {
            certificateId,
            userId,
            courseId,
            completionId,
            score,
            issuedAt: new Date().toISOString(),
        };
        const signatureHash = (0, crypto_service_1.signData)(JSON.stringify(metadataPayload));
        // 4. Setup URLs
        const verifyBaseUrl = process.env.VERIFY_URL || "http://localhost:3000/verify";
        const verificationUrl = `${verifyBaseUrl}/${certificateId}?sig=${signatureHash}`;
        const pdfFileName = `${certificateId}.pdf`;
        const pdfFilePath = path_1.default.join(CERT_DIR, pdfFileName);
        const pdfPublicUrl = `/certificates/${pdfFileName}`;
        // 5. Generate scannable QR Code as Data URL
        const qrDataUrl = await qrcode_1.default.toDataURL(verificationUrl, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 120,
        });
        // 6. Draw PDF using PDFKit (A4 Landscape: 841.89 x 595.28 points)
        const doc = new pdfkit_1.default({
            size: "A4",
            layout: "landscape",
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        const writeStream = fs_1.default.createWriteStream(pdfFilePath);
        doc.pipe(writeStream);
        // Background color
        doc.rect(0, 0, 841.89, 595.28).fill("#FCFBF9");
        // Double Borders
        // Outer Border (Navy)
        doc.rect(20, 20, 841.89 - 40, 595.28 - 40)
            .lineWidth(3)
            .stroke("#1D3557");
        // Inner Border (Gold)
        doc.rect(26, 26, 841.89 - 52, 595.28 - 52)
            .lineWidth(1)
            .stroke("#D4AF37");
        // Header Branding
        doc.fillColor("#1D3557");
        doc.fontSize(16).font("Helvetica-Bold").text("KIRI AI Learning", 50, 45);
        doc.fontSize(8).font("Helvetica").text("A division of Kiri App Ecosystem", 50, 62);
        // Sponsor Section (top right)
        if (course.sponsors.length > 0) {
            doc.fillColor("#4A5568");
            doc.fontSize(9).font("Helvetica-Bold").text("Sponsored by:", 600, 45, { align: "right", width: 190 });
            doc.fontSize(10).font("Helvetica").text(course.sponsors.map(s => s.name).join(", "), 600, 58, { align: "right", width: 190 });
        }
        // Main Certificate Text
        doc.fillColor("#1D3557")
            .font("Helvetica-Bold")
            .fontSize(32)
            .text("CERTIFICATE OF COMPLETION", 0, 140, { align: "center" });
        doc.fillColor("#4A5568")
            .font("Helvetica")
            .fontSize(14)
            .text("This certifies that", 0, 190, { align: "center" });
        // Learner Name (large, gold/navy)
        doc.fillColor("#D4AF37")
            .font("Helvetica-Bold")
            .fontSize(28)
            .text(user.displayName, 0, 225, { align: "center" });
        doc.fillColor("#4A5568")
            .font("Helvetica")
            .fontSize(14)
            .text("has successfully completed the structured online course", 0, 275, { align: "center" });
        // Course Title
        doc.fillColor("#1D3557")
            .font("Helvetica-Bold")
            .fontSize(22)
            .text(`"${course.title}"`, 0, 310, { align: "center" });
        // Metadata details
        const dateString = new Date().toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        const metaText = `Duration: ${course.durationHours} Hours  |  Score Achieved: ${score}%  |  Level: ${course.level.toUpperCase()}  |  Issued on: ${dateString}`;
        doc.fillColor("#718096")
            .font("Helvetica")
            .fontSize(10)
            .text(metaText, 0, 355, { align: "center" });
        // Bottom Signatures & QR Code
        // Left signature: Instructor
        doc.moveTo(80, 490).lineTo(260, 490).lineWidth(1).stroke("#A0AEC0");
        doc.fillColor("#1D3557")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(course.instructor.displayName, 80, 498, { width: 180, align: "center" });
        doc.fillColor("#718096")
            .font("Helvetica")
            .fontSize(8)
            .text("Authorized Instructor", 80, 510, { width: 180, align: "center" });
        // Right signature: Director
        doc.moveTo(580, 490).lineTo(760, 490).lineWidth(1).stroke("#A0AEC0");
        doc.fillColor("#1D3557")
            .font("Helvetica-Bold")
            .fontSize(11)
            .text("Kiri App Core Team", 580, 498, { width: 180, align: "center" });
        doc.fillColor("#718096")
            .font("Helvetica")
            .fontSize(8)
            .text("Platform Director", 580, 510, { width: 180, align: "center" });
        // Center QR code image
        const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(qrBuffer, 841.89 / 2 - 40, 435, { width: 80, height: 80 });
        doc.fillColor("#718096")
            .font("Helvetica")
            .fontSize(7)
            .text("Scan to verify authenticity", 0, 520, { align: "center" });
        doc.fillColor("#718096")
            .font("Helvetica")
            .fontSize(8)
            .text(`Certificate ID: ${certificateId}`, 0, 545, { align: "center" });
        doc.end();
        // Wait for the stream to finish writing
        await new Promise((resolve, reject) => {
            writeStream.on("finish", () => resolve(true));
            writeStream.on("error", reject);
        });
        // 7. Store Certificate Record in Database
        const sponsorIds = course.sponsors.map(s => s.id);
        const dbCertificate = await prisma_1.default.certificate.create({
            data: {
                certificateId,
                userId,
                courseId,
                completionId,
                learnerNameSnapshot: user.displayName,
                courseTitleSnapshot: course.title,
                scoreSnapshot: score,
                instructorNameSnapshot: course.instructor.displayName,
                sponsorIdsSnapshot: JSON.stringify(sponsorIds),
                pdfUrl: pdfPublicUrl,
                signatureHash,
                status: "active",
            },
        });
        console.log(`🎓 Certificate generated and saved: ${certificateId}`);
        return dbCertificate;
    }
    catch (error) {
        console.error("Certificate Generation Error:", error);
        throw error;
    }
}
