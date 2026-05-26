import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const accessTokenSecret =
  process.env.JWT_ACCESS_SECRET || "dev-access-token-secret";
const refreshTokenSecret =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-token-secret";
const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function getExpiresAt(duration) {
  const value = Number.parseInt(duration, 10);

  if (duration.endsWith("d")) {
    return new Date(Date.now() + value * 24 * 60 * 60 * 1000);
  }

  if (duration.endsWith("h")) {
    return new Date(Date.now() + value * 60 * 60 * 1000);
  }

  if (duration.endsWith("m")) {
    return new Date(Date.now() + value * 60 * 1000);
  }

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export function generateAuthTokens(payload) {
  const accessToken = jwt.sign({ ...payload, jti: randomUUID() }, accessTokenSecret, {
    expiresIn: accessTokenExpiresIn,
  });

  const refreshToken = jwt.sign(
    { ...payload, jti: randomUUID() },
    refreshTokenSecret,
    {
      expiresIn: refreshTokenExpiresIn,
    },
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: getExpiresAt(refreshTokenExpiresIn),
  };
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshTokenSecret);
}
