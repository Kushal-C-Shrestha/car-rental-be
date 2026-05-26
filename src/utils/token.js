import jwt from "jsonwebtoken";

const accessTokenSecret =
  process.env.JWT_ACCESS_SECRET || "dev-access-token-secret";
const refreshTokenSecret =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-token-secret";
const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export function generateAuthTokens(payload) {
  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiresIn,
  });

  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiresIn,
  });

  return {
    accessToken,
    refreshToken,
  };
}
