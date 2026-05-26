import { Router } from "express";
import { createBooking } from "../controllers/bookingController.js";

export const bookingRoutes = Router();

bookingRoutes.post("/", createBooking);
bookingRoutes.post("/appointments", createBooking);
