import { Router } from "express";
import { getCourses, getCourseBySlug, enrollInCourse, unenrollFromCourse } from "../controllers/course.controller";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const courseRouter = Router();

courseRouter.get("/", optionalAuth, getCourses);
courseRouter.get("/:slug", optionalAuth, getCourseBySlug);
courseRouter.post("/:id/enroll", requireAuth, enrollInCourse);
courseRouter.delete("/:id/enroll", requireAuth, unenrollFromCourse);

export { courseRouter };
