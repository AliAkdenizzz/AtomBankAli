const express = require("express");
const router = express.Router();
const {
  getInsights,
  getSpendingAnalysis,
} = require("../controllers/smart");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const { checkUserStatus } = require("../middlewares/security/checkUserStatus");

router.get("/insights", getAccessToRoute, checkUserStatus, getInsights);

router.get("/spending", getAccessToRoute, checkUserStatus, getSpendingAnalysis);

module.exports = router;
