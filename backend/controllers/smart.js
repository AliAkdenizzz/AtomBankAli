const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// Get insights for user
const getInsights = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { unreadOnly } = req.query;

  const user = await User.findById(userId).select("insights");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  let insights = user.insights || [];

  // Filter unread only if requested
  if (unreadOnly === "true" || unreadOnly === true) {
    insights = insights.filter((insight) => !insight.isRead);
  }

  // Sort by date (newest first)
  insights.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return res.status(200).json({
    success: true,
    data: insights,
    count: insights.length,
  });
});

// Get spending analysis
const getSpendingAnalysis = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { period = "monthly" } = req.query;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Calculate spending aggregate
  const aggregate = user.calculateSpendingAggregate(period);

  // Get period dates
  const now = new Date();
  let startDate;
  switch (period) {
    case "daily":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "weekly":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "monthly":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "yearly":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  // Convert byCategory to proper format for JSON response
  const byCategory = {};
  if (aggregate.byCategory) {
    // Handle both Map and plain object
    if (aggregate.byCategory instanceof Map) {
      aggregate.byCategory.forEach((value, key) => {
        byCategory[key] = value;
      });
    } else {
      Object.assign(byCategory, aggregate.byCategory);
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      period: period,
      periodStart: startDate,
      periodEnd: now,
      totalIncome: aggregate.totalIncome,
      totalSpending: aggregate.totalSpending,
      netAmount: aggregate.totalIncome - aggregate.totalSpending,
      byCategory: byCategory,
    },
  });
});

module.exports = {
  getInsights,
  getSpendingAnalysis,
};
