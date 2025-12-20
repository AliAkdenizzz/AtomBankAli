const express = require("express");
const router = express.Router();
const {
  addBill,
  getBills,
  payBill,
  setAutoPay,
  deleteBill,
} = require("../controllers/bill");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const { checkUserStatus } = require("../middlewares/security/checkUserStatus");
const { billLimiter } = require("../middlewares/security/rateLimiter");
const transactionTimeout = require("../middlewares/security/transactionTimeout");

// All bill routes require authentication and user status check
router.post("/", getAccessToRoute, checkUserStatus, billLimiter, addBill);

router.get("/", getAccessToRoute, checkUserStatus, getBills);

router.post(
  "/:billId/pay",
  getAccessToRoute,
  checkUserStatus,
  billLimiter,
  transactionTimeout(),
  payBill
);

router.put("/:billId/autopay", getAccessToRoute, checkUserStatus, setAutoPay);

router.delete("/:billId", getAccessToRoute, checkUserStatus, deleteBill);

module.exports = router;
