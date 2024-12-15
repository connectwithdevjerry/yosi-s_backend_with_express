const express = require("express");
const router = express.Router();
const {
  signup,
  signin,
  logout,
  forgotPassword,
  handleResetPassword,
  activateUser,
  grant_permission,
  getRefreshToken,
} = require("../controllers/user.controller");
const {
  USER_SIGNUP,
  USER_SIGNIN,
  USER_FORGOT_PASS,
  USER_RESET_PASS,
  USER_LOGOUT,
  ACTIVATE,
  GRANT_PERMISSION,
  GET_REFRESH,
} = require("../constants");
const { verifyAccessToken } = require("../jwt_helpers");

router.post(USER_SIGNUP, signup);
router.post(USER_SIGNIN, signin);
router.get(ACTIVATE, activateUser);
router.post(USER_FORGOT_PASS, forgotPassword);
router.post(USER_RESET_PASS, handleResetPassword);
router.delete(USER_LOGOUT, logout);
router.post(GET_REFRESH, getRefreshToken);
router.put(GRANT_PERMISSION, verifyAccessToken, grant_permission);

module.exports = router;
