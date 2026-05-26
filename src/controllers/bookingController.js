import {
  createBookingAppointment,
  getUserAppointments,
} from "../services/bookingService.js";

export async function createBooking(req, res, next) {
  try {
    const result = await createBookingAppointment(req.user.userId, req.body);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function listMyAppointments(req, res, next) {
  try {
    const result = await getUserAppointments(req.user.userId);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
