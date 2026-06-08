import { Router } from "express";
import { startLesson, heartbeat, completeLesson } from "../controllers/lesson.controller";
import { requireAuth } from "../middlewares/auth";

const lessonRouter = Router();

lessonRouter.post("/:id/start", requireAuth, startLesson);
lessonRouter.post("/:id/heartbeat", requireAuth, heartbeat);
lessonRouter.post("/:id/complete", requireAuth, completeLesson);

export { lessonRouter };
