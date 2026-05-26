import {
  getAllVehicles,
  getVehicleDetails,
} from "../services/vehicleService.js";

export async function listVehicles(_req, res, next) {
  try {
    const result = await getAllVehicles();

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function showVehicle(req, res, next) {
  try {
    const result = await getVehicleDetails(req.params.slug);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
