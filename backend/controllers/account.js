const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// Create new account for user
const createAccount = errorWrapper(async (req, res, next) => {
  const { accountName, type, currency } = req.body;
  const userId = req.user.id;

  if (!accountName || !type || !currency) {
    return next(
      new CustomError("Account name, type, and currency are required", 400)
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Generate account number and IBAN
  const {
    generateAccountNumber,
  } = require("../helpers/account/generateAccountNumber");
  const { generateIBAN } = require("../helpers/account/generateIBAN");

  const accountNumber = generateAccountNumber();
  const iban = generateIBAN(accountNumber);

  // Check if account number already exists
  const existingAccount = user.accounts.find(
    (acc) => acc.accountNumber === accountNumber
  );
  if (existingAccount) {
    return next(
      new CustomError("Account number conflict, please try again", 500)
    );
  }

  // Create new account
  const newAccount = {
    accountName: accountName,
    type: type,
    currency: currency,
    balance: 0,
    accountNumber: accountNumber,
    iban: iban,
    status: "active",
    transactions: [],
    createdAt: new Date(),
  };

  user.accounts.push(newAccount);
  await user.save();

  // Get the saved account with _id
  const savedAccount = user.accounts[user.accounts.length - 1];

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: savedAccount.toObject ? savedAccount.toObject() : savedAccount,
  });
});

// Get all accounts for user
const getAccounts = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("accounts");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    accounts: user.accounts || [],
    data: user.accounts || [],
    count: user.accounts ? user.accounts.length : 0,
  });
});

// Get account by ID
const getAccountById = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { accountId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: account,
  });
});

// Update account
const updateAccount = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { accountId } = req.params;
  const { accountName, status } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  if (accountName) account.accountName = accountName;
  if (status && ["active", "blocked", "closed"].includes(status)) {
    account.status = status;
    if (status === "closed") {
      account.closedAt = new Date();
    }
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Account updated successfully",
    data: account,
  });
});

// Close account
const closeAccount = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { accountId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  if (account.status === "closed") {
    return next(new CustomError("Account is already closed", 400));
  }

  if (account.balance > 0) {
    return next(
      new CustomError(
        "Cannot close account with balance. Please withdraw all funds first",
        400
      )
    );
  }

  account.status = "closed";
  account.closedAt = new Date();
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Account closed successfully",
    data: account,
  });
});

// Get account history (transactions)
const getAccountHistory = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { accountId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  // Sort transactions by date (newest first)
  const transactions = (account.transactions || []).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return res.status(200).json({
    success: true,
    transactions: transactions,
    data: transactions,
    count: transactions.length,
  });
});

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  closeAccount,
  getAccountHistory,
};
