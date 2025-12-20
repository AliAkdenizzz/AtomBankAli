const User = require("../models/user");
const CustomError = require("../helpers/error/CustomError.js");
const sendMail = require("../helpers/libraries/sendEmail.js");
const asyncErrorWrapper = require("express-async-handler");
const { sendJwtToClient } = require("../helpers/authorization/tokenHelpers.js");
const {
  validateUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers.js");
const register = asyncErrorWrapper(async (req, res, next) => {
  const {
    tc,
    name,
    fullName,
    email,
    password,
    phone,
    dateOfBirth,
    address,
    role,
  } = req.body;

  // Validation - All fields required
  if (!tc || !name || !email || !password || !phone || !dateOfBirth) {
    return next(
      new CustomError(
        "TC, name, email, password, phone and date of birth are required",
        400
      )
    );
  }

  if (
    !address ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.postalCode
  ) {
    return next(new CustomError("All address fields are required", 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { tc }],
  });

  if (existingUser) {
    return next(
      new CustomError("User with this email or TC already exists", 400)
    );
  }

  // Create user with all required fields
  const user = await User.create({
    tc,
    name,
    fullName: fullName || name,
    email,
    password,
    phone,
    dateOfBirth: new Date(dateOfBirth),
    address: {
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "Turkey",
    },
    role: role || "user",
  });

  // Create default account for new user
  const {
    generateAccountNumber,
  } = require("../helpers/account/generateAccountNumber");
  const { generateIBAN } = require("../helpers/account/generateIBAN");

  const defaultAccountNumber = generateAccountNumber();
  const defaultIBAN = generateIBAN(defaultAccountNumber);

  user.accounts.push({
    accountName: "Ana Hesap",
    type: "checking",
    currency: "TRY",
    balance: 0,
    accountNumber: defaultAccountNumber,
    iban: defaultIBAN,
    status: "active",
    transactions: [],
  });

  await user.save();

  sendJwtToClient(user, res);
});

// ============================
//   QUICK REGISTER (For Postman/Dev)
//   POST /api/auth/register-quick
//   Creates user with accounts, bills, and savingsGoals
// ============================
const registerQuick = asyncErrorWrapper(async (req, res, next) => {
  const {
    tc,
    name,
    fullName,
    email,
    password,
    phone,
    dateOfBirth,
    address,
    role,
    accounts = [],
    bills = [],
    savingsGoals = [],
  } = req.body;

  // Basic validation - only check required fields
  if (!tc || !name || !email || !password || !phone || !dateOfBirth) {
    return next(
      new CustomError(
        "TC, name, email, password, phone and date of birth are required",
        400
      )
    );
  }

  if (
    !address ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.postalCode
  ) {
    return next(new CustomError("All address fields are required", 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { tc }],
  });

  if (existingUser) {
    return next(
      new CustomError("User with this email or TC already exists", 400)
    );
  }

  // Create user with all required fields
  const user = await User.create({
    tc,
    name,
    fullName: fullName || name,
    email,
    password,
    phone,
    dateOfBirth: new Date(dateOfBirth),
    address: {
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "Turkey",
    },
    role: role || "user",
  });

  // Helper to fix transaction category
  const fixTransactionCategory = (category) => {
    const validCategories = [
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
    const mapping = {
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
    if (!category) return "other";
    if (validCategories.includes(category)) return category;
    return mapping[category] || "other";
  };

  // Add accounts if provided
  if (accounts && Array.isArray(accounts) && accounts.length > 0) {
    accounts.forEach((accountData) => {
      // Fix transaction categories before adding
      const transactions = (accountData.transactions || []).map((tx) => ({
        ...tx,
        category: fixTransactionCategory(tx.category),
      }));

      user.accounts.push({
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName || "My Account",
        type: accountData.type || "checking",
        currency: accountData.currency || "TRY",
        balance: accountData.balance || 0,
        iban: accountData.iban,
        status: accountData.status || "active",
        transactions: transactions,
        createdAt: accountData.createdAt
          ? new Date(accountData.createdAt)
          : new Date(),
      });
    });
  } else {
    // If no accounts provided, create default account
    const {
      generateAccountNumber,
    } = require("../helpers/account/generateAccountNumber");
    const { generateIBAN } = require("../helpers/account/generateIBAN");

    const defaultAccountNumber = generateAccountNumber();
    const defaultIBAN = generateIBAN(defaultAccountNumber);

    user.accounts.push({
      accountName: "Ana Hesap",
      type: "checking",
      currency: "TRY",
      balance: 0,
      accountNumber: defaultAccountNumber,
      iban: defaultIBAN,
      status: "active",
      transactions: [],
    });
  }

  // Add bills if provided
  if (bills && Array.isArray(bills) && bills.length > 0) {
    bills.forEach((billData) => {
      user.bills.push({
        title: billData.title,
        companyName: billData.companyName,
        subscriberNo: billData.subscriberNo,
        category: billData.category || "other",
        amount: billData.amount,
        dueDate: billData.dueDate ? new Date(billData.dueDate) : new Date(),
        status: billData.status || (billData.isPaid ? "paid" : "pending"),
        isPaid: billData.isPaid || false,
        paidAt: billData.paidAt ? new Date(billData.paidAt) : undefined,
        paidFromAccountId: billData.paidFromAccountId,
        autoPay: billData.autoPay || { enabled: false, accountId: null },
        isRecurring: billData.isRecurring || false,
        recurringDay: billData.recurringDay,
      });
    });
  }

  // Add savings goals if provided
  if (savingsGoals && Array.isArray(savingsGoals) && savingsGoals.length > 0) {
    savingsGoals.forEach((goalData) => {
      user.savingsGoals.push({
        name: goalData.name,
        targetAmount: goalData.targetAmount,
        currentAmount: goalData.currentAmount || 0,
        targetDate: goalData.targetDate
          ? new Date(goalData.targetDate)
          : new Date(),
        status: goalData.status || "onTrack",
        startDate: goalData.startDate
          ? new Date(goalData.startDate)
          : new Date(),
      });
    });
  }

  await user.save();

  return res.status(201).json({
    success: true,
    message:
      "User created successfully with accounts, bills, and savings goals",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        tc: user.tc,
      },
      accountsCount: user.accounts.length,
      billsCount: user.bills.length,
      savingsGoalsCount: user.savingsGoals.length,
    },
  });
});

const login = asyncErrorWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!validateUserInput(email, password)) {
    return next(new CustomError("Please check your inputs", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new CustomError("User not found", 400));
  }

  // Check if user is blocked or inactive
  if (user.blocked || !user.isActive) {
    return next(
      new CustomError("Your account has been blocked or deactivated", 403)
    );
  }

  if (!comparePassword(password, user.password)) {
    return next(new CustomError("Password is wrong", 400));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
  const { NODE_ENV } = process.env;

  return res
    .status(200)
    .cookie("access_token", {
      // 1: name, 2: value, 3: options
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: NODE_ENV === "development" ? false : true,
    })
    .json({
      success: true,
      message: "logout successfull",
    });
});
const changePassword = asyncErrorWrapper(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new CustomError("Old password and new password are required", 400)
    );
  }

  if (newPassword.length < 6) {
    return next(
      new CustomError("New password must be at least 6 characters", 400)
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  if (!comparePassword(oldPassword, user.password)) {
    return next(new CustomError("Current password is incorrect", 400));
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
const forgotPassword = asyncErrorWrapper(async (req, res, next) => {
  const resetEmail = req.body.email;

  // 1) Kullanıcıyı bul
  const user = await User.findOne({ email: resetEmail });

  if (!user) {
    return next(new CustomError("There is no user with that email", 400));
  }

  // 2) Kullanıcıdan reset token üret
  const resetPasswordToken = user.getResetPasswordTokenFromUser();

  // 3) DB'ye kaydet (validate'lerle uğraşmamak için)
  await user.save({ validateBeforeSave: false }); //direkt bakıyor

  // 4) Frontend'in açacağı reset link
  const resetPasswordUrl = `http://localhost:5000/api/auth/resetpassword?token=${resetPasswordToken}`;
  // prod'da bunu .env'den kurarsın

  const emailTemplate = `
    <h3>Şifre Sıfırlama İsteği</h3>
    <p>Şifreni sıfırlamak için aşağıdaki linke tıkla:</p>
    <p><a href="${resetPasswordUrl}" target="_blank">${resetPasswordUrl}</a></p>
    <p>Eğer bu isteği sen yapmadıysan, bu maili görmezden gelebilirsin.</p>
  `;

  try {
    // 5) Mail gönder
    await sendMail({
      to: resetEmail,
      subject: "Atom Bank - Şifre Sıfırlama",
      text: `Şifreni sıfırlamak için bu linke tıkla: ${resetPasswordUrl}`,
      html: emailTemplate,
    });

    return res.status(200).json({
      success: true,
      message: "Reset password link has been sent to your email",
    });
  } catch (err) {
    console.log("Mail send error:", err.message);

    // Mail gitmediyse token'ı sıfırla
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new CustomError("Email could not be sent", 500));
  }
});
const resetPassword = asyncErrorWrapper(async (req, res, next) => {
  const { resetPasswordToken } = req.query;
  const { password } = req.body;
  if (!resetPasswordToken) {
    return next(new CustomError("Please provide a valid token", 400));
  }
  let user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new CustomError("invalid token or session expired", 404));
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  return res.status(200).json({
    success: true,
    message: "Reset Password Process Successfull",
  });
});

module.exports = {
  register,
  registerQuick,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
