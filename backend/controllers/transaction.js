const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");
const {
  validateIBAN,
  normalizeIBAN,
} = require("../helpers/validation/ibanValidator");
const {
  checkTransferLimits,
} = require("../helpers/validation/transactionLimits");
const {
  detectSuspiciousActivity,
} = require("../helpers/validation/fraudDetection");

// Deposit money to account
const deposit = errorWrapper(async (req, res, next) => {
  const { accountId, amount, description, category } = req.body;
  const userId = req.user.id;

  if (!accountId || !amount || amount <= 0) {
    return next(
      new CustomError("Account ID and positive amount are required", 400)
    );
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

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  if (account.status !== "active") {
    return next(new CustomError("Account is not active", 400));
  }

  // Check transfer limits
  try {
    checkTransferLimits(amount, account.currency);
  } catch (err) {
    return next(err);
  }

  // Fraud detection
  const fraudWarnings = detectSuspiciousActivity(
    userId,
    "deposit",
    amount,
    null
  );
  if (fraudWarnings.length > 0) {
    console.warn("Fraud warnings for deposit:", fraudWarnings);
    // Don't block, just log
  }

  // Create transaction
  const transaction = {
    type: "deposit",
    amount: amount,
    currency: account.currency,
    description: description || "Deposit",
    status: "completed",
    category: category || "income",
    createdAt: new Date(),
  };

  // Update balance
  account.balance += amount;
  account.transactions.push(transaction);
  await user.save();

  return res.status(201).json({
    success: true,
    message: "Deposit successful",
    data: {
      transaction: account.transactions[account.transactions.length - 1],
      newBalance: account.balance,
    },
  });
});

// Withdraw money from account
const withdraw = errorWrapper(async (req, res, next) => {
  const { accountId, amount, description, category } = req.body;
  const userId = req.user.id;

  if (!accountId || !amount || amount <= 0) {
    return next(
      new CustomError("Account ID and positive amount are required", 400)
    );
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

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  if (account.status !== "active") {
    return next(new CustomError("Account is not active", 400));
  }

  if (account.balance < amount) {
    return next(new CustomError("Insufficient balance", 400));
  }

  // Check transfer limits
  try {
    checkTransferLimits(amount, account.currency);
  } catch (err) {
    return next(err);
  }

  // Fraud detection
  const fraudWarnings = detectSuspiciousActivity(
    userId,
    "withdraw",
    amount,
    null
  );
  if (fraudWarnings.length > 0) {
    console.warn("Fraud warnings for withdraw:", fraudWarnings);
  }

  // Create transaction
  const transaction = {
    type: "withdraw",
    amount: amount,
    currency: account.currency,
    description: description || "Withdrawal",
    status: "completed",
    category: category || "other",
    createdAt: new Date(),
  };

  // Update balance
  account.balance -= amount;
  account.transactions.push(transaction);
  await user.save();

  return res.status(201).json({
    success: true,
    message: "Withdrawal successful",
    data: {
      transaction: account.transactions[account.transactions.length - 1],
      newBalance: account.balance,
    },
  });
});

// Internal transfer between user's own accounts
const transferInternal = errorWrapper(async (req, res, next) => {
  const { fromAccountId, toAccountId, amount, description } = req.body;
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
    return next(new CustomError("Cannot transfer to the same account", 400));
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

  // Check transfer limits
  try {
    checkTransferLimits(amount, fromAccount.currency);
  } catch (err) {
    return next(err);
  }

  // Fraud detection
  const fraudWarnings = detectSuspiciousActivity(
    userId,
    "transfer-internal",
    amount,
    null
  );
  if (fraudWarnings.length > 0) {
    console.warn("Fraud warnings for internal transfer:", fraudWarnings);
  }

  // Create transactions
  const transferOut = {
    type: "transfer-out",
    amount: amount,
    currency: fromAccount.currency,
    fromAccountId: fromAccountId,
    toAccountId: toAccountId,
    description: description || `Transfer to ${toAccount.accountName}`,
    status: "completed",
    category: "transfer",
    createdAt: new Date(),
  };

  const transferIn = {
    type: "transfer-in",
    amount: amount,
    currency: toAccount.currency,
    fromAccountId: fromAccountId,
    toAccountId: toAccountId,
    description: description || `Transfer from ${fromAccount.accountName}`,
    status: "completed",
    category: "income",
    createdAt: new Date(),
  };

  // Update balances
  fromAccount.balance -= amount;
  toAccount.balance += amount;

  fromAccount.transactions.push(transferOut);
  toAccount.transactions.push(transferIn);

  await user.save();

  return res.status(201).json({
    success: true,
    message: "Transfer successful",
    data: {
      fromAccount: {
        newBalance: fromAccount.balance,
        transaction:
          fromAccount.transactions[fromAccount.transactions.length - 1],
      },
      toAccount: {
        newBalance: toAccount.balance,
        transaction: toAccount.transactions[toAccount.transactions.length - 1],
      },
    },
  });
});

// External transfer (to IBAN)
const transferExternal = errorWrapper(async (req, res, next) => {
  const { accountId, toIBAN, recipientName, amount, description } = req.body;
  const userId = req.user.id;

  if (!accountId || !toIBAN || !recipientName || !amount || amount <= 0) {
    return next(
      new CustomError(
        "Account ID, recipient IBAN, recipient name, and positive amount are required",
        400
      )
    );
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

  // Validate IBAN format - TEMPORARILY COMMENTED OUT
  // if (!validateIBAN(toIBAN)) {
  //   return next(
  //     new CustomError("Invalid IBAN format. Please check and try again.", 400)
  //   );
  // }

  const normalizedIBAN = normalizeIBAN(toIBAN);

  // Check if transferring to own account
  const ownAccount = user.accounts.find(
    (acc) => normalizeIBAN(acc.iban) === normalizedIBAN
  );
  if (ownAccount) {
    return next(
      new CustomError(
        "Cannot transfer to your own account. Use internal transfer instead.",
        400
      )
    );
  }

  const account = user.accounts.id(accountId);
  if (!account) {
    return next(new CustomError("Account not found", 404));
  }

  // Check recipient's currency from saved recipients
  const savedRecipient = user.savedRecipients?.find(
    (r) => normalizeIBAN(r.iban) === normalizedIBAN
  );

  if (savedRecipient && savedRecipient.currency) {
    // Validate currency match
    if (savedRecipient.currency !== account.currency) {
      return next(
        new CustomError(
          `Currency mismatch! Your account is ${account.currency} but recipient's account is ${savedRecipient.currency}. Transfers can only be made between accounts with the same currency.`,
          400
        )
      );
    }
  }


  if (account.status !== "active") {
    return next(new CustomError("Account is not active", 400));
  }

  if (account.balance < amount) {
    return next(new CustomError("Insufficient balance", 400));
  }

  // Check transfer limits
  try {
    checkTransferLimits(amount, account.currency);
  } catch (err) {
    return next(err);
  }

  // Fraud detection
  const fraudWarnings = detectSuspiciousActivity(
    userId,
    "transfer-external",
    amount,
    normalizedIBAN
  );
  if (fraudWarnings.length > 0) {
    console.warn("Fraud warnings for external transfer:", fraudWarnings);
    // In production, you might want to flag this for admin review
  }

  // Create transaction
  const transaction = {
    type: "transfer-ext",
    amount: amount,
    currency: account.currency,
    toIBAN: normalizedIBAN, // Store normalized IBAN
    recipientName: recipientName,
    description: description || `External transfer to ${recipientName}`,
    status: "completed",
    category: "transfer",
    createdAt: new Date(),
  };

  // Update balance
  account.balance -= amount;
  account.transactions.push(transaction);
  await user.save();

  return res.status(201).json({
    success: true,
    message: "External transfer successful",
    data: {
      transaction: account.transactions[account.transactions.length - 1],
      newBalance: account.balance,
    },
  });
});

// Verify IBAN and get recipient info
const verifyIban = errorWrapper(async (req, res, next) => {
  const { iban } = req.body;

  if (!iban) {
    return next(new CustomError("IBAN is required", 400));
  }

  const normalizedIBAN = normalizeIBAN(iban);

  // Check if this IBAN belongs to an Atom Bank user
  const recipientUser = await User.findOne({
    "accounts.iban": { $regex: new RegExp(`^${normalizedIBAN}$`, "i") },
  }).select("fullName name accounts");

  if (recipientUser) {
    // Found Atom Bank user - return real name
    const recipientAccount = recipientUser.accounts.find(
      (acc) => normalizeIBAN(acc.iban) === normalizedIBAN
    );

    const fullName = recipientUser.fullName || recipientUser.name || "Unknown";

    return res.status(200).json({
      success: true,
      data: {
        found: true,
        isAtomBank: true,
        fullName: fullName,
        currency: recipientAccount?.currency || "TRY",
      },
    });
  }

  // Not an Atom Bank user - simulate external bank response
  // In real banking, this would query the central banking system
  // For demo, we generate a simulated Turkish name based on IBAN hash

  const turkishFirstNames = [
    "Ahmet", "Mehmet", "Ali", "Mustafa", "Hasan", "Hüseyin", "İbrahim", "Osman",
    "Ayşe", "Fatma", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Esra",
    "Murat", "Emre", "Burak", "Can", "Deniz", "Ege", "Selin", "Ceren"
  ];

  const turkishLastNames = [
    "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Arslan", "Doğan",
    "Koç", "Aydın", "Yıldız", "Özdemir", "Erdoğan", "Aksoy", "Polat", "Kılıç"
  ];

  // Generate deterministic but random-looking name from IBAN
  const ibanHash = normalizedIBAN.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const firstName = turkishFirstNames[ibanHash % turkishFirstNames.length];
  const lastName = turkishLastNames[(ibanHash * 7) % turkishLastNames.length];
  const simulatedName = `${firstName} ${lastName}`;

  return res.status(200).json({
    success: true,
    data: {
      found: true,
      isAtomBank: false,
      fullName: simulatedName,
      currency: "TRY", // Default for external
    },
  });
});

// Get all transactions for user (from all accounts)
const getTransactions = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { accountId, type, status, limit } = req.query;

  const user = await User.findById(userId).select("accounts");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Collect all transactions from all accounts
  let allTransactions = [];

  user.accounts.forEach((account) => {
    if (accountId && account._id.toString() !== accountId) {
      return; // Skip if filtering by accountId
    }

    if (account.transactions && account.transactions.length > 0) {
      account.transactions.forEach((tx) => {
        // Apply filters
        if (type && tx.type !== type) return;
        if (status && tx.status !== status) return;

        allTransactions.push({
          ...tx.toObject(),
          accountId: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
        });
      });
    }
  });

  // Sort by date (newest first)
  allTransactions.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Apply limit if specified
  if (limit && parseInt(limit) > 0) {
    allTransactions = allTransactions.slice(0, parseInt(limit));
  }

  return res.status(200).json({
    success: true,
    data: allTransactions,
    count: allTransactions.length,
  });
});

module.exports = {
  deposit,
  withdraw,
  transferInternal,
  transferExternal,
  getTransactions,
  verifyIban,
};
