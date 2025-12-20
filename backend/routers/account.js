const express = require("express");
const router = express.Router();
const {
  createAccount,
  getAccounts,
  getAccountHistory,
} = require("../controllers/account");
const { getAccessToRoute } = require("../middlewares/authorization/auth");

router.post("/", getAccessToRoute, createAccount);
router.get("/", getAccessToRoute, getAccounts);
router.get("/:accountId/history", getAccessToRoute, getAccountHistory);

module.exports = router;
