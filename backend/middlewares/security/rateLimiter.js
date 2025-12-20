const rateLimit = require("express-rate-limit");
const { RATE_LIMIT_CONFIGS } = require("../../config/transactionLimits");

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIGS.general.windowMs,
  max: RATE_LIMIT_CONFIGS.general.max,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transfer rate limiter
const transferLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIGS.transfer.windowMs,
  max: RATE_LIMIT_CONFIGS.transfer.max,
  message: {
    success: false,
    message: "Too many transfer requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise use IP
    return req.user ? req.user.id : req.ip;
  },
});

// Exchange rate limiter
const exchangeLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIGS.exchange.windowMs,
  max: RATE_LIMIT_CONFIGS.exchange.max,
  message: {
    success: false,
    message: "Too many exchange requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
});

// Bill payment rate limiter
const billLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIGS.bill.windowMs,
  max: RATE_LIMIT_CONFIGS.bill.max,
  message: {
    success: false,
    message: "Too many bill payment requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
});

module.exports = {
  generalLimiter,
  transferLimiter,
  exchangeLimiter,
  billLimiter,
};
