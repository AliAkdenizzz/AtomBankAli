const express = require("express");
const router = express.Router();
const {
  getExchangeRates,
  convertCurrency,
} = require("../controllers/exchange");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const { checkUserStatus } = require("../middlewares/security/checkUserStatus");
const { exchangeLimiter } = require("../middlewares/security/rateLimiter");
const transactionTimeout = require("../middlewares/security/transactionTimeout");

// Get exchange rates (public endpoint, but rate limited)
router.get("/rates", exchangeLimiter, getExchangeRates);

// Convert currency (protected, with security middleware)
router.post(
  "/convert",
  getAccessToRoute,
  checkUserStatus,
  exchangeLimiter,
  transactionTimeout(),
  convertCurrency
);

module.exports = router;
