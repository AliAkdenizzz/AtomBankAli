const User = require("../../models/user");
const CustomError = require("../../helpers/error/CustomError");
const errorWrapper = require("../../helpers/error/errorWrapper");

// Check if user is blocked or inactive
const checkUserStatus = errorWrapper(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("blocked isActive");
  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  if (user.blocked) {
    return next(
      new CustomError(
        "Your account has been blocked. Please contact support.",
        403
      )
    );
  }

  if (!user.isActive) {
    return next(
      new CustomError("Your account is inactive. Please contact support.", 403)
    );
  }

  next();
});

module.exports = {
  checkUserStatus,
};
