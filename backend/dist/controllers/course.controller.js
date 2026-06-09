"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourses = getCourses;
exports.getCourseBySlug = getCourseBySlug;
exports.enrollInCourse = enrollInCourse;
exports.unenrollFromCourse = unenrollFromCourse;
const prisma_1 = __importDefault(require("../config/prisma"));
async function getCourses(req, res) {
    const { category, level, search } = req.query;
    try {
        const whereClause = { status: "published" };
        if (category) {
            whereClause.category = category;
        }
        if (level) {
            whereClause.level = level;
        }
        if (search) {
            whereClause.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { shortDescription: { contains: search } },
            ];
        }
        const courses = await prisma_1.default.course.findMany({
            where: whereClause,
            include: {
                instructor: {
                    select: { displayName: true, profilePhoto: true },
                },
                sponsors: {
                    select: { name: true, logoUrl: true, tier: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ courses });
    }
    catch (error) {
        console.error("Get Courses Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to fetch courses catalog." });
    }
}
async function getCourseBySlug(req, res) {
    const { slug } = req.params;
    const userId = req.user?.id;
    try {
        const course = await prisma_1.default.course.findUnique({
            where: { slug },
            include: {
                instructor: {
                    select: { id: true, displayName: true, profilePhoto: true, college: true },
                },
                sponsors: true,
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            orderBy: { order: "asc" },
                        },
                        quizzes: {
                            include: {
                                questions: {
                                    select: {
                                        id: true,
                                        text: true,
                                        type: true,
                                        optionsJson: true, // Only show options, hide answers
                                        explanation: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!course) {
            return res.status(404).json({ error: "Not Found", message: "Course not found." });
        }
        // Default enrollment and progress states
        let isEnrolled = false;
        let completedLessons = [];
        let lessonWatchProgress = {};
        let completedQuizzes = {};
        if (userId) {
            // Check enrollment
            const enrollment = await prisma_1.default.enrollment.findUnique({
                where: {
                    userId_courseId: { userId, courseId: course.id },
                },
            });
            isEnrolled = enrollment?.isActive || false;
            if (isEnrolled) {
                // Fetch lesson progress
                const progressList = await prisma_1.default.lessonProgress.findMany({
                    where: { userId, courseId: course.id },
                });
                progressList.forEach((p) => {
                    lessonWatchProgress[p.lessonId] = {
                        status: p.status,
                        watchSeconds: p.watchSeconds,
                        lastPositionSeconds: p.lastPositionSeconds,
                    };
                    if (p.status === "completed") {
                        completedLessons.push(p.lessonId);
                    }
                });
                // Fetch quiz attempts
                const quizAttempts = await prisma_1.default.quizAttempt.findMany({
                    where: { userId, courseId: course.id, submittedAt: { not: null } },
                });
                quizAttempts.forEach((attempt) => {
                    // Track highest score per quiz
                    const existing = completedQuizzes[attempt.quizId];
                    const passed = attempt.passed || false;
                    const score = attempt.scorePercent || 0;
                    if (!existing || score > existing.scorePercent) {
                        completedQuizzes[attempt.quizId] = { passed, scorePercent: score };
                    }
                });
            }
        }
        // Map completion details directly into the response payload structure
        const totalLessonsCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const progressPercent = totalLessonsCount > 0
            ? Math.round((completedLessons.length / totalLessonsCount) * 100)
            : 0;
        return res.status(200).json({
            course,
            enrollment: {
                isEnrolled,
                progressPercent,
                completedLessons,
                lessonWatchProgress,
                completedQuizzes,
            },
        });
    }
    catch (error) {
        console.error("Get Course By Slug Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to fetch course details." });
    }
}
async function enrollInCourse(req, res) {
    const { id: courseId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized", message: "User session required." });
    }
    try {
        const course = await prisma_1.default.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: "Not Found", message: "Course not found." });
        }
        const enrollment = await prisma_1.default.enrollment.upsert({
            where: {
                userId_courseId: { userId, courseId },
            },
            update: {
                isActive: true,
                unenrolledAt: null,
            },
            create: {
                userId,
                courseId,
                isActive: true,
            },
        });
        return res.status(200).json({
            message: "Successfully enrolled in course",
            enrollment,
        });
    }
    catch (error) {
        console.error("Enroll Course Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to enroll in course." });
    }
}
async function unenrollFromCourse(req, res) {
    const { id: courseId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized", message: "User session required." });
    }
    try {
        const enrollment = await prisma_1.default.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });
        if (!enrollment || !enrollment.isActive) {
            return res.status(400).json({ error: "Bad Request", message: "You are not actively enrolled in this course." });
        }
        await prisma_1.default.enrollment.update({
            where: {
                userId_courseId: { userId, courseId },
            },
            data: {
                isActive: false,
                unenrolledAt: new Date(),
            },
        });
        return res.status(200).json({ message: "Successfully unenrolled from course. Progress preserved." });
    }
    catch (error) {
        console.error("Unenroll Course Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to unenroll." });
    }
}
