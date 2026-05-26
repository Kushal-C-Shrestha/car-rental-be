import { Router } from "express";
import {
  deleteMyReview,
  listMyReviews,
  updateMyReview,
} from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const reviewRoutes = Router();

reviewRoutes.use(requireAuth);

reviewRoutes.get("/me", listMyReviews);
reviewRoutes.patch("/:id", updateMyReview);
reviewRoutes.delete("/:id", deleteMyReview);
