import { Router } from "express";
import { listMyReviews } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const reviewRoutes = Router();

reviewRoutes.use(requireAuth);

reviewRoutes.get("/me", listMyReviews);
