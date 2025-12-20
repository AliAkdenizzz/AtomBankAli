const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError");
const errorWrapper = require("../helpers/error/errorWrapper");

// Get user profile
const getProfile = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select(
    "-password -resetPasswordToken -resetPasswordExpire"
  );

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

// Update user profile
const updateProfile = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const { name, fullName, phone, address, preferences } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  if (name) user.name = name;
  if (fullName) user.fullName = fullName;
  if (name && !fullName) user.fullName = name;
  if (fullName && !name) user.name = fullName;

  if (phone) user.phone = phone;

  if (address) {
    if (address.street !== undefined) user.address.street = address.street;
    if (address.city !== undefined) user.address.city = address.city;
    if (address.state !== undefined) user.address.state = address.state;
    if (address.postalCode !== undefined)
      user.address.postalCode = address.postalCode;
    if (address.country !== undefined) user.address.country = address.country;
    // Mark address as modified to ensure save
    user.markModified("address");
  }

  if (preferences) {
    if (preferences.language) user.preferences.language = preferences.language;
    if (preferences.currency) user.preferences.currency = preferences.currency;
    if (preferences.darkMode !== undefined) {
      // Store darkMode preference (even if not in schema, we can store it)
      if (!user.preferences.darkMode) {
        user.preferences.darkMode = {};
      }
      user.preferences.darkMode = preferences.darkMode;
      user.markModified("preferences");
    }
    if (preferences.notifications) {
      if (preferences.notifications.email !== undefined)
        user.preferences.notifications.email = preferences.notifications.email;
      if (preferences.notifications.push !== undefined)
        user.preferences.notifications.push = preferences.notifications.push;
      if (preferences.notifications.sms !== undefined)
        user.preferences.notifications.sms = preferences.notifications.sms;
    }
    if (preferences.twoFactorAuth) {
      if (preferences.twoFactorAuth.enabled !== undefined)
        user.preferences.twoFactorAuth.enabled =
          preferences.twoFactorAuth.enabled;
      if (preferences.twoFactorAuth.method)
        user.preferences.twoFactorAuth.method =
          preferences.twoFactorAuth.method;
    }
    // Mark preferences as modified to ensure save
    user.markModified("preferences");
  }

  // Fix invalid transaction categories before saving
  // Map old bill category values to valid transaction categories
  const validTransactionCategories = [
    "income",
    "utilities",
    "shopping",
    "food",
    "transport",
    "entertainment",
    "health",
    "education",
    "transfer",
    "other",
  ];

  const categoryMapping = {
    water: "utilities",
    "credit-card": "other",
    electricity: "utilities",
    gas: "utilities",
    internet: "utilities",
    phone: "utilities",
    tv: "entertainment",
    insurance: "other",
    rent: "other",
    mobile: "utilities",
    streaming: "entertainment",
    tuition: "education",
    gym: "health",
  };

  // Fix all transactions in all accounts
  if (user.accounts && user.accounts.length > 0) {
    let hasChanges = false;
    user.accounts.forEach((account) => {
      if (account.transactions && account.transactions.length > 0) {
        let accountHasChanges = false;
        account.transactions.forEach((transaction) => {
          if (transaction.category) {
            // If category is not in valid list, map it
            if (!validTransactionCategories.includes(transaction.category)) {
              const newCategory =
                categoryMapping[transaction.category] || "other";
              if (transaction.category !== newCategory) {
                transaction.category = newCategory;
                accountHasChanges = true;
                hasChanges = true;
              }
            }
          } else {
            // If no category, set default
            transaction.category = "other";
            accountHasChanges = true;
            hasChanges = true;
          }
        });
        if (accountHasChanges) {
          account.markModified("transactions");
        }
      }
    });
    if (hasChanges) {
      user.markModified("accounts");
    }
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Get all savings goals
const getSavingsGoals = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("savingsGoals");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const goals = user.savingsGoals || [];

  // Calculate progress for each goal
  const goalsWithProgress = goals.map((goal) => {
    const goalObj = goal.toObject();
    goalObj.progressPercent = goal.getProgressPercent();
    return goalObj;
  });

  return res.status(200).json({
    success: true,
    data: goalsWithProgress,
    count: goalsWithProgress.length,
  });
});

