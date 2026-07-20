import crypto from "node:crypto";
import { adminStore } from "./store.js";
import { authenticateToken, generateToken } from "./service.js";

const PBKDF2_ITERATIONS = 600000;

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleLogin(req, res, body) {
  const { email, password } = body;
  if (!email || !password) {
    sendJson(res, 400, { error: "Email and password are required." });
    return;
  }

  const admin = await adminStore.findByEmail(email);
  if (!admin) {
    sendJson(res, 401, { error: "Invalid credentials." });
    return;
  }

  const checkHash = crypto.pbkdf2Sync(password, admin.salt, PBKDF2_ITERATIONS, 64, "sha512").toString("hex");
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(admin.passwordHash, "hex"),
      Buffer.from(checkHash, "hex")
    );
  } catch { match = false; }

  if (!match) {
    sendJson(res, 401, { error: "Invalid credentials." });
    return;
  }

  const token = generateToken({ id: admin._id.toString(), email: admin.email });
  sendJson(res, 200, { token, admin: { id: admin._id.toString(), email: admin.email } });
}

async function handleMe(req, res, url, body, admin) {
  sendJson(res, 200, { admin });
}

const ROUTE_CONFIG = [
  { path: "/api/admin/login", method: "POST", handler: handleLogin, auth: false },
  { path: "/api/admin/me", method: "GET", handler: handleMe, auth: true },
];

export async function handleAuthRoute(req, res, url) {
  const routeConfig = ROUTE_CONFIG.find(
    (r) => r.path === url.pathname && r.method === req.method
  );
  if (!routeConfig) return false;

  const rawBody = await readRequestBody(req);
  const body = rawBody ? JSON.parse(rawBody) : {};

  if (routeConfig.auth) {
    try {
      const admin = await authenticateToken(req);
      await routeConfig.handler(req, res, url, body, admin);
    } catch (authError) {
      sendJson(res, authError.statusCode || 401, { error: authError.message });
    }
  } else {
    try {
      await routeConfig.handler(req, res, body);
    } catch (handlerError) {
      console.error("Public auth route error:", handlerError);
      sendJson(res, 500, { error: handlerError.message || "An internal error occurred." });
    }
  }

  return true;
}
