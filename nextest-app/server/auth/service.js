import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { authStore } from "./store.js";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
  return process.env.JWT_SECRET;
}

function getEncryptionSecret() {
  if (!process.env.ENCRYPTION_SECRET) throw new Error("ENCRYPTION_SECRET environment variable is required");
  return process.env.ENCRYPTION_SECRET;
}

function parseCookies(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return {};
  return cookie.split(";").reduce((acc, pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return acc;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

export function getAuthToken(req) {
  const cookies = parseCookies(req);
  if (cookies.token) return cookies.token;
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1];
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id || user._id.toString(), email: user.email },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function authenticateToken(req) {
  const token = getAuthToken(req);
  if (!token) {
    const err = new Error("Authorization token required");
    err.statusCode = 401;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (e) {
    const err = new Error(e.message === "jwt expired" ? "Token expired" : "Invalid or expired token");
    err.statusCode = 401;
    throw err;
  }

  const user = await authStore.findUserById(payload.userId);
  if (!user) {
    const err = new Error("User no longer exists");
    err.statusCode = 401;
    throw err;
  }
  return user;
}

const ALGORITHM = "aes-256-gcm";

export function encryptApiKey(apiKey) {
  if (!apiKey) throw new Error("API key is required for encryption");
  const key = crypto.createHash("sha256").update(getEncryptionSecret()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { encryptedKey: encrypted, iv: iv.toString("hex"), authTag };
}

export function decryptApiKey(encryptedKey, iv, authTag) {
  if (!encryptedKey || !iv || !authTag) {
    throw new Error("Missing encryptedKey, iv, or authTag for decryption");
  }
  const key = crypto.createHash("sha256").update(getEncryptionSecret()).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
