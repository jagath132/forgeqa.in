import { getUserPlan } from './plans.js';
import { checkPlanLimit } from './usage.js';

const TIER_HIERARCHY = {
  free: 1,
  pro: 2,
  enterprise: 3,
};

function sendJsonError(res, statusCode, message, code = 'FORBIDDEN') {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      error: message,
      code,
    })
  );
}

/**
 * Middleware factory enforcing minimum plan tier for an endpoint.
 * @param {'pro' | 'enterprise'} minTier
 */
export function requirePlan(minTier = 'pro') {
  return async function planMiddleware(req, res, next) {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return sendJsonError(
        res,
        401,
        'Authentication required to access this feature.',
        'UNAUTHORIZED'
      );
    }

    try {
      const plan = await getUserPlan(userId);
      const userRank = TIER_HIERARCHY[plan.tier] || 1;
      const requiredRank = TIER_HIERARCHY[minTier] || 2;

      if (userRank < requiredRank) {
        return sendJsonError(
          res,
          403,
          `This feature requires a ${minTier.toUpperCase()} subscription plan or higher. Please upgrade to unlock.`,
          'PLAN_UPGRADE_REQUIRED'
        );
      }

      if (plan.subscriptionStatus === 'past_due' || plan.subscriptionStatus === 'canceled') {
        return sendJsonError(
          res,
          402,
          `Your subscription status is ${plan.subscriptionStatus}. Please update your billing info.`,
          'PAYMENT_REQUIRED'
        );
      }

      req.userPlan = plan;
      next();
    } catch (err) {
      console.error('Plan middleware error:', err);
      next();
    }
  };
}

/**
 * Middleware factory enforcing usage limit caps before request execution.
 * @param {'aiGenerations' | 'testCases' | 'knowledgeFiles' | 'teamMembers'} limitType
 */
export function checkLimit(limitType) {
  return async function limitMiddleware(req, res, next) {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return next(); // If unauthenticated / demo mode, bypass or defer
    }

    try {
      const limitCheck = await checkPlanLimit(userId, limitType, 1);
      if (!limitCheck.allowed) {
        return sendJsonError(res, 429, limitCheck.reason, 'LIMIT_EXCEEDED');
      }

      next();
    } catch (err) {
      console.error('Limit middleware error:', err);
      next();
    }
  };
}
