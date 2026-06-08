import { Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

export async function getMyCertificates(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId, status: "active" },
      include: {
        course: {
          select: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return res.status(200).json({ certificates });
  } catch (error) {
    console.error("Get My Certificates Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to load certificates." });
  }
}

export async function downloadCertificate(req: AuthenticatedRequest, res: Response) {
  const { cert_id } = req.params;
  const userId = req.user?.id;
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized", message: "User session required." });
  }

  try {
    // 1. Fetch certificate and check ownership
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: cert_id },
    });

    if (!certificate) {
      return res.status(404).json({ error: "Not Found", message: "Certificate not found." });
    }

    if (certificate.userId !== userId) {
      return res.status(403).json({ error: "Forbidden", message: "You do not own this certificate." });
    }

    if (certificate.status === "revoked") {
      return res.status(400).json({ error: "Bad Request", message: "This certificate has been revoked and cannot be downloaded." });
    }

    // 2. Log Download Event in Audit Log (PRD FR-CERT-006)
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    const uaHash = crypto.createHash("sha256").update(userAgent).digest("hex");

    await prisma.certificateAuditLog.create({
      data: {
        certificateId: certificate.id,
        event: "downloaded",
        ipHash,
        userAgentHash: uaHash,
      },
    });

    // 3. Locate and Stream the PDF file
    const pdfPath = path.join(__dirname, "../../public", certificate.pdfUrl);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Not Found", message: "Certificate PDF file is missing on the server. Please contact support." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.certificateId}.pdf"`);

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Download Certificate Error:", error);
    return res.status(500).json({ error: "Server Error", message: "Failed to download certificate." });
  }
}
