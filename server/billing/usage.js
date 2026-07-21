import { getDb } from '../db.js';
import { getUserPlan } from './plans.js';

function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Gets active usage metrics for a user/workspace.
 * @param {string} userId
 */
export async function getUsage(userId) {
  if (!userId) {
    return {
      aiGenerationsToday: 0,
      totalTestCases: 0,
      totalFiles: 0,
      teamMembers: 1,
    };
  }

  const db = getDb();
  const todayKey = getTodayKey();

  // 1. Get today's AI generations count from usage_counters collection
  const usageDoc = await db.collection('usage_counters').findOne({ userId, date: todayKey });
  const aiGenerationsToday = usageDoc?.aiGenerationsCount || 0;

  // 2. Get total test cases count
  let totalTestCases = 0;
  try {
    const suites = await db.collection('test_suites').find({ userId }).toArray();
    for (const suite of suites) {
      totalTestCases += Array.isArray(suite.testCases) ? suite.testCases.length : 0;
    }
  } catch (_err) {
    // collection might not exist yet
  }

  // 3. Get total knowledge files count
  let totalFiles = 0;
  try {
    totalFiles = await db.collection('knowledge_files').countDocuments({ userId });
  } catch (_err) {
    // fallback
  }

  // 4. Get total team members count
  let teamMembers = 1;
  try {
    const user = await db
      .collection('users')
      .findOne({ _id: new (await import('mongodb')).ObjectId(userId) });
    if (user?.workspaceId) {
      teamMembers = await db.collection('users').countDocuments({ workspaceId: user.workspaceId });
    }
  } catch (_err) {
    // fallback
  }

  return {
    aiGenerationsToday,
    totalTestCases,
    totalFiles,
    teamMembers,
    todayKey,
  };
}

/**
 * Increments the daily AI generation counter for a user.
 * @param {string} userId
 * @param {number} incrementBy
 */
export async function incrementAiGenerations(userId, incrementBy = 1) {
  if (!userId) return;
  const db = getDb();
  const todayKey = getTodayKey();

  await db.collection('usage_counters').updateOne(
    { userId, date: todayKey },
    {
      $inc: { aiGenerationsCount: incrementBy },
      $setOnInsert: { createdAt: new Date().toISOString() },
      $set: { updatedAt: new Date().toISOString() },
    },
    { upsert: true }
  );
}

/**
 * Checks if a user has exceeded their plan's specific limit.
 * @param {string} userId
 * @param {'aiGenerations' | 'testCases' | 'knowledgeFiles' | 'teamMembers'} limitType
 * @param {number} requestedAmount
 * @returns {Promise<{ allowed: boolean, reason?: string, current: number, limit: number }>}
 */
export async function checkPlanLimit(userId, limitType, requestedAmount = 1) {
  const plan = await getUserPlan(userId);

  // Check account billing status
  if (plan.subscriptionStatus === 'past_due' || plan.subscriptionStatus === 'canceled') {
    return {
      allowed: false,
      reason: `Account subscription is ${plan.subscriptionStatus}. Please update your billing status.`,
      current: 0,
      limit: 0,
    };
  }

  const usage = await getUsage(userId);

  if (limitType === 'aiGenerations') {
    const current = usage.aiGenerationsToday;
    const limit = plan.aiGenerationsPerDay ?? 20;
    if (current + requestedAmount > limit) {
      return {
        allowed: false,
        reason: `Daily AI generation limit reached (${current}/${limit} used today). Upgrade your plan for more generations.`,
        current,
        limit,
      };
    }
    return { allowed: true, current, limit };
  }

  if (limitType === 'testCases') {
    const current = usage.totalTestCases;
    const limit = plan.maxTestCases ?? 500;
    if (limit !== null && current + requestedAmount > limit) {
      return {
        allowed: false,
        reason: `Maximum test case storage limit reached (${current}/${limit} test cases). Upgrade to store more test cases.`,
        current,
        limit,
      };
    }
    return { allowed: true, current, limit };
  }

  if (limitType === 'knowledgeFiles') {
    const current = usage.totalFiles;
    const limit = plan.maxFiles ?? 3;
    if (limit !== null && current + requestedAmount > limit) {
      return {
        allowed: false,
        reason: `Knowledge base file upload limit reached (${current}/${limit} files uploaded). Upgrade to upload more documents.`,
        current,
        limit,
      };
    }
    return { allowed: true, current, limit };
  }

  if (limitType === 'teamMembers') {
    const current = usage.teamMembers;
    const limit = plan.maxUsers ?? 1;
    if (limit !== null && current + requestedAmount > limit) {
      return {
        allowed: false,
        reason: `Workspace member limit reached (${current}/${limit} users). Upgrade to add more seats.`,
        current,
        limit,
      };
    }
    return { allowed: true, current, limit };
  }

  return { allowed: true, current: 0, limit: 99999 };
}
