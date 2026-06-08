import { Router } from "express";
import { firebaseLogin, getCurrentUser } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";

const authRouter = Router();

authRouter.post("/firebase-login", firebaseLogin);
authRouter.get("/me", requireAuth, getCurrentUser);

export { authRouter };
