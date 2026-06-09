import { Router } from "express";

import { authRouter } from "./auth.routes";
import { courseRouter } from "./course.routes";
import { lessonRouter } from "./lesson.routes";
import { quizRouter } from "./quiz.routes";
import { certRouter } from "./cert.routes";
import { verifyRouter } from "./verify.routes";
import { jobRouter } from "./job.routes";

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/courses", courseRouter);
apiRouter.use("/lessons", lessonRouter);
apiRouter.use("/quizzes", quizRouter);
apiRouter.use("/certificates", certRouter);
apiRouter.use("/verify", verifyRouter);
apiRouter.use("/jobs", jobRouter);

export { apiRouter };
