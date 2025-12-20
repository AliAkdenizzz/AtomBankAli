const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Schema = mongoose.Schema;

/* ============================
   Transaction Subdocument
   ============================ */
const TransactionSchema = new Schema({
  type: {
    type: String,
    enum: [
      "deposit",
      "withdraw",
      "transfer-in",
      "transfer-out",
      "transfer-ext",
      "bill-payment",
      "exchange-in",
      "exchange-out",
      "goal-contrib",
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, "Amount must be positive"],
  },
  currency: {
    type: String,
    default: "TRY",
    enum: ["TRY", "USD", "EUR", "GBP"],
  },
  fromAccountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
  },
  toAccountId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
  },
  toIBAN: String,
  recipientName: String,
  exchangeRate: Number,
  convertedAmount: Number,
  billId: {
    type: Schema.Types.ObjectId,
    ref: "Bill",
  },
  description: {
    type: String,
    maxlength: 200,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "completed",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: {
    type: String,
    enum: [
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
    ],
    default: "other",
  },
});

/* ============================
   Account Subdocument
   ============================ */
const AccountSchema = new Schema({
  accountNumber: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    default: "My Account",
    maxlength: 50,
  },
  type: {
    type: String,
    enum: ["checking", "savings", "deposit", "investment"],
    default: "checking",
  },
  currency: {
    type: String,
    default: "TRY",
    enum: ["TRY", "USD", "EUR", "GBP"],
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "blocked", "closed"],
    default: "active",
  },
  iban: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: Date,
  transactions: [TransactionSchema],
});

/* ============================
   Savings Goal Subdocument
   ============================ */
const SavingsGoalSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: [1, "Target amount must be positive"],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  targetDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["onTrack", "behind", "completed", "abandoned"],
    default: "onTrack",
  },
  linkedAccountId: {
    type: Schema.Types.ObjectId,
  },
  contributions: [
    {
      amount: Number,
      date: { type: Date, default: Date.now },
      fromAccountId: Schema.Types.ObjectId,
    },
  ],
});

SavingsGoalSchema.methods.getProgressPercent = function () {
  return this.targetAmount > 0
    ? Math.min((this.currentAmount / this.targetAmount) * 100, 100)
    : 0;
};

SavingsGoalSchema.methods.updateProgress = function (amount) {
  this.currentAmount += amount;
  if (this.currentAmount >= this.targetAmount) {
    this.status = "completed";
  } else {
    const now = new Date();
    const totalDays =
      (this.targetDate - this.startDate) / (1000 * 60 * 60 * 24);
    const daysPassed = (now - this.startDate) / (1000 * 60 * 60 * 24);
    const expectedProgress = (daysPassed / totalDays) * this.targetAmount;
    this.status = this.currentAmount >= expectedProgress ? "onTrack" : "behind";
  }
};

/* ============================
   Bill Subdocument
   ============================ */
const BillSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  companyName: {
    type: String,
    required: true,
  },
  subscriberNo: String,
  category: {
    type: String,
    enum: [
      "electricity",
      "water",
      "gas",
      "internet",
      "phone",
      "tv",
      "insurance",
      "rent",
      "mobile",
      "credit-card",
      "streaming",
      "tuition",
      "gym",
      "other",
    ],
    default: "other",
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: Date,
  paidFromAccountId: Schema.Types.ObjectId,
  autoPay: {
    enabled: { type: Boolean, default: false },
    accountId: Schema.Types.ObjectId,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringDay: Number,
});

/* ============================
   Insight Subdocument
   ============================ */
const InsightSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["info", "warning", "success"],
    default: "info",
  },
  category: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

/* ============================
   Spending Aggregate Subdocument
   ============================ */
const SpendingAggregateSchema = new Schema({
  period: {
    type: String,
    enum: ["daily", "weekly", "monthly", "yearly"],
  },
  periodStart: Date,
  periodEnd: Date,
  totalIncome: {
    type: Number,
    default: 0,
  },
  totalSpending: {
    type: Number,
    default: 0,
  },
  byCategory: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
  },
});

/* ============================
   Saved Recipient Subdocument
   ============================ */
const SavedRecipientSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  iban: {
    type: String,
    required: true,
  },
  accountNumber: String,
  bankName: String,
  currency: {
    type: String,
    enum: ["TRY", "USD", "EUR", "GBP"],
    default: "TRY",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* ============================
   Address Subdocument
   ============================ */
const AddressSchema = new Schema({
  street: {
    type: String,
    required: [true, "Sokak adresi gerekli"],
  },
  city: {
    type: String,
    required: [true, "Şehir gerekli"],
  },
  state: {
    type: String,
    required: [true, "İlçe/State gerekli"],
  },
  postalCode: {
    type: String,
    required: [true, "Posta kodu gerekli"],
  },
  country: {
    type: String,
    default: "Turkey",
    required: true,
  },
});

/* ============================
   MAIN USER MODEL
   ============================ */
const UserSchema = new Schema({
  tc: {
    type: String,
    required: [true, "TC Kimlik numarası gerekli"],
    match: [/^[0-9]{11}$/, "Geçerli bir TC numarası girin"],
  },
  fullName: {
    type: String,
    required: [true, "İsim soyisim gerekli"],
    maxlength: 100,
  },
  name: {
    type: String,
    required: [true, "İsim gerekli"],
  },
  email: {
    type: String,
    required: [true, "Email adresi gerekli"],
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir email adresi girin"],
  },
  phone: {
    type: String,
    required: [true, "Telefon numarası gerekli"],
    match: [/^(\+90|0)?[0-9]{10}$/, "Geçerli bir telefon numarası girin"],
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  password: {
    type: String,
    minlength: [6, "Şifre en az 6 karakter olmalı"],
    required: [true, "Şifre gerekli"],
    select: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  profile_image: {
    type: String,
    default: "default.jpg",
  },
  address: {
    type: AddressSchema,
    required: [true, "Adres bilgileri gerekli"],
  },
  dateOfBirth: {
    type: Date,
    required: [true, "Doğum tarihi gerekli"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Banking subdocuments
  accounts: [AccountSchema],
  savingsGoals: [SavingsGoalSchema],
  bills: [BillSchema],
  insights: [InsightSchema],
  spendingAggregates: [SpendingAggregateSchema],
  savedRecipients: [SavedRecipientSchema],

  preferences: {
    language: {
      type: String,
      enum: ["tr", "en"],
      default: "tr",
    },
    currency: {
      type: String,
      enum: ["TRY", "USD", "EUR", "GBP"],
      default: "TRY",
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      method: { type: String, enum: ["sms", "email", "app"] },
    },
  },
});

/* ============================
   USER METHODS
   ============================ */
UserSchema.methods.generateJwtFromUser = function () {
  const { JWT_SECRET_KEY, JWT_EXPIRE } = process.env;
  const payload = {
    id: this._id,
    name: this.name,
    role: this.role,
  };
  return jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRE,
  });
};

UserSchema.methods.getResetPasswordTokenFromUser = function () {
  const randomHexString = crypto.randomBytes(15).toString("hex");
  const { RESET_PASSWORD_EXPIRE } = process.env;
  const resetPasswordToken = crypto
    .createHash("SHA256")
    .update(randomHexString)
    .digest("hex");
  this.resetPasswordToken = resetPasswordToken;
  this.resetPasswordExpire = Date.now() + parseInt(RESET_PASSWORD_EXPIRE);
  return resetPasswordToken;
};

UserSchema.methods.verifyPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.checkAccountOwnership = function (accountId) {
  return this.accounts.some(
    (acc) => acc._id.toString() === accountId.toString()
  );
};

UserSchema.methods.getAccountById = function (accountId) {
  return this.accounts.find(
    (acc) => acc._id.toString() === accountId.toString()
  );
};

UserSchema.methods.calculateSpendingAggregate = function (period = "monthly") {
  const now = new Date();
  let startDate;

  switch (period) {
    case "daily":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "weekly":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "monthly":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "yearly":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
  }

  const aggregate = {
    totalIncome: 0,
    totalSpending: 0,
    byCategory: {},
  };

  this.accounts.forEach((account) => {
    account.transactions.forEach((tx) => {
      if (tx.createdAt >= startDate) {
        if (["deposit", "transfer-in", "exchange-in"].includes(tx.type)) {
          aggregate.totalIncome += tx.amount;
        } else if (
          ["withdraw", "transfer-out", "bill-payment", "exchange-out"].includes(
            tx.type
          )
        ) {
          aggregate.totalSpending += tx.amount;
          const cat = tx.category || "other";
          aggregate.byCategory[cat] =
            (aggregate.byCategory[cat] || 0) + tx.amount;
        }
      }
    });
  });

  return aggregate;
};

/* ============================
   MONGOOSE MIDDLEWARE
   ============================ */
UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  });
});

UserSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.isModified("fullName")) {
    this.fullName = this.name;
  }
  if (this.isModified("fullName") && !this.isModified("name")) {
    this.name = this.fullName;
  }
  next();
});

UserSchema.pre("save", function (next) {
  const now = new Date();
  this.bills.forEach((bill) => {
    if (!bill.isPaid && bill.dueDate < now) {
      bill.status = "overdue";
    }
  });
  next();
});

// Fix invalid transaction categories before saving
// Fix transaction categories before validation
UserSchema.pre("validate", function (next) {
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

  if (this.accounts && this.accounts.length > 0) {
    let hasChanges = false;
    this.accounts.forEach((account) => {
      if (account.transactions && account.transactions.length > 0) {
        let accountHasChanges = false;
        account.transactions.forEach((transaction) => {
          if (transaction.category) {
            if (!validTransactionCategories.includes(transaction.category)) {
              const newCategory =
                categoryMapping[transaction.category] || "other";
              if (transaction.category !== newCategory) {
                transaction.set("category", newCategory);
                accountHasChanges = true;
                hasChanges = true;
              }
            }
          } else {
            transaction.set("category", "other");
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
      this.markModified("accounts");
    }
  }
  next();
});

/* ============================
   INDEXES
   ============================ */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ tc: 1 }, { unique: true });
UserSchema.index(
  { "accounts.accountNumber": 1 },
  { unique: true, sparse: true }
);
UserSchema.index({ "accounts.iban": 1 }, { sparse: true });

module.exports = mongoose.model("User", UserSchema);
