const express = require("express");
const router = express.Router();
const {
  deposit,
  withdraw,
  transferInternal,
  transferExternal,
  getTransactions,
  verifyIban,
} = require("../controllers/transaction");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const { checkUserStatus } = require("../middlewares/security/checkUserStatus");
const { transferLimiter } = require("../middlewares/security/rateLimiter");
const transactionTimeout = require("../middlewares/security/transactionTimeout");

// Deposit
router.post(
  "/deposit",
  getAccessToRoute,
  checkUserStatus,
  transferLimiter,
  transactionTimeout(),
  deposit
);

// Withdraw
router.post(
  "/withdraw",
  getAccessToRoute,
  checkUserStatus,
  transferLimiter,
  transactionTimeout(),
  withdraw
);

// Internal transfer
router.post(
  "/transfer-internal",
  getAccessToRoute,
  checkUserStatus,
  transferLimiter,
  transactionTimeout(),
  transferInternal
);

// External transfer
router.post(
  "/transfer-external",
  getAccessToRoute,
  checkUserStatus,
  transferLimiter,
  transactionTimeout(),
  transferExternal
);

// Get transactions
router.get("/", getAccessToRoute, checkUserStatus, getTransactions);

// Verify IBAN and get recipient info
router.post("/verify-iban", getAccessToRoute, checkUserStatus, verifyIban);

module.exports = router;
