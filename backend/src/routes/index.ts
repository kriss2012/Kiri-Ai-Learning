import { Router } from "express";

const apiRouter = Router();

// Placeholder routes
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// We will mount sub-routers here as we build them:
// apiRouter.use("/auth", authRouter);
// apiRouter.use("/courses", courseRouter);
// apiRouter.use("/lessons", lessonRouter);
// apiRouter.use("/quizzes", quizRouter);
// apiRouter.use("/certificates", certRouter);
// apiRouter.use("/verify", verifyRouter);
// apiRouter.use("/admin", adminRouter);

export { apiRouter };
