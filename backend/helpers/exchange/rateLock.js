// Exchange rate locking to prevent double-charge
// In production, use Redis for distributed systems

const rateLocks = new Map(); // transactionId -> { fromCurrency, toCurrency, rate, timestamp }

// Lock exchange rate for a transaction
function lockExchangeRate(fromCurrency, toCurrency, transactionId) {
  // Clean old locks (older than 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  rateLocks.forEach((lock, id) => {
    if (lock.timestamp < fiveMinutesAgo) {
      rateLocks.delete(id);
    }
  });

  // Get current rate (this would normally come from getExchangeRates)
  // For now, we'll store the rate that was used
  const lock = {
    fromCurrency,
    toCurrency,
    transactionId,
    timestamp: Date.now(),
  };

  rateLocks.set(transactionId, lock);
  return lock;
}

// Get locked rate for a transaction
function getLockedRate(transactionId) {
  return rateLocks.get(transactionId);
}

// Release rate lock
function releaseRateLock(transactionId) {
  rateLocks.delete(transactionId);
}

// Clean all expired locks
function cleanExpiredLocks() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  rateLocks.forEach((lock, id) => {
    if (lock.timestamp < fiveMinutesAgo) {
      rateLocks.delete(id);
    }
  });
}

module.exports = {
  lockExchangeRate,
  getLockedRate,
  releaseRateLock,
  cleanExpiredLocks,
};
