import path from "node:path";
import fs from "node:fs/promises";
import { getDb } from "../db.js";

const BUILDS_DIR = path.resolve(".data/regression-builds");

function sanitizePathComponent(val) {
  // Remove null bytes and control characters, then strip path traversal attempts
  const noNulls = String(val || "").replace(/\0/g, "");
  return noNulls.replace(/[/\\<>:"|?*]/g, "-").replace(/\.\.+/g, "-").trim();
}

function buildsColl() {
  return getDb().collection("regression_builds");
}

function webhooksColl() {
  return getDb().collection("regression_webhooks");
}

export async function storeBuildArtifact(userId, platform, version, file) {
  await fs.mkdir(path.join(BUILDS_DIR, userId), { recursive: true });
  const safePlatform = sanitizePathComponent(platform);
  const safeVersion = sanitizePathComponent(version);
  const ext = path.extname(file.originalname);
  const fileName = `${safePlatform}-v${safeVersion}${ext}`;
  const destPath = path.join(BUILDS_DIR, userId, fileName);
  await fs.copyFile(file.path, destPath);
  const stat = await fs.stat(destPath);

  const doc = {
    userId,
    platform,
    version,
    fileName,
    filePath: destPath,
    fileSize: stat.size,
    originalName: file.originalname,
    uploadedAt: new Date().toISOString(),
  };

  const result = await buildsColl().insertOne(doc);
  return { id: result.insertedId.toString(), ...doc };
}

export async function getLatestBuild(userId, platform) {
  const docs = await buildsColl()
    .find({ userId, platform })
    .sort({ uploadedAt: -1 })
    .limit(1)
    .toArray();
  if (!docs.length) return null;
  const doc = docs[0];
  return {
    id: doc._id.toString(),
    platform: doc.platform,
    version: doc.version,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    uploadedAt: doc.uploadedAt,
  };
}

export function validateWebhookUrl(url) {
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== "https:") return false;
  const allowedHosts = [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "api.github.com",
    "hooks.slack.com",
    "hooks.stripe.com",
    "circleci.com",
    "jenkins.io",
    "dev.azure.com",
  ];
  return allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
}

export async function saveWebhook(userId, platform, url) {
  if (!validateWebhookUrl(url)) throw new Error("Webhook URL must be HTTPS and point to a known CI/CD or notification service.");
  await webhooksColl().updateOne(
    { userId, platform },
    { $set: { userId, platform, url, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
}

export async function getWebhooks(userId) {
  const docs = await webhooksColl().find({ userId }).toArray();
  return docs.map((d) => ({ platform: d.platform, url: d.url }));
}
