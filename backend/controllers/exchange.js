const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");
const {
  checkExchangeLimits,
  checkMinimumExchangeAmount,
} = require("../helpers/validation/transactionLimits");
const {
  detectSuspiciousActivity,
} = require("../helpers/validation/fraudDetection");
const {
  lockExchangeRate,
  releaseRateLock,
} = require("../helpers/exchange/rateLock");

// Rate cache (5 minutes)
const rateCache = new Map(); // baseCurrency -> { rates, timestamp }

// Get exchange rates (mock data - in production, use real API)
const getExchangeRates = errorWrapper(async (req, res, next) => {
  const { baseCurrency = "TRY" } = req.query;

  // Check cache first
  const cached = rateCache.get(baseCurrency);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  if (cached && cached.timestamp > fiveMinutesAgo) {
    return res.status(200).json({
      success: true,
      data: {
        baseCurrency: baseCurrency,
        rates: cached.rates,
        lastUpdated: cached.timestamp,
        cached: true,
      },
    });
  }

  // Mock exchange rates (in production, fetch from external API)
  const rates = {
    TRY: {
      USD: 0.0234, // (1 / 42.69)
      EUR: 0.0199, // (1 / 50.13)
      GBP: 0.0175, // (1 / 57.17)
      TRY: 1.0,
    },
    USD: {
      TRY: 42.7,
      EUR: 0.85, // (1 / 1.17)
      GBP: 0.75, // (1 / 1.34)
      USD: 1.0,
    },
    EUR: {
      TRY: 50.13,
      USD: 1.17,
      GBP: 0.88, // (1 / 1.14)
      EUR: 1.0,
    },
    GBP: {
      TRY: 57.17,
      USD: 1.34,
      EUR: 1.14,
      GBP: 1.0,
    },
  };

  const baseRates = rates[baseCurrency];
  if (!baseRates) {
    return next(new CustomError("Invalid base currency", 400));
  }

  // Cache the rates
  rateCache.set(baseCurrency, {
    rates: baseRates,
    timestamp: Date.now(),
  });

  return res.status(200).json({
    success: true,
    data: {
      baseCurrency: baseCurrency,
      rates: baseRates,
      lastUpdated: new Date(),
      cached: false,
    },
  });
});

// Convert currency
const convertCurrency = errorWrapper(async (req, res, next) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  const userId = req.user.id;

  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    return next(
      new CustomError(
        "From account, to account, and positive amount are required",
        400
      )
    );
  }

  if (fromAccountId === toAccountId) {
    return next(new CustomError("Cannot convert to the same account", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Check user status
  if (user.blocked || !user.isActive) {
    return next(
      new CustomError("Your account has been blocked or deactivated", 403)
    );
  }

  const fromAccount = user.accounts.id(fromAccountId);
  const toAccount = user.accounts.id(toAccountId);

  if (!fromAccount || !toAccount) {
    return next(new CustomError("One or both accounts not found", 404));
  }

  if (fromAccount.status !== "active" || toAccount.status !== "active") {
    return next(new CustomError("One or both accounts are not active", 400));
  }

  if (fromAccount.balance < amount) {
    return next(new CustomError("Insufficient balance", 400));
  }

  // Check if same currency
  if (fromAccount.currency === toAccount.currency) {
    return next(new CustomError("Cannot convert to the same currency", 400));
  }

  // Check minimum exchange amount
  try {
    checkMinimumExchangeAmount(amount, fromAccount.currency);
  } catch (err) {
    return next(err);
  }

  // Check daily exchange limits
  try {
    await checkExchangeLimits(userId, amount, fromAccount.currency, User);
  } catch (err) {
    return next(err);
  }

  // Fraud detection
  const fraudWarnings = detectSuspiciousActivity(
    userId,
    "currency-exchange",
    amount,
    null
  );
  if (fraudWarnings.length > 0) {
    console.warn("Fraud warnings for currency exchange:", fraudWarnings);
  }

  // Generate transaction ID for rate locking
  const transactionId = `EXCH-${Date.now()}-${userId}`;

  // Lock exchange rate (get rate and lock it)
  const rates = {
    TRY: { USD: 0.0234, EUR: 0.0199, GBP: 0.0175 },
    USD: { TRY: 42.7, EUR: 0.85, GBP: 0.75 },
    EUR: { TRY: 50.13, USD: 1.17, GBP: 0.88 },
    GBP: { TRY: 57.17, USD: 1.34, EUR: 1.14 },
  };

  const exchangeRate = rates[fromAccount.currency]?.[toAccount.currency];
  if (!exchangeRate) {
    return next(
      new CustomError(
        `Exchange rate not available for ${fromAccount.currency} to ${toAccount.currency}`,
        400
      )
    );
  }

  // Lock the rate
  lockExchangeRate(fromAccount.currency, toAccount.currency, transactionId);

  try {
    const convertedAmount = amount * exchangeRate;

    // Create transactions
    const exchangeOut = {
      type: "exchange-out",
      amount: amount,
      currency: fromAccount.currency,
      exchangeRate: exchangeRate,
      convertedAmount: convertedAmount,
      description: `Currency exchange: ${amount} ${fromAccount.currency} to ${toAccount.currency}`,
      status: "completed",
      category: "transfer",
      createdAt: new Date(),
    };

    const exchangeIn = {
      type: "exchange-in",
      amount: convertedAmount,
      currency: toAccount.currency,
      exchangeRate: exchangeRate,
      convertedAmount: amount,
      description: `Currency exchange: ${amount} ${fromAccount.currency} to ${toAccount.currency}`,
      status: "completed",
      category: "income",
      createdAt: new Date(),
    };

    // Update balances
    fromAccount.balance -= amount;
    toAccount.balance += convertedAmount;

    fromAccount.transactions.push(exchangeOut);
    toAccount.transactions.push(exchangeIn);

    await user.save();

    // Release rate lock after successful transaction
    releaseRateLock(transactionId);

    return res.status(201).json({
      success: true,
      message: "Currency conversion successful",
      data: {
        exchangeRate: exchangeRate,
        fromAmount: amount,
        toAmount: convertedAmount,
        fromAccount: {
          currency: fromAccount.currency,
          newBalance: fromAccount.balance,
        },
        toAccount: {
          currency: toAccount.currency,
          newBalance: toAccount.balance,
        },
        transactions: {
          out: fromAccount.transactions[fromAccount.transactions.length - 1],
          in: toAccount.transactions[toAccount.transactions.length - 1],
        },
      },
    });
  } catch (err) {
    // Release rate lock on error
    releaseRateLock(transactionId);
    throw err;
  }
});

module.exports = {
  getExchangeRates,
  convertCurrency,
};
