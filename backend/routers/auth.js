const express = require("express");
const {
  register,
  registerQuick,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/auth");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const router = express.Router();
router.post("/register-quick", registerQuick); // Quick register for Postman/dev
router.post("/register", register);
router.post("/login", login);
router.put("/change-password", getAccessToRoute, changePassword);
router.get("/logout", getAccessToRoute, logout);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

module.exports = router;
