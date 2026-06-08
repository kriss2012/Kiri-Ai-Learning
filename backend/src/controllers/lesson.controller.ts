import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

export async function startLesson(req: AuthenticatedRequest, res: Response) {
  const { id: lessonId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Not Found", message: "Lesson not found." });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        status: "in_progress",
      },
      create: {
        userId,
        lessonId,
        courseId: lesson.courseId,
        status: "in_progress",
        watchSeconds: 0,
        lastPositionSeconds: 0,
      },
    });

    return res.status(200).json({ progress });
  } catch (error) {
    console.error("Start Lesson Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to start lesson." });
  }
}

export async function heartbeat(req: AuthenticatedRequest, res: Response) {
  const { id: lessonId } = req.params;
  const { lastPositionSeconds } = req.body; // Numeric current playhead position
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  if (typeof lastPositionSeconds !== "number" || lastPositionSeconds < 0) {
    return res.status(400).json({ error: "Bad Request", message: "Invalid lastPositionSeconds." });
  }

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Not Found", message: "Lesson not found." });
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });

    if (!progress) {
      return res.status(404).json({ error: "Not Found", message: "Lesson progress has not been started." });
    }

    if (progress.status === "completed") {
      return res.status(200).json({ progress });
    }

    // Anti-Fraud check: Calculate how much wall-clock time elapsed since last DB update
    const now = Date.now();
    const lastUpdateMs = new Date(progress.updatedAt).getTime();
    const elapsedWallClockSec = Math.max(0, Math.ceil((now - lastUpdateMs) / 1000));

    // Calculate how much the user playhead advanced
    const diffPosition = Math.max(0, lastPositionSeconds - progress.lastPositionSeconds);

    let watchSecIncrement = diffPosition;
    
    // If playhead jumped significantly faster than wall-clock time, cap it to wall-clock time
    if (diffPosition > elapsedWallClockSec + 5) {
      // User jumped/skipped forward. We only reward them with the actual time they spent watching (or zero if they just seeked)
      watchSecIncrement = Math.min(diffPosition, elapsedWallClockSec);
    }

    const updatedProgress = await prisma.lessonProgress.update({
      where: { id: progress.id },
      data: {
        lastPositionSeconds,
        watchSeconds: {
          increment: watchSecIncrement,
        },
      },
    });

    return res.status(200).json({ progress: updatedProgress });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to log progress heartbeat." });
  }
}

export async function completeLesson(req: AuthenticatedRequest, res: Response) {
  const { id: lessonId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Not Found", message: "Lesson not found." });
    }

    // Find progress
    let progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });

    if (!progress) {
      // Create progress as in_progress first
      progress = await prisma.lessonProgress.create({
        data: {
          userId,
          lessonId,
          courseId: lesson.courseId,
          status: "in_progress",
        },
      });
    }

    if (progress.status === "completed") {
      return res.status(200).json({ message: "Lesson already completed", progress });
    }

    // Check completion criteria based on lesson type
    if (lesson.contentType === "video") {
      const requiredWatchTime = lesson.durationSeconds * 0.8;
      
      // Enforce watch time (at least 80%)
      if (progress.watchSeconds < requiredWatchTime) {
        return res.status(400).json({
          error: "Verification Failed",
          message: `You must watch at least 80% of this video to complete it. Watched: ${progress.watchSeconds}s, Required: ${Math.round(requiredWatchTime)}s.`,
        });
      }
    }

    // Update progress to completed
    const completedProgress = await prisma.lessonProgress.update({
      where: { id: progress.id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Lesson marked completed successfully.",
      progress: completedProgress,
    });
  } catch (error) {
    console.error("Complete Lesson Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to complete lesson." });
  }
}
