import {
  createVehicleReview,
  getUserReviews,
  getVehicleReviews,
  softDeleteUserReview,
  updateUserReview,
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
    const result = await createVehicleReview(
      req.user.userId,
      req.params.slug,
      req.body,
    );

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function listMyReviews(req, res, next) {
  try {
    const result = await getUserReviews(req.user.userId);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function updateMyReview(req, res, next) {
  try {
    const result = await updateUserReview(
      req.user.userId,
      req.params.id,
      req.body,
    );

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMyReview(req, res, next) {
  try {
    const result = await softDeleteUserReview(req.user.userId, req.params.id);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
