import { getDb } from "../db.js";

const COLLECTION = "regression_runs";

function runsColl() {
  return getDb().collection(COLLECTION);
}

export async function createRun(userId, data) {
  const doc = {
    userId,
    platform: data.platform,
    status: "pending",
    testCases: data.testCases || [],
    scripts: [],
    results: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    buildVersion: data.buildVersion || null,
    suiteName: data.suiteName || null,
  };
  const result = await runsColl().insertOne(doc);
  return { id: result.insertedId.toString(), ...doc };
}

export async function listRuns(userId) {
  const docs = await runsColl()
    .find({ userId })
    .sort({ startedAt: -1 })
    .limit(50)
    .toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    platform: d.platform,
    status: d.status,
    testCases: d.testCases,
    scripts: d.scripts,
    results: d.results,
    startedAt: d.startedAt,
    completedAt: d.completedAt,
    buildVersion: d.buildVersion,
    suiteName: d.suiteName,
  }));
}

export async function getRun(userId, runId) {
  const { ObjectId } = await import("mongodb");
  const d = await runsColl().findOne({ _id: new ObjectId(runId), userId });
  if (!d) return null;
  return {
    id: d._id.toString(),
    platform: d.platform,
    status: d.status,
    testCases: d.testCases,
    scripts: d.scripts,
    results: d.results,
    startedAt: d.startedAt,
    completedAt: d.completedAt,
    buildVersion: d.buildVersion,
    suiteName: d.suiteName,
  };
}

export async function updateRun(runId, patch, userId) {
  const { ObjectId } = await import("mongodb");
  const query = { _id: new ObjectId(runId) };
  if (userId) query.userId = userId;
  const result = await runsColl().updateOne(query, { $set: patch });
  if (userId && !result.matchedCount) throw new Error("Run not found or access denied.");
}
