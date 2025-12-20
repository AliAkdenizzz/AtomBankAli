const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// Get all users with their accounts, bills, and transactions
const getAllUsers = errorWrapper(async (req, res, next) => {
  const users = await User.find({}).select(
    "name fullName email role blocked isActive createdAt accounts bills"
  );

  const usersWithData = users.map((user) => {
    const userObj = user.toObject();
    return {
      _id: userObj._id,
      name: userObj.name,
      fullName: userObj.fullName,
      email: userObj.email,
      role: userObj.role,
      blocked: userObj.blocked,
      isActive: userObj.isActive,
      createdAt: userObj.createdAt,
      accounts: userObj.accounts || [],
      bills: userObj.bills || [],
      transactions: userObj.accounts
        ? userObj.accounts.flatMap((account) =>
            (account.transactions || []).map((tx) => ({
              ...tx,
              accountId: account._id,
              accountNumber: account.accountNumber,
            }))
          )
        : [],
    };
  });

  return res.status(200).json({
    success: true,
    data: usersWithData,
    count: usersWithData.length,
  });
});

// Block/Unblock user
const blockUser = errorWrapper(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  // Admin cannot block themselves
  if (id === adminId) {
    return next(
      new CustomError("You cannot block or unblock yourself", 403)
    );
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Toggle blocked status
  user.blocked = !user.blocked;
  await user.save();

  return res.status(200).json({
    success: true,
    message: user.blocked
      ? "User has been blocked"
      : "User has been unblocked",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      blocked: user.blocked,
    },
  });
});

// Get all transactions from all users (with optional userId filter)
const getAllTransactions = errorWrapper(async (req, res, next) => {
  const { userId, type, status } = req.query;

  let users;
  if (userId) {
    users = await User.findById(userId).select("name fullName email accounts");
    if (!users) {
      return next(new CustomError("User not found", 404));
    }
    users = [users];
  } else {
    users = await User.find({}).select("name fullName email accounts");
  }

  // Flatten all transactions from all users' accounts
  const allTransactions = [];

  users.forEach((user) => {
    if (user.accounts && user.accounts.length > 0) {
      user.accounts.forEach((account) => {
        if (account.transactions && account.transactions.length > 0) {
          account.transactions.forEach((tx) => {
            // Apply filters
            if (type && tx.type !== type) return;
            if (status && tx.status !== status) return;

            allTransactions.push({
              _id: tx._id,
              type: tx.type,
              amount: tx.amount,
              currency: tx.currency || account.currency,
              status: tx.status,
              description: tx.description,
              createdAt: tx.createdAt,
              date: tx.createdAt,
              // User info
              userId: user._id,
              userName: user.fullName || user.name,
              userEmail: user.email,
              // Account info
              accountId: account._id,
              accountNumber: account.accountNumber,
              accountName: account.accountName,
              // Additional transaction fields
              fromAccountId: tx.fromAccountId,
              toAccountId: tx.toAccountId,
              toIBAN: tx.toIBAN,
              recipientName: tx.recipientName,
              exchangeRate: tx.exchangeRate,
              convertedAmount: tx.convertedAmount,
              billId: tx.billId,
              category: tx.category,
            });
          });
        }
      });
    }
  });

  // Sort by date (newest first)
  allTransactions.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date);
    const dateB = new Date(b.createdAt || b.date);
    return dateB - dateA;
  });

  return res.status(200).json({
    success: true,
    data: allTransactions,
    count: allTransactions.length,
  });
});

module.exports = {
  getAllUsers,
  blockUser,
  getAllTransactions,
};

