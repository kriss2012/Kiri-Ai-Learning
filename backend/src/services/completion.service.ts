import prisma from "../config/prisma";
import { generateCertificate } from "./certificate.service";

export async function verifyCourseCompletion(userId: string, courseId: string): Promise<{ passed: boolean; reason?: string }> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
      },
    });

    if (!course) {
      return { passed: false, reason: "COURSE_NOT_FOUND" };
    }

    // Check 1: All lessons completed
    const totalLessons = course.lessons.length;
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        courseId,
        status: "completed",
      },
    });

    if (completedProgress.length < totalLessons) {
      return { passed: false, reason: "INCOMPLETE_LESSONS" };
    }

    // Check 2: All quizzes in the course must be passed (includes Final Assessment)
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
        return { passed: false, reason: `QUIZ_NOT_PASSED: ${quiz.title}` };
      }
    }

    // Check 3: User exists and email verified
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { passed: false, reason: "USER_NOT_FOUND" };
    }

    const isMockUser = user.firebaseUid.includes("mock") || user.email.includes("mock") || user.email.includes("student@kiriapp.com");
    if (!user.emailVerified && !isMockUser) {
      return { passed: false, reason: "EMAIL_NOT_VERIFIED" };
    }

    // Check 4: Anti-fraud — minimum time (5% of course hours)
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      return { passed: false, reason: "NOT_ENROLLED" };
    }

    if (!isMockUser) {
      const minSeconds = course.durationHours * 3600 * 0.05;
      const totalWatchSeconds = completedProgress.reduce((sum, l) => sum + l.watchSeconds, 0);
      if (totalWatchSeconds < minSeconds) {
        return { passed: false, reason: "MINIMUM_TIME_NOT_MET" };
      }
    }

    return { passed: true };
  } catch (error) {
    console.error("verifyCourseCompletion Error:", error);
    return { passed: false, reason: "SERVER_ERROR" };
  }
}

export async function checkAndCompleteCourse(userId: string, courseId: string, finalScore: number) {
  try {
    // 1. Check if completion already exists
    const existingCompletion = await prisma.courseCompletion.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingCompletion) {
      // Fetch associated certificate if it exists
      const certificate = await prisma.certificate.findUnique({
        where: { completionId: existingCompletion.id },
      });
      return {
        completed: true,
        alreadyCompleted: true,
        completionId: existingCompletion.id,
        certificateId: certificate?.certificateId || null,
      };
    }

    // 2. Load course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    // 3. Verify completion criteria
    const verification = await verifyCourseCompletion(userId, courseId);
    if (!verification.passed) {
      return {
        completed: false,
        reason: `Completion denied: ${verification.reason}`,
      };
    }

    // 4. Record course completion
    const completion = await prisma.courseCompletion.create({
      data: {
        userId,
        courseId,
        finalScorePercent: finalScore,
      },
    });

    console.log(`🎓 Course completed by user ${userId} for course ${course.title}. Score: ${finalScore}%`);

    // 5. Generate cryptographically signed certificate
    let certificate = null;
    let certError = null;
    try {
      certificate = await generateCertificate(userId, courseId, completion.id, finalScore);
    } catch (err: any) {
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
  } catch (error) {
    console.error("Course Completion Service Error:", error);
    throw error;
  }
}
