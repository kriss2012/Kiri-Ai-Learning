import { Response } from "express";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

export async function getJobs(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;

  try {
    // 1. Fetch all jobs with their required course information
    const jobs = await prisma.job.findMany({
      include: {
        requiredCourse: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. If authenticated, fetch user's job applications and earned certificates
    let appliedJobIds: string[] = [];
    let userCertificateCourseIds: string[] = [];
    let certificatesList: any[] = [];

    if (userId) {
      const applications = await prisma.jobApplication.findMany({
        where: { userId },
        select: { jobId: true },
      });
      appliedJobIds = applications.map((app) => app.jobId);

      const certificates = await prisma.certificate.findMany({
        where: { userId, status: "active" },
        select: { id: true, certificateId: true, courseId: true },
      });
      userCertificateCourseIds = certificates.map((cert) => cert.courseId);
      certificatesList = certificates;
    }

    return res.status(200).json({
      jobs,
      appliedJobIds,
      userCertificateCourseIds,
      certificates: certificatesList,
    });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to fetch jobs." });
  }
}

export async function applyToJob(req: AuthenticatedRequest, res: Response) {
  const { id: jobId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    // 1. Fetch job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: "Not Found", message: "Job listing not found." });
    }

    // 2. Verify if user already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: { userId, jobId },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: "Bad Request", message: "You have already applied to this job." });
    }

    // 3. Verify if user has the required certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        userId,
        courseId: job.requiredCourseId,
        status: "active",
      },
    });

    if (!certificate) {
      return res.status(400).json({
        error: "Eligibility Error",
        message: "You are not eligible. You must complete the required course and obtain a verified certificate to apply.",
      });
    }

    // 4. Create job application
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        certificateId: certificate.id,
        status: "applied",
      },
    });

    return res.status(200).json({
      message: "Application submitted successfully!",
      application,
      certificateId: certificate.certificateId,
    });
  } catch (error) {
    console.error("Apply to Job Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to submit job application." });
  }
}
