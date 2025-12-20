const {
  TRANSFER_LIMITS,
  EXCHANGE_LIMITS,
  MINIMUM_EXCHANGE_AMOUNTS,
} = require("../../config/transactionLimits");
const CustomError = require("../error/CustomError");

// Check transfer limits (min/max)
function checkTransferLimits(amount, currency) {
  const limits = TRANSFER_LIMITS[currency];
  if (!limits) {
    throw new CustomError(
      `Currency ${currency} not supported for transfers`,
      400
    );
  }

  if (amount < limits.min) {
    throw new CustomError(
      `Minimum transfer amount is ${limits.min} ${currency}`,
      400
    );
  }

  if (amount > limits.max) {
    throw new CustomError(
      `Maximum transfer amount is ${limits.max} ${currency}`,
      400
    );
  }

  return true;
}

// Check daily exchange limits
async function checkExchangeLimits(userId, amount, currency, User) {
  const dailyLimit = EXCHANGE_LIMITS.daily[currency];
  if (!dailyLimit) {
    throw new CustomError(
      `Currency ${currency} not supported for exchange`,
      400
    );
  }

  // Get user's exchange transactions from today
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayExchangeTotal = 0;

  // Calculate today's exchange total from all accounts
  user.accounts.forEach((account) => {
    if (account.transactions && account.transactions.length > 0) {
      account.transactions.forEach((tx) => {
        if (
          (tx.type === "exchange-out" || tx.type === "exchange-in") &&
          tx.currency === currency &&
          new Date(tx.createdAt) >= today
        ) {
          if (tx.type === "exchange-out") {
            todayExchangeTotal += tx.amount;
          }
        }
      });
    }
  });

  if (todayExchangeTotal + amount > dailyLimit) {
    throw new CustomError(
      `Daily exchange limit exceeded. Limit: ${dailyLimit} ${currency}, Used: ${todayExchangeTotal} ${currency}, Remaining: ${
        dailyLimit - todayExchangeTotal
      } ${currency}`,
      400
    );
  }

  return true;
}

// Check minimum exchange amount
function checkMinimumExchangeAmount(amount, currency) {
  const minimum = MINIMUM_EXCHANGE_AMOUNTS[currency];
  if (!minimum) {
    throw new CustomError(
      `Currency ${currency} not supported for exchange`,
      400
    );
  }

  if (amount < minimum) {
    throw new CustomError(
      `Minimum exchange amount is ${minimum} ${currency}`,
      400
    );
  }

  return true;
}

module.exports = {
  checkTransferLimits,
  checkExchangeLimits,
  checkMinimumExchangeAmount,
};
