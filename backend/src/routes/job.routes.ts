import { Router } from "express";
import { getJobs, applyToJob } from "../controllers/job.controller";
import { optionalAuth, requireAuth } from "../middlewares/auth";

const jobRouter = Router();

jobRouter.get("/", optionalAuth, getJobs);
jobRouter.post("/:id/apply", requireAuth, applyToJob);

export { jobRouter };
