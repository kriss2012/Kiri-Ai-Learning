import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

export async function getCourses(req: AuthenticatedRequest, res: Response) {
  const { category, level, search } = req.query;

  try {
    const whereClause: any = { status: "published" };

    if (category) {
      whereClause.category = category as string;
    }
    if (level) {
      whereClause.level = level as string;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
        { shortDescription: { contains: search as string } },
      ];
    }

    const courses = await prisma.course.findMany({
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
  } catch (error) {
    console.error("Get Courses Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to fetch courses catalog." });
  }
}

export async function getCourseBySlug(req: AuthenticatedRequest, res: Response) {
  const { slug } = req.params;
  const userId = req.user?.id;

  try {
    const course = await prisma.course.findUnique({
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
    let completedLessons: string[] = [];
    let lessonWatchProgress: Record<string, { status: string; watchSeconds: number; lastPositionSeconds: number }> = {};
    let completedQuizzes: Record<string, { passed: boolean; scorePercent: number }> = {};
    let progressPercent = 0;

    if (userId) {
      // Check enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId: course.id },
        },
      });
      isEnrolled = enrollment?.isActive || false;

      if (isEnrolled) {
        // Fetch lesson progress
        const progressList = await prisma.lessonProgress.findMany({
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
        const quizAttempts = await prisma.quizAttempt.findMany({
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
        const totalLessonsCount = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        progressPercent = totalLessonsCount > 0 
          ? Math.round((completedLessons.length / totalLessonsCount) * 100) 
          : 0;

        // Fetch certificate if it exists
        const certificate = await prisma.certificate.findFirst({
          where: { userId, courseId: course.id },
        });
        const certificateId = certificate?.certificateId || null;

        return res.status(200).json({
          course,
          enrollment: {
            isEnrolled,
            progressPercent,
            completedLessons,
            lessonWatchProgress,
            completedQuizzes,
            certificateId,
          },
        });
      }
    }

    return res.status(200).json({
      course,
      enrollment: {
        isEnrolled,
        progressPercent,
        completedLessons,
        lessonWatchProgress,
        completedQuizzes,
        certificateId: null,
      },
    });
  } catch (error) {
    console.error("Get Course By Slug Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to fetch course details." });
  }
}

export async function enrollInCourse(req: AuthenticatedRequest, res: Response) {
  const { id: courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Not Found", message: "Course not found." });
    }

    const enrollment = await prisma.enrollment.upsert({
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
  } catch (error) {
    console.error("Enroll Course Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to enroll in course." });
  }
}

export async function unenrollFromCourse(req: AuthenticatedRequest, res: Response) {
  const { id: courseId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment || !enrollment.isActive) {
      return res.status(400).json({ error: "Bad Request", message: "You are not actively enrolled in this course." });
    }

    await prisma.enrollment.update({
      where: {
        userId_courseId: { userId, courseId },
      },
      data: {
        isActive: false,
        unenrolledAt: new Date(),
      },
    });

    return res.status(200).json({ message: "Successfully unenrolled from course. Progress preserved." });
  } catch (error) {
    console.error("Unenroll Course Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to unenroll." });
  }
}
