import { Router } from "express";
import {
  createBooking,
  listMyAppointments,
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);

bookingRoutes.get("/", listMyAppointments);
bookingRoutes.get("/appointments", listMyAppointments);
bookingRoutes.post("/", createBooking);
bookingRoutes.post("/appointments", createBooking);
