import { Router } from "express";
import { register, login, getProfile, requestVerification, requestForgotPassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/signup", register);
router.post("/login", login);
router.post("/signin", login);
router.get("/profile", requireAuth, getProfile);
router.post("/verify", requireAuth, requestVerification);
router.post("/forgot-password", requestForgotPassword);

export default router;
