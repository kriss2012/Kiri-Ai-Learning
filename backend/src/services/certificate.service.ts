import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import prisma from "../config/prisma";
import { signData } from "./crypto.service";

const PUBLIC_DIR = path.join(__dirname, "../../public");
const CERT_DIR = path.join(PUBLIC_DIR, "certificates");

// Ensure certificate storage folders exist
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * Generates an 8-character random uppercase alphanumeric string
 */
function generateRandomSuffix(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateCertificate(
  userId: string,
  courseId: string,
  completionId: string,
  score: number
) {
  try {
    // 1. Fetch User, Course (with lessons), and Instructor details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        sponsors: true,
        lessons: true,
      },
    });

    if (!user || !course) {
      throw new Error("User or Course details not found.");
    }

    // 1b. Independent Verification check to prevent unauthorized issuance (BUG-04)
    // All lessons completed
    const totalLessons = course.lessons.length;
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        courseId,
        status: "completed",
      },
    });

    if (completedProgress.length < totalLessons) {
      throw new Error(`Cannot generate certificate: only completed ${completedProgress.length} of ${totalLessons} lessons.`);
    }

    // All quizzes passed
    const courseQuizzes = await prisma.quiz.findMany({
      where: { courseId },
    });

    for (const quiz of courseQuizzes) {
      const passedAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId,
          quizId: quiz.id,
          passed: true,
        },
      });

      if (!passedAttempt) {
        throw new Error(`Cannot generate certificate: Quiz "${quiz.title}" not passed.`);
      }
    }

    // Email verified (unless mock user)
    const isMockUser = user.firebaseUid.includes("mock") || user.email.includes("mock") || user.email.includes("student@kiriapp.com");
    if (!user.emailVerified && !isMockUser) {
      throw new Error("Cannot generate certificate: Email not verified.");
    }

    // Anti-fraud watch duration (5% of course duration)
    if (!isMockUser) {
      const minSeconds = course.durationHours * 3600 * 0.05;
      const totalWatchSeconds = completedProgress.reduce((sum, l) => sum + l.watchSeconds, 0);
      if (totalWatchSeconds < minSeconds) {
        throw new Error(`Cannot generate certificate: Watch time requirement not met. Watched: ${totalWatchSeconds}s, Required: ${minSeconds}s.`);
      }
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
    const signatureHash = signData(JSON.stringify(metadataPayload));

    // 4. Setup URLs
    const verifyBaseUrl = process.env.VERIFY_URL || "http://localhost:3000/verify";
    const verificationUrl = `${verifyBaseUrl}/${certificateId}?sig=${signatureHash}`;
    const pdfFileName = `${certificateId}.pdf`;
    const pdfFilePath = path.join(CERT_DIR, pdfFileName);
    const pdfPublicUrl = `/certificates/${pdfFileName}`;

    // 5. Generate scannable QR Code as Data URL
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 120,
    });

    // 6. Draw PDF using PDFKit (A4 Landscape: 841.89 x 595.28 points)
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const writeStream = fs.createWriteStream(pdfFilePath);
    doc.pipe(writeStream);

    // Background color: Premium Dark Blue/Grey
    doc.rect(0, 0, 841.89, 595.28).fill("#0B0F19");

    // Double Borders (Gold)
    // Outer Border
    doc.rect(20, 20, 841.89 - 40, 595.28 - 40)
       .lineWidth(2)
       .stroke("#F59E0B");
    // Inner Border
    doc.rect(26, 26, 841.89 - 52, 595.28 - 52)
       .lineWidth(0.5)
       .stroke("#F59E0B");

    // Header Branding
    doc.fillColor("#F59E0B");
    doc.fontSize(16).font("Helvetica-Bold").text("KIRI AI Learning", 50, 45);
    doc.fillColor("#A0AEC0");
    doc.fontSize(8).font("Helvetica").text("A division of Kiri App Ecosystem", 50, 62);

    // Sponsor Section (top right)
    if (course.sponsors.length > 0) {
      doc.fillColor("#A0AEC0");
      doc.fontSize(9).font("Helvetica-Bold").text("Sponsored by:", 600, 45, { align: "right", width: 190 });
      doc.fillColor("#F59E0B");
      doc.fontSize(10).font("Helvetica").text(course.sponsors.map(s => s.name).join(", "), 600, 58, { align: "right", width: 190 });
    }

    // Main Certificate Text
    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(32)
       .text("CERTIFICATE OF COMPLETION", 0, 140, { align: "center" });

    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(14)
       .text("This certifies that", 0, 190, { align: "center" });

    // Learner Name (large, gold)
    doc.fillColor("#F59E0B")
       .font("Helvetica-Bold")
       .fontSize(28)
       .text(user.displayName, 0, 225, { align: "center" });

    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(14)
       .text("has successfully completed the structured online course", 0, 275, { align: "center" });

    // Course Title
    doc.fillColor("#FFFFFF")
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
    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(10)
       .text(metaText, 0, 355, { align: "center" });

    // Bottom Signatures & QR Code
    // Left signature: Instructor
    doc.moveTo(80, 480).lineTo(260, 480).lineWidth(1).stroke("#A0AEC0");
    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(11)
       .text(course.instructor.displayName, 80, 488, { width: 180, align: "center" });
    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(8)
       .text("Authorized Instructor", 80, 500, { width: 180, align: "center" });

    // Right signature: Director
    doc.moveTo(580, 480).lineTo(760, 480).lineWidth(1).stroke("#A0AEC0");
    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold")
       .fontSize(11)
       .text("Kiri App Core Team", 580, 488, { width: 180, align: "center" });
    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(8)
       .text("Platform Director", 580, 500, { width: 180, align: "center" });

    // Center QR code image
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
    doc.image(qrBuffer, 841.89 / 2 - 40, 420, { width: 80, height: 80 });

    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(7)
       .text("Scan to verify authenticity", 0, 505, { align: "center" });

    doc.fillColor("#A0AEC0")
       .font("Helvetica")
       .fontSize(8)
       .text(`Certificate ID: ${certificateId}`, 0, 525, { align: "center" });

    doc.end();

    // Wait for the stream to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(true));
      writeStream.on("error", reject);
    });

    // 7. Store Certificate Record in Database
    const sponsorIds = course.sponsors.map(s => s.id);
    const dbCertificate = await prisma.certificate.create({
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
  } catch (error) {
    console.error("Certificate Generation Error:", error);
    throw error;
  }
}
