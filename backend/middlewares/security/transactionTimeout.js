const CustomError = require("../../helpers/error/CustomError");

// Transaction timeout middleware
// Default timeout: 30 seconds
const TRANSACTION_TIMEOUT = 30000; // 30 seconds

const transactionTimeout = (timeoutMs = TRANSACTION_TIMEOUT) => {
  return (req, res, next) => {
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        return next(
          new CustomError("Transaction timeout. Please try again.", 408)
        );
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function (...args) {
      clearTimeout(timeout);
      originalEnd.apply(this, args);
    };

    next();
  };
};

module.exports = transactionTimeout;
