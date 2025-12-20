// Transaction limits configuration

const TRANSFER_LIMITS = {
  TRY: { min: 1, max: 100000 },
  USD: { min: 1, max: 50000 },
  EUR: { min: 1, max: 50000 },
  GBP: { min: 1, max: 40000 },
};

const EXCHANGE_LIMITS = {
  daily: {
    TRY: 50000,
    USD: 2000,
    EUR: 2000,
    GBP: 1500,
  },
};

const MINIMUM_EXCHANGE_AMOUNTS = {
  TRY: 10,
  USD: 1,
  EUR: 1,
  GBP: 1,
};

const RATE_LIMIT_CONFIGS = {
  transfer: {
    windowMs: 60000, // 1 minute
    max: 10, // 10 requests per minute
  },
  exchange: {
    windowMs: 60000, // 1 minute
    max: 5, // 5 requests per minute
  },
  bill: {
    windowMs: 60000, // 1 minute
    max: 20, // 20 requests per minute
  },
  general: {
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
  },
};

module.exports = {
  TRANSFER_LIMITS,
  EXCHANGE_LIMITS,
  MINIMUM_EXCHANGE_AMOUNTS,
  RATE_LIMIT_CONFIGS,
};
