import { Router } from "express";
import { listVehicles, showVehicle } from "../controllers/vehicleController.js";

export const vehicleRoutes = Router();

vehicleRoutes.get("/", listVehicles);
vehicleRoutes.get("/:slug", showVehicle);
