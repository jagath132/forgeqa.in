import jwt from "jsonwebtoken";
import { adminStore } from "./store.js";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  return process.env.JWT_SECRET;
}

export function generateToken(admin) {
  return jwt.sign(
    { adminId: admin.id, email: admin.email, role: "admin" },
    getJwtSecret(),
    { expiresIn: "24h" }
  );
}

export async function authenticateToken(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    const err = new Error("Authorization header required");
    err.statusCode = 401;
    throw err;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    const err = new Error("Invalid authorization format");
    err.statusCode = 401;
    throw err;
  }

  let payload;
  try {
    payload = jwt.verify(parts[1], getJwtSecret());
  } catch (e) {
    const err = new Error(e.message === "jwt expired" ? "Token expired" : "Invalid token");
    err.statusCode = 401;
    throw err;
  }

  if (!payload.adminId || payload.role !== "admin") {
    const err = new Error("Not authorized");
    err.statusCode = 403;
    throw err;
  }

  const admin = await adminStore.findById(payload.adminId);
  if (!admin) {
    const err = new Error("Admin no longer exists");
    err.statusCode = 401;
    throw err;
  }
  return { id: admin._id.toString(), email: admin.email };
}
