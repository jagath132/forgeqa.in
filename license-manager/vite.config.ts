import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createApiMiddleware } from "./server/api.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["RESEND_API_KEY", "JWT_SECRET", "MONGO_URI", "MONGO_DB_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "app_forgeqa_in_APP_URL"]) {
    if (env[key]) process.env[key] ??= env[key];
  }

  return {
    plugins: [
      react(),
      {
        name: "forgekey-api",
        configureServer(server) {
          server.middlewares.use(createApiMiddleware(env));
        },
      },
    ],
    server: {
      port: 5174,
    },
  };
});
