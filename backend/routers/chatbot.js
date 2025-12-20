const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getHelp,
  getQuickActions,
  clearSession,
} = require("../controllers/chatbot");
const { getAccessToRoute } = require("../middlewares/authorization/auth");

// Main chat endpoint
router.post("/chat", getAccessToRoute, sendMessage);

// Legacy endpoint (for backwards compatibility)
router.post("/", getAccessToRoute, sendMessage);

// Help endpoint
router.get("/help", getAccessToRoute, getHelp);

// Quick actions endpoint
router.get("/quick-actions", getAccessToRoute, getQuickActions);

// Clear session endpoint
router.delete("/session", getAccessToRoute, clearSession);

module.exports = router;
