"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndCompleteCourse = checkAndCompleteCourse;
const prisma_1 = __importDefault(require("../config/prisma"));
const certificate_service_1 = require("./certificate.service");
async function checkAndCompleteCourse(userId, courseId, finalScore) {
    try {
        // 1. Check if completion already exists
        const existingCompletion = await prisma_1.default.courseCompletion.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });
        if (existingCompletion) {
            // Fetch associated certificate if it exists
            const certificate = await prisma_1.default.certificate.findUnique({
                where: { completionId: existingCompletion.id },
            });
            return {
                completed: true,
                alreadyCompleted: true,
                completionId: existingCompletion.id,
                certificateId: certificate?.certificateId || null,
            };
        }
        // 2. Load all course details
        const course = await prisma_1.default.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: true,
            },
        });
        if (!course) {
            throw new Error(`Course with ID ${courseId} not found.`);
        }
        // 3. Enforce Genuineness: Check enrollment exists and verify minimum duration threshold
        const enrollment = await prisma_1.default.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });
        if (!enrollment) {
            return {
                completed: false,
                reason: "You are not enrolled in this course.",
            };
        }
        // Allow mock developer users to skip minimum duration validation
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const isMockUser = user
            ? (user.firebaseUid.includes("mock") || user.email.includes("mock") || user.email.includes("student@kiriapp.com"))
            : false;
        if (!isMockUser) {
            const elapsedMs = Date.now() - new Date(enrollment.enrolledAt).getTime();
            // Minimum duration required: 5% of durationHours (e.g. 12 minutes for a 4 hour course)
            const minDurationMs = course.durationHours * 0.05 * 60 * 60 * 1000;
            if (elapsedMs < minDurationMs) {
                return {
                    completed: false,
                    reason: `Course completion flagged: Elapsed time since enrollment (${Math.round(elapsedMs / 60000)} mins) is too low for course length. Minimum requirement is ${Math.round(minDurationMs / 60000)} mins.`,
                };
            }
        }
        // 4. Count completed lessons for this user
        const totalLessons = course.lessons.length;
        const completedProgressCount = await prisma_1.default.lessonProgress.count({
            where: {
                userId,
                courseId,
                status: "completed",
            },
        });
        if (completedProgressCount < totalLessons) {
            return {
                completed: false,
                reason: `You have completed ${completedProgressCount} of ${totalLessons} lessons. Please watch all lectures first.`,
            };
        }
        // 5. Enforce Genuineness: Check that all quizzes (module checkpoints and finals) in the course have been successfully passed
        const courseQuizzes = await prisma_1.default.quiz.findMany({
            where: { courseId },
        });
        for (const quiz of courseQuizzes) {
            const passedAttempt = await prisma_1.default.quizAttempt.findFirst({
                where: {
                    userId,
                    quizId: quiz.id,
                    passed: true,
                },
            });
            if (!passedAttempt) {
                return {
                    completed: false,
                    reason: `Completion denied: You have not passed the quiz "${quiz.title}" yet. All checkpoints must be passed.`,
                };
            }
        }
        // 6. Record course completion
        const completion = await prisma_1.default.courseCompletion.create({
            data: {
                userId,
                courseId,
                finalScorePercent: finalScore,
            },
        });
        console.log(`🎓 Course completed by user ${userId} for course ${course.title}. Score: ${finalScore}%`);
        // 7. Generate cryptographically signed certificate
        let certificate = null;
        let certError = null;
        try {
            certificate = await (0, certificate_service_1.generateCertificate)(userId, courseId, completion.id, finalScore);
        }
        catch (err) {
            console.error("❌ Certificate generation failed:", err);
            certError = err.message || "Failed to generate certificate PDF.";
        }
        return {
            completed: true,
            completionId: completion.id,
            certificateId: certificate?.certificateId || null,
            pdfUrl: certificate?.pdfUrl || null,
            certError,
        };
    }
    catch (error) {
        console.error("Course Completion Service Error:", error);
        throw error;
    }
}
