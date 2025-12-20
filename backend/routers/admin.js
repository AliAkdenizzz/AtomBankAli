const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  blockUser,
  getAllTransactions,
} = require("../controllers/admin");
const {
  getAccessToRoute,
  getAdminAccess,
} = require("../middlewares/authorization/auth");

router.get("/users", getAccessToRoute, getAdminAccess, getAllUsers);
router.put("/users/:id/block", getAccessToRoute, getAdminAccess, blockUser);
router.get(
  "/transactions",
  getAccessToRoute,
  getAdminAccess,
  getAllTransactions
);

module.exports = router;
