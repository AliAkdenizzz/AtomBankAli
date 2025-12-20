const CustomError = require("../error/CustomError");

// In-memory store for transaction tracking (in production, use Redis or database)
const transactionHistory = new Map(); // userId -> [{ type, amount, iban, timestamp }]

// Clean old transactions (older than 1 hour)
function cleanOldTransactions() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  transactionHistory.forEach((transactions, userId) => {
    const filtered = transactions.filter((tx) => tx.timestamp > oneHourAgo);
    if (filtered.length === 0) {
      transactionHistory.delete(userId);
    } else {
      transactionHistory.set(userId, filtered);
    }
  });
}

// Detect suspicious activity
function detectSuspiciousActivity(
  userId,
  transactionType,
  amount,
  iban = null
) {
  // Clean old transactions periodically
  if (Math.random() < 0.1) {
    // 10% chance to clean (to avoid cleaning on every request)
    cleanOldTransactions();
  }

  if (!transactionHistory.has(userId)) {
    transactionHistory.set(userId, []);
  }

  const userTransactions = transactionHistory.get(userId);
  const now = Date.now();

  // Add current transaction to history
  userTransactions.push({
    type: transactionType,
    amount: amount,
    iban: iban,
    timestamp: now,
  });

  // Keep only last 100 transactions per user
  if (userTransactions.length > 100) {
    userTransactions.shift();
  }

  const warnings = [];

  // Rule 1: Same IBAN multiple transfers in 5 minutes
  if (iban) {
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const sameIbanCount = userTransactions.filter(
      (tx) => tx.iban === iban && tx.timestamp > fiveMinutesAgo
    ).length;

    if (sameIbanCount >= 3) {
      warnings.push({
        type: "SAME_IBAN_MULTIPLE_TRANSFERS",
        message: `Multiple transfers to same IBAN detected (${sameIbanCount} transfers in 5 minutes)`,
        severity: "medium",
      });
    }
  }

  // Rule 2: High total amount in 1 hour
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentTransactions = userTransactions.filter(
    (tx) => tx.timestamp > oneHourAgo
  );
  const totalAmount = recentTransactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  if (totalAmount >= 100000) {
    warnings.push({
      type: "HIGH_TOTAL_AMOUNT",
      message: `High total transaction amount in 1 hour: ${totalAmount} TRY`,
      severity: "high",
    });
  }

  // Rule 3: Abnormal high amount (10x average)
  if (userTransactions.length > 5) {
    const averageAmount =
      userTransactions.reduce((sum, tx) => sum + tx.amount, 0) /
      userTransactions.length;
    if (amount > averageAmount * 10) {
      warnings.push({
        type: "ABNORMAL_HIGH_AMOUNT",
        message: `Transaction amount is significantly higher than average (${amount} vs ${averageAmount.toFixed(
          2
        )} average)`,
        severity: "medium",
      });
    }
  }

  // Rule 4: Very fast consecutive transactions (within 1 second)
  if (userTransactions.length >= 2) {
    const lastTransaction = userTransactions[userTransactions.length - 2];
    const timeDiff = now - lastTransaction.timestamp;
    if (timeDiff < 1000) {
      // Less than 1 second
      warnings.push({
        type: "FAST_CONSECUTIVE_TRANSACTIONS",
        message: "Very fast consecutive transactions detected",
        severity: "low",
      });
    }
  }

  // Return warnings (don't block, just warn)
  return warnings;
}

// Get user transaction history (for admin review)
function getUserTransactionHistory(userId) {
  return transactionHistory.get(userId) || [];
}

module.exports = {
  detectSuspiciousActivity,
  getUserTransactionHistory,
};