// Create new savings goal
const createSavingsGoal = errorWrapper(async (req, res, next) => {
  const { name, targetAmount, targetDate, linkedAccountId } = req.body;
  const userId = req.user.id;

  if (!name || !targetAmount || !targetDate) {
    return next(
      new CustomError("Name, target amount, and target date are required", 400)
    );
  }

  if (targetAmount <= 0) {
    return next(new CustomError("Target amount must be positive", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Verify linked account if provided
  if (linkedAccountId) {
    const account = user.accounts.id(linkedAccountId);
    if (!account) {
      return next(new CustomError("Linked account not found", 404));
    }
  }

  // Create savings goal
  const goal = {
    name: name,
    targetAmount: targetAmount,
    currentAmount: 0,
    startDate: new Date(),
    targetDate: new Date(targetDate),
    status: "onTrack",
    linkedAccountId: linkedAccountId || null,
    contributions: [],
  };

  user.savingsGoals.push(goal);
  await user.save();

  const savedGoal = user.savingsGoals[user.savingsGoals.length - 1];
  const goalObj = savedGoal.toObject();
  goalObj.progressPercent = savedGoal.getProgressPercent();

  return res.status(201).json({
    success: true,
    message: "Savings goal created successfully",
    data: goalObj,
  });
});

// Contribute to savings goal
const contributeToGoal = errorWrapper(async (req, res, next) => {
  const { goalId, accountId, amount } = req.body;
  const userId = req.user.id;

  if (!goalId || !accountId || !amount || amount <= 0) {
    return next(
      new CustomError(
        "Goal ID, account ID, and positive amount are required",
        400
      )
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  const goal = user.savingsGoals.id(goalId);
  if (!goal) {
    return next(new CustomError("Savings goal not found", 404));
  }

  if (goal.status === "completed") {
    return next(new CustomError("Goal is already completed", 400));
  }

  if (goal.status === "abandoned") {
    return next(new CustomError("Cannot contribute to abandoned goal", 400));
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

  // Create transaction
  const transaction = {
    type: "goal-contrib",
    amount: amount,
    currency: account.currency,
    description: `Contribution to goal: ${goal.name}`,
    status: "completed",
    category: "other",
    createdAt: new Date(),
  };

  // Update account balance
  account.balance -= amount;
  account.transactions.push(transaction);

  // Update goal
  goal.currentAmount += amount;
  goal.updateProgress(amount);

  // Add contribution record
  goal.contributions.push({
    amount: amount,
    date: new Date(),
    fromAccountId: accountId,
  });

  await user.save();

  const goalObj = goal.toObject();
  goalObj.progressPercent = goal.getProgressPercent();

  return res.status(200).json({
    success: true,
    message: "Contribution successful",
    data: {
      goal: goalObj,
      newBalance: account.balance,
      transaction: account.transactions[account.transactions.length - 1],
    },
  });
});

// Search user by phone number (for quick transfer)
const searchByPhone = errorWrapper(async (req, res, next) => {
  const { phone } = req.query;
  const userId = req.user.id;

  if (!phone) {
    return next(new CustomError("Phone number is required", 400));
  }

  // Normalize phone number (remove +90, 0, spaces, dashes)
  let normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
  if (normalizedPhone.startsWith("+90")) {
    normalizedPhone = normalizedPhone.slice(3);
  }
  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = normalizedPhone.slice(1);
  }

  // Search for user with this phone (not the current user)
  const user = await User.findOne({
    _id: { $ne: userId },
    $or: [
      { phone: normalizedPhone },
      { phone: "0" + normalizedPhone },
      { phone: "+90" + normalizedPhone },
    ],
  }).select("fullName name accounts phone");

  if (!user) {
    return next(new CustomError("No user found with this phone number", 404));
  }

  // Get user's primary TRY account IBAN
  const tryAccount = user.accounts.find(
    (acc) => acc.currency === "TRY" && acc.status === "active"
  );
  const primaryAccount =
    tryAccount || user.accounts.find((acc) => acc.status === "active");

  if (!primaryAccount || !primaryAccount.iban) {
    return next(new CustomError("Recipient has no active account", 400));
  }

  // Mask the name for verification (e.g., "Ayşe Yılmaz" -> "A*** Y*****")
  const fullName = user.fullName || user.name || "Unknown";
  const maskedName = fullName
    .split(" ")
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0].toUpperCase() + "*".repeat(word.length - 1);
    })
    .join(" ");

  return res.status(200).json({
    success: true,
    data: {
      maskedName: maskedName,
      fullName: fullName,
      iban: primaryAccount.iban,
      currency: primaryAccount.currency,
    },
  });
});

// Get saved recipients
const getSavedRecipients = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("savedRecipients");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: user.savedRecipients || [],
    count: user.savedRecipients ? user.savedRecipients.length : 0,
  });
});

// Upload profile image
const uploadProfileImage = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  if (!req.savedProfileImage) {
    return next(new CustomError("No image file provided", 400));
  }

  user.profile_image = req.savedProfileImage;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile image updated successfully",
    data: {
      profile_image: user.profile_image,
    },
  });
});

// Add saved recipient
const addSavedRecipient = errorWrapper(async (req, res, next) => {
  const { name, iban, accountNumber, bankName, currency } = req.body;
  const userId = req.user.id;

  if (!name || !iban) {
    return next(new CustomError("Name and IBAN are required", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  // Check if recipient already exists
  const existing = user.savedRecipients.find((r) => r.iban === iban);
  if (existing) {
    return next(
      new CustomError("Recipient with this IBAN already exists", 400)
    );
  }

  // Validate currency if provided
  const validCurrencies = ["TRY", "USD", "EUR", "GBP"];
  const recipientCurrency = currency && validCurrencies.includes(currency) ? currency : "TRY";

  // Add recipient
  const recipient = {
    name: name,
    iban: iban,
    accountNumber: accountNumber || "",
    bankName: bankName || "",
    currency: recipientCurrency,
    createdAt: new Date(),
  };

  user.savedRecipients.push(recipient);
  await user.save();

  return res.status(201).json({
    success: true,
    message: "Recipient saved successfully",
    data: user.savedRecipients[user.savedRecipients.length - 1],
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getSavingsGoals,
  createSavingsGoal,
  contributeToGoal,
  searchByPhone,
  getSavedRecipients,
  addSavedRecipient,
};
