import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const keyLength = 64;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [salt, hash] = storedPassword.split(":");
  const storedHash = Buffer.from(hash, "hex");
  const candidateHash = scryptSync(password, salt, keyLength);

  return timingSafeEqual(storedHash, candidateHash);
}
