import { Router } from "express";
import briefRoutes from "./brief.routes.js";

const router = Router();

router.use("/brief", briefRoutes);

export default router;
