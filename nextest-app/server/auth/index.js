export { authStore } from "./store.js";
export { authenticateToken, encryptApiKey, decryptApiKey } from "./service.js";
export { isDisposableEmail } from "./disposable-emails.js";
export { handleAuthRoute } from "./routes.js";
export { validateProductKey, claimProductKey, isValidKeyFormat, findProductKeyByUserId } from "./productKeys.js";
export { logAudit, getAuditLogs } from "../audit/index.js";
