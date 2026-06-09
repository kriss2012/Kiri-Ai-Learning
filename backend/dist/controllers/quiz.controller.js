"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuiz = getQuiz;
exports.startQuiz = startQuiz;
exports.submitQuiz = submitQuiz;
const uuid_1 = require("uuid");
const prisma_1 = __importDefault(require("../config/prisma"));
const completion_service_1 = require("../services/completion.service");
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
async function getQuiz(req, res) {
    const { id: quizId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized", message: "User session required." });
    }
    try {
        const quiz = await prisma_1.default.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    select: {
                        id: true,
                        text: true,
                        type: true,
                        optionsJson: true,
                        // Exclude correctAnswerJson and explanation to prevent cheating!
                    },
                },
            },
        });
        if (!quiz) {
            return res.status(404).json({ error: "Not Found", message: "Quiz not found." });
        }
        // Shuffle questions and their options per request (7.1)
        const shuffledQuestions = shuffleArray(quiz.questions).map((q) => {
            let options = [];
            try {
                options = JSON.parse(q.optionsJson);
            }
            catch (err) {
                options = [];
            }
            const shuffledOptions = shuffleArray(options);
            return {
                ...q,
                optionsJson: JSON.stringify(shuffledOptions),
            };
        });
        const shuffledQuiz = {
            ...quiz,
            questions: shuffledQuestions,
        };
        return res.status(200).json({ quiz: shuffledQuiz });
    }
    catch (error) {
        console.error("Get Quiz Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to load quiz." });
    }
}
async function startQuiz(req, res) {
    const { id: quizId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized", message: "User session required." });
    }
    try {
        const quiz = await prisma_1.default.quiz.findUnique({
            where: { id: quizId },
        });
        if (!quiz) {
            return res.status(404).json({ error: "Not Found", message: "Quiz not found." });
        }
        // Enforce retake policy on final assessment (BUG-03)
        if (quiz.isFinal) {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentAttempts = await prisma_1.default.quizAttempt.findMany({
                where: {
                    userId,
                    quizId: quiz.id,
                    startedAt: { gte: sevenDaysAgo },
                },
                orderBy: { startedAt: "desc" },
            });
            if (recentAttempts.length >= 3) {
                const nextAvailableAt = new Date(recentAttempts[2].startedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
                return res.status(429).json({
                    error: "MAX_ATTEMPTS_REACHED",
                    message: `You have reached the maximum of 3 final exam attempts in a 7-day window. Next attempt available at ${nextAvailableAt.toLocaleString()}.`,
                    nextAvailableAt,
                });
            }
            const lastAttempt = recentAttempts[0];
            if (lastAttempt && lastAttempt.submittedAt && !lastAttempt.passed) {
                // Enforce 24-hour cooldown after failed attempt
                const cooldownEnd = new Date(lastAttempt.submittedAt.getTime() + 24 * 60 * 60 * 1000);
                if (new Date() < cooldownEnd) {
                    return res.status(429).json({
                        error: "COOLDOWN_ACTIVE",
                        message: `You must wait 24 hours after a failed attempt before retaking the final exam. Available at ${cooldownEnd.toLocaleString()}.`,
                        cooldownEnd,
                    });
                }
            }
        }
        // Generate a unique session token for this attempt
        const sessionToken = (0, uuid_1.v4)();
        const attempt = await prisma_1.default.quizAttempt.create({
            data: {
                userId,
                quizId,
                courseId: quiz.courseId,
                sessionToken,
                startedAt: new Date(),
            },
        });
        return res.status(200).json({
            message: "Quiz session started.",
            attemptId: attempt.id,
            sessionToken,
            timeLimitMinutes: quiz.timeLimitMinutes,
        });
    }
    catch (error) {
        console.error("Start Quiz Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to initialize quiz session." });
    }
}
async function submitQuiz(req, res) {
    const { id: quizId } = req.params;
    const { attemptId, sessionToken, answers } = req.body; // answers is an object: { questionId: selectedOption }
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized", message: "User session required." });
    }
    if (!attemptId || !sessionToken || !answers) {
        return res.status(400).json({ error: "Bad Request", message: "Missing attemptId, sessionToken, or answers." });
    }
    try {
        const quiz = await prisma_1.default.quiz.findUnique({
            where: { id: quizId },
            include: {
                course: true,
                questions: true,
            },
        });
        if (!quiz) {
            return res.status(404).json({ error: "Not Found", message: "Quiz not found." });
        }
        const attempt = await prisma_1.default.quizAttempt.findUnique({
            where: { id: attemptId },
        });
        if (!attempt || attempt.userId !== userId || attempt.sessionToken !== sessionToken) {
            return res.status(400).json({ error: "Invalid Attempt", message: "Verification failed for this quiz attempt." });
        }
        if (attempt.submittedAt) {
            return res.status(400).json({ error: "Bad Request", message: "This quiz attempt has already been submitted." });
        }
        // 1. Enforce time limit (PRD SEC-FRAUD-002)
        const timeLimitMs = quiz.timeLimitMinutes * 60 * 1000;
        const allowedLeeWayMs = 5 * 60 * 1000; // 5 mins leeway
        const elapsedTimeMs = Date.now() - new Date(attempt.startedAt).getTime();
        if (elapsedTimeMs > timeLimitMs + allowedLeeWayMs) {
            // Mark as submitted with zero score due to timeout
            await prisma_1.default.quizAttempt.update({
                where: { id: attemptId },
                data: {
                    submittedAt: new Date(),
                    scorePercent: 0,
                    passed: false,
                    answersJson: JSON.stringify(answers),
                },
            });
            return res.status(400).json({
                error: "Timeout",
                message: "Submission rejected because the quiz duration limit was exceeded.",
            });
        }
        // 2. Evaluate answers
        let correctCount = 0;
        const questions = quiz.questions;
        const evaluationResults = [];
        questions.forEach((q) => {
            const userAnswer = answers[q.id];
            const correctAnswer = JSON.parse(q.correctAnswerJson);
            let isCorrect = false;
            // Handle simple string comparisons or array comparisons
            if (Array.isArray(correctAnswer)) {
                if (Array.isArray(userAnswer)) {
                    isCorrect =
                        userAnswer.length === correctAnswer.length &&
                            userAnswer.every((val) => correctAnswer.includes(val));
                }
            }
            else {
                isCorrect = String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
            }
            if (isCorrect) {
                correctCount++;
            }
            evaluationResults.push({
                questionId: q.id,
                text: q.text,
                userAnswer: userAnswer || null,
                correctAnswer,
                isCorrect,
                explanation: q.explanation,
            });
        });
        const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
        const minPassScore = quiz.isFinal ? quiz.course.minPassScore : 70; // 70% for modules, course-specific for finals
        const passed = scorePercent >= minPassScore;
        // 3. Update attempt record
        const updatedAttempt = await prisma_1.default.quizAttempt.update({
            where: { id: attemptId },
            data: {
                submittedAt: new Date(),
                scorePercent,
                passed,
                answersJson: JSON.stringify(answers),
            },
        });
        // 4. If this is the final assessment, run completion check
        let completionResult = null;
        if (quiz.isFinal && passed) {
            completionResult = await (0, completion_service_1.checkAndCompleteCourse)(userId, quiz.courseId, scorePercent);
        }
        return res.status(200).json({
            message: passed ? "Congratulations, you passed!" : "You did not achieve the passing score. Please try again.",
            scorePercent,
            minPassScore,
            passed,
            results: evaluationResults,
            completion: completionResult,
        });
    }
    catch (error) {
        console.error("Submit Quiz Error:", error);
        return res.status(500).json({ error: "Server Error", message: "Failed to evaluate quiz submission." });
    }
}
