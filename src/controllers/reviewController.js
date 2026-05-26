import {
  createVehicleReview,
  getVehicleReviews,
} from "../services/reviewService.js";

export async function listVehicleReviews(req, res, next) {
  try {
    const result = await getVehicleReviews(req.params.slug);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    const result = await createVehicleReview(req.params.slug, req.body);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
