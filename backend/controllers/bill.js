const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// Helper function to get exchange rate (from exchangeController logic)
function getExchangeRate(fromCurrency, toCurrency) {
  const rates = {
    TRY: { USD: 0.0234, EUR: 0.0199, GBP: 0.0175 },
    USD: { TRY: 42.7, EUR: 0.85, GBP: 0.75 },
    EUR: { TRY: 50.13, USD: 1.17, GBP: 0.88 },
    GBP: { TRY: 57.17, USD: 1.34, EUR: 1.14 },
  };
  return rates[fromCurrency]?.[toCurrency];
}

// Add new bill
const addBill = errorWrapper(async (req, res, next) => {
  const {
    title,
    companyName,
    subscriberNo,
    category,
    amount,
    dueDate,
    isRecurring,
    recurringDay,
  } = req.body;
  const userId = req.user.id;

  if (!title || !companyName || !amount || !dueDate) {
    return next(
      new CustomError(
        "Title, company name, amount, and due date are required",
        400
      )
    );
  }

  if (amount <= 0) {
    return next(new CustomError("Amount must be positive", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Validate due date (warn if past date, but allow)
  const dueDateObj = new Date(dueDate);
  const now = new Date();
  if (dueDateObj < now) {
    // Allow past dates but mark as overdue
    console.warn(`Bill with past due date created: ${dueDateObj}`);
  }

  // Create bill
  const bill = {
    title: title,
    companyName: companyName,
    subscriberNo: subscriberNo || "",
    category: category || "other",
    amount: amount,
    dueDate: dueDateObj,
    status: dueDateObj < now ? "overdue" : "pending",
    isPaid: false,
    isRecurring: isRecurring || false,
    recurringDay: recurringDay || null,
    autoPay: {
      enabled: false,
    },
  };

  user.bills.push(bill);
  await user.save();

  return res.status(201).json({
    success: true,
    message: "Bill added successfully",
    data: user.bills[user.bills.length - 1],
  });
});

// Get all bills for user
const getBills = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { status, isPaid } = req.query;

  const user = await User.findById(userId).select("bills");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  let bills = user.bills || [];

  // Apply filters
  if (status) {
    bills = bills.filter((bill) => bill.status === status);
  }
  if (isPaid !== undefined) {
    const paidFilter = isPaid === "true" || isPaid === true;
    bills = bills.filter((bill) => bill.isPaid === paidFilter);
  }

  // Sort by due date (earliest first)
  bills.sort((a, b) => {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return res.status(200).json({
    success: true,
    bills: bills,
    data: bills,
    count: bills.length,
  });
});

// Pay a bill
const payBill = errorWrapper(async (req, res, next) => {
  // Support both URL params and body for billId
  const billId = req.params.billId || req.body.billId;
  const { accountId } = req.body;
  const userId = req.user.id;

  if (!billId || !accountId) {
    return next(new CustomError("Bill ID and account ID are required", 400));
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

  const bill = user.bills.id(billId);
  if (!bill) {
    return next(new CustomError("Bill not found", 404));
  }

  if (bill.isPaid) {
    return next(new CustomError("Bill is already paid", 400));
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  if (account.status !== "active") {
    return next(new CustomError("Account is not active", 400));
  }

  // Check due date (warn if overdue, but allow payment)
  const now = new Date();
  const isOverdue = new Date(bill.dueDate) < now;
  if (isOverdue) {
    console.warn(
      `Paying overdue bill: ${bill.title}, due date: ${bill.dueDate}`
    );
  }

  // Handle currency conversion if bill currency != account currency
  let paymentAmount = bill.amount;
  let originalAmount = bill.amount;
  let exchangeRate = null;
  let billCurrency = bill.currency || "TRY"; // Default to TRY if not specified

  // If currencies are different, convert
  if (billCurrency !== account.currency) {
    exchangeRate = getExchangeRate(billCurrency, account.currency);
    if (!exchangeRate) {
      return next(
        new CustomError(
          `Exchange rate not available for ${billCurrency} to ${account.currency}`,
          400
        )
      );
    }
    paymentAmount = bill.amount * exchangeRate;
    console.log(
      `Currency conversion: ${bill.amount} ${billCurrency} = ${paymentAmount} ${account.currency} (rate: ${exchangeRate})`
    );
  }

  if (account.balance < paymentAmount) {
    return next(new CustomError("Insufficient balance", 400));
  }

  // Create transaction
  // Map bill categories to valid transaction categories
  const billCategoryToTransactionCategory = (billCat) => {
    const mapping = {
      electricity: "utilities",
      water: "utilities",
      gas: "utilities",
      internet: "utilities",
      phone: "utilities",
      tv: "entertainment",
      insurance: "other",
      rent: "other",
      mobile: "utilities",
      "credit-card": "other",
      streaming: "entertainment",
      tuition: "education",
      gym: "health",
    };
    return mapping[billCat] || "utilities";
  };

  const transaction = {
    type: "bill-payment",
    amount: paymentAmount,
    currency: account.currency,
    billId: billId,
    description: `Bill payment: ${bill.title}${
      exchangeRate ? ` (${bill.amount} ${billCurrency} converted)` : ""
    }`,
    status: "completed",
    category: billCategoryToTransactionCategory(bill.category),
    createdAt: new Date(),
    // Store original amount and exchange rate if conversion happened
    originalAmount: exchangeRate ? originalAmount : undefined,
    originalCurrency: exchangeRate ? billCurrency : undefined,
    exchangeRate: exchangeRate || undefined,
  };

  // Update account balance
  account.balance -= paymentAmount;
  account.transactions.push(transaction);

  // Update bill status
  bill.isPaid = true;
  bill.status = "paid";
  bill.paidAt = new Date();
  bill.paidFromAccountId = accountId;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Bill paid successfully",
    data: {
      bill: bill,
      newBalance: account.balance,
      transaction: account.transactions[account.transactions.length - 1],
      currencyConversion: exchangeRate
        ? {
            originalAmount: originalAmount,
            originalCurrency: billCurrency,
            convertedAmount: paymentAmount,
            convertedCurrency: account.currency,
            exchangeRate: exchangeRate,
          }
        : null,
    },
  });
});

// Set auto-pay for a bill
const setAutoPay = errorWrapper(async (req, res, next) => {
  const { billId, accountId, enabled } = req.body;
  const userId = req.user.id;

  if (!billId) {
    return next(new CustomError("Bill ID is required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const bill = user.bills.id(billId);
  if (!bill) {
    return next(new CustomError("Bill not found", 404));
  }

  if (enabled === true || enabled === "true") {
    if (!accountId) {
      return next(
        new CustomError("Account ID is required to enable auto-pay", 400)
      );
    }

    const account = user.accounts.id(accountId);
    if (!account) {
      return next(new CustomError("Account not found", 404));
    }

    bill.autoPay.enabled = true;
    bill.autoPay.accountId = accountId;
  } else {
    bill.autoPay.enabled = false;
    bill.autoPay.accountId = null;
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: enabled ? "Auto-pay enabled" : "Auto-pay disabled",
    data: bill,
  });
});

// Delete a bill
const deleteBill = errorWrapper(async (req, res, next) => {
  const { billId } = req.params;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const bill = user.bills.id(billId);
  if (!bill) {
    return next(new CustomError("Bill not found", 404));
  }

  if (bill.isPaid) {
    return next(new CustomError("Cannot delete a paid bill", 400));
  }

  user.bills.pull(billId);
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Bill deleted successfully",
  });
});

module.exports = {
  addBill,
  getBills,
  payBill,
  setAutoPay,
  deleteBill,
};
