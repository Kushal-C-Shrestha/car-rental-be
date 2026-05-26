import { createBookingAppointment } from "../services/bookingService.js";

export async function createBooking(req, res, next) {
  try {
    const result = await createBookingAppointment(req.body);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
