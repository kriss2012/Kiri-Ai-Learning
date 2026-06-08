import prisma from "../config/prisma";
import { generateCertificate } from "./certificate.service";

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

    // 2. Load all course lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
      },
    });

    if (!course) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    const totalLessons = course.lessons.length;

    // 3. Count completed lessons for this user
    const completedProgressCount = await prisma.lessonProgress.count({
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
