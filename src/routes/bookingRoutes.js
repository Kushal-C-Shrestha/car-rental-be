import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  listMyAppointments,
  rescheduleBooking,
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);

bookingRoutes.get("/", listMyAppointments);
bookingRoutes.get("/appointments", listMyAppointments);
bookingRoutes.post("/", createBooking);
bookingRoutes.post("/appointments", createBooking);
bookingRoutes.patch("/:id/reschedule", rescheduleBooking);
bookingRoutes.patch("/:id/cancel", cancelBooking);
