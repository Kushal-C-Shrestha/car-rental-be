import {
  loginUser,
  refreshAuthToken,
  registerUser,
} from "../services/authService.js";

const refreshCookieName = "refreshToken";

function setRefreshTokenCookie(res, result) {
  if (!result.refreshToken) {
    return;
  }

  res.cookie(refreshCookieName, result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: result.refreshTokenExpiresAt,
    path: "/api/auth",
  });
}

export async function register(req, res, next) {
  try {
    const result = await registerUser(req.body);
    setRefreshTokenCookie(res, result);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await loginUser(req.body);
    setRefreshTokenCookie(res, result);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await refreshAuthToken(req.cookies?.[refreshCookieName]);
    setRefreshTokenCookie(res, result);

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    return next(error);
  }
}
