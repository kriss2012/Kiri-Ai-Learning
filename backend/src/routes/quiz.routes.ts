import { Router } from "express";
import { getQuiz, startQuiz, submitQuiz } from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth";

const quizRouter = Router();

quizRouter.get("/:id", requireAuth, getQuiz);
quizRouter.post("/:id/start", requireAuth, startQuiz);
quizRouter.post("/:id/submit", requireAuth, submitQuiz);

export { quizRouter };
