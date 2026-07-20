import { getDb } from "../db.js";

export async function logAudit({ adminId, adminEmail, action, resource, resourceId, details, ip }) {
  const db = getDb();
  await db.collection("audit_logs").insertOne({
    adminId,
    adminEmail,
    action,
    resource,
    resourceId: resourceId || null,
    details: details || null,
    ip: ip || null,
    createdAt: new Date().toISOString(),
  });
}

export async function getAuditLogs({ limit = 200, skip = 0, adminId, action } = {}) {
  const db = getDb();
  const query = {};
  if (adminId) query.adminId = adminId;
  if (action) query.action = action;
  const docs = await db.collection("audit_logs")
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    adminId: d.adminId,
    adminEmail: d.adminEmail,
    action: d.action,
    resource: d.resource,
    resourceId: d.resourceId,
    details: d.details,
    ip: d.ip,
    createdAt: d.createdAt,
  }));
}
