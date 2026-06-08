import { Router } from "express";
import { getMyCertificates, downloadCertificate } from "../controllers/cert.controller";
import { requireAuth } from "../middlewares/auth";

const certRouter = Router();

certRouter.get("/", requireAuth, getMyCertificates);
certRouter.get("/:cert_id/download", requireAuth, downloadCertificate);

export { certRouter };
