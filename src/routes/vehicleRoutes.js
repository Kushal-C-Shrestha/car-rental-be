import { Router } from "express";
import {
  createReview,
  listVehicleReviews,
} from "../controllers/reviewController.js";
import { listVehicles, showVehicle } from "../controllers/vehicleController.js";

export const vehicleRoutes = Router();

vehicleRoutes.get("/", listVehicles);
vehicleRoutes.get("/:slug/reviews", listVehicleReviews);
vehicleRoutes.post("/:slug/reviews", createReview);
vehicleRoutes.get("/:slug", showVehicle);
