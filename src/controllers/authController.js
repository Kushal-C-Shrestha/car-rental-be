import { loginUser, registerUser } from "../services/authService.js";

export function register(req, res, next) {
  try {
    const result = registerUser(req.body);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export function login(req, res, next) {
  try {
    const result = loginUser(req.body);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
