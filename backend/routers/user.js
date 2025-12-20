const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  searchByPhone,
  getSavedRecipients,
  addSavedRecipient,
} = require("../controllers/user");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const profileImageUpload = require("../middlewares/libraries/ProfileImageUpload");

router.get("/me", getAccessToRoute, getProfile);
router.put("/profile", getAccessToRoute, updateProfile);
router.post(
  "/profile-image",
  getAccessToRoute,
  profileImageUpload.single("profile_image"),
  uploadProfileImage
);
router.get("/search-by-phone", getAccessToRoute, searchByPhone);
router.get("/recipients/list", getAccessToRoute, getSavedRecipients);
router.post("/recipients/add", getAccessToRoute, addSavedRecipient);

module.exports = router;
