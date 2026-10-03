import { Router } from "express";
import { getThreads, getDirectMessages, sendMessage } from "../controllers/message.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/threads", requireAuth, getThreads);
router.get("/thread/:partnerId", requireAuth, getDirectMessages);
router.post("/", requireAuth, sendMessage);

export default router;
