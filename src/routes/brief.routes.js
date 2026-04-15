import { Router } from "express";
import { postAnalyzeBrief, postFinalizeBrief } from "../controllers/brief.controller.js";

const router = Router();

router.post("/analyze", postAnalyzeBrief);
router.post("/finalize", postFinalizeBrief);

export default router;
