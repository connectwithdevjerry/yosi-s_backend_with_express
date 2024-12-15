const userModel = require("../models/user.model");
const {
  signAccessToken,
  signRefreshToken,
  signForgotToken,
  verifyForgotToken,
  verifyRefreshToken,
} = require("../jwt_helpers");
const transporter = require("../nodemailerObject");
const {
  authSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  grantPermSchema,
} = require("../validation_schema");
const {
  REFRESH_TOKEN,
  ADMIN_PERM,
  USER_PERM,
  INSTRUCTOR_PERM,
} = require("../constants");
const client = require("../jwt_db_access");

const myPayload = (user) => {
  const payload = {
    firstName: user.firstName,
    lastName: user.lastName,
    permissionLev: user.permissionLev,
    isActive: user.isActive,
    email: user.email,
    dateCreated: user.dateCreated,
  };

  return payload;
};

const signup = async (req, res, next) => {
  // also signup, register
  try {
    const result = await signUpSchema.validateAsync(req.body);

    const isUser = await userModel.findOne({ email: result.email });

    if (isUser)
      return res.send({ status: false, message: "Email already exist" });

    const user = new userModel(result);
    const createdUser = await user.save();

    const token = await signForgotToken(result.email); // used to confirm user email address
    const reset_link = `${process.env.FRONTEND_URL}/confirm_email_address/${token}`;
    console.log({ token, reset_link });

    let mailOptions = {
      from: process.env.MY_EMAIL_USER,
      to: result.email,
      subject: "Password Reset Link",
      text: `Your reset link: ${reset_link}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log({ error });
        return res.send({
          status: false,
          message: "Failed to send confirmation email!",
        });
      }

      console.log("Email sent: " + info.response);

      return res.send({
        status: true,
        message: "Confirmation Link sent successfully",
      });
    });

    return;
  } catch (error) {
    if (error.isJoi === true) {
      error.status = 422;
      console.log(error.message);
      return res.send({ status: false, message: error.message });
    }
    next(error);
  }
};

const signin = async (req, res, next) => {
  // also login, signin
  try {
    const result = await authSchema.validateAsync(req.body);
    const user = await userModel.findOne({ email: result.email });
    if (!user)
      return res.send({ status: false, message: "Email not registered!" });
    if (!user.isActive)
      return res.send({
        status: false,
        message:
          "Account not activated!, Click on the link sent to your mail on registration!",
      });

    const isMatch = await user.isValidPassword(result.password);
    if (!isMatch)
      return res.send({
        status: false,
        message: "Password not valid",
      });

    const payload = myPayload(user);

    const accessToken = await signAccessToken(user.id, payload);
    const refreshToken = await signRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.send({ status: true, accessToken, refreshToken });
  } catch (error) {
    if (error.isJoi === true)
      return res.send({ status: false, message: "Invalid Username/Password" });
    next(error);
  }
};

const activateUser = async (req, res) => {
  const { token } = req.params;

  if (!token)
    return res.send({ Status: false, message: "You must suppy a token!" });

  try {
    const decoded = await verifyForgotToken(token);
    const user = await userModel.findOne({ email: decoded });

    if (!user)
      return res.send({ status: false, message: "Link does not exist!" });

    // user.isActive = true;
    const updateUser = await userModel.findOneAndUpdate(
      { email: decoded },
      { isActive: true },
      { new: true }
    );

    // console.log({ updateUser });

    res.send({ status: true, message: "You're now an active user!" });
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await forgotPasswordSchema.validateAsync(req.body);
    const email = result.email;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.send({ status: false, message: "User not found" });
    }
    const token = await signForgotToken(email);
    const reset_link = `${process.env.FRONTEND_URL}/resetpassword/${token}`;
    console.log({ token, reset_link });

    let mailOptions = {
      from: process.env.MY_EMAIL_USER,
      to: email,
      subject: "Password Reset Link",
      text: `Your reset link: ${reset_link}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log({ error });
        return res.send({ status: false, message: "Failed to send email" });
      }
      console.log("Email sent: " + info.response);
      res.send({ status: true, message: "Email sent successfully" });
    });

    return res.send({
      status: true,
      message: "Reset Link successfully sent to your mail!",
    });
  } catch (error) {
    if (error.isJoi === true)
      return res.send({
        status: false,
        message: "Kindly provide a valid email/password",
      });

    console.log(error);
  }
};

const handleResetPassword = async (req, res) => {
  const { newPassword, cnewPassword, token } =
    await resetPasswordSchema.validateAsync(req.body);

  if (newPassword !== cnewPassword)
    return res.send({ status: false, message: "Passwords do not match!" });

  try {
    const decoded = await verifyForgotToken(token);
    const user = await userModel.findOne({ email: decoded });

    // const password = await user.passwordResetHash(newPassword);

    if (!user)
      return res.send({ status: false, message: "Link does not exist!" });

    user.password = newPassword;
    user.isActive = true;

    await user.save();

    res.send({ status: true, message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: error.message });
  }
};

const logout = async (req, res, next) => {
  try {
    // const { refreshToken } = req.body;
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    console.log({ userId });

    const isDeleted = client.deleteJWT(userId);

    if (!isDeleted) {
      console.log("Failed to delete refresh token");
      throw createError.InternalServerError();
    }

    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    return res.send({ status: true, message: "logout successful!" });

    // client.DEL(userId, (err, val) => {
    //   if (err) {
    //     console.log(err.message);
    //     throw createError.InternalServerError();
    //   }
    //   console.log(val);
    //   res.clearCookie("refreshToken", {
    //     httpOnly: true,
    //     sameSite: "None",
    //     secure: true,
    //   });
    //   res.sendStatus(204);
    // });
  } catch (error) {
    next(error);
  }
};

const grant_permission = async (req, res) => {
  const permitted_user = [ADMIN_PERM];
  const possible_perm = [ADMIN_PERM, INSTRUCTOR_PERM, USER_PERM];

  if (!permitted_user.includes(req.role))
    return res.send({
      status: false,
      message: "You are don't have permission to grant permission!",
    });

  try {
    const { email, permission_type } = req.body;

    const result = await grantPermSchema.validateAsync({
      email,
      permission_type,
    });

    if (!possible_perm.includes(result.permission_type))
      return res.send({
        status: false,
        message: "Invalid permission type!",
      });

    const user_to_permit = await userModel.findOne({ email: result.email });

    if (!user_to_permit) {
      return res.send({ status: false, message: "User not found!" });
    }

    if (user_to_permit.permissionLev === result.permission_type) {
      return res.send({
        status: false,
        message: `${result.email} already has ${result.permission_type} permission!`,
      });
    }

    const updateUser = await userModel.findOneAndUpdate(
      { email: result.email },
      { permissionLev: result.permission_type },
      { new: true }
    );

    console.log({ updateUser });

    return res.send({
      status: true,
      message: "Permission granted successfully!",
    });
  } catch (err) {
    return res.send({ status: false, message: err.message });
  }
};

const getUsers = async (req, res) => {
  const permitted_users = [ADMIN_PERM, INSTRUCTOR_PERM];

  if (!permitted_users.includes(req.role)) {
    return res.send({
      status: false,
      message: "You are not authorized to view this!",
    });
  }
  try {
    const users = await userModel.find({}, { password: 0 });
    return res.send({ status: true, data: users });
  } catch (err) {
    return res.send({ status: false, message: err.message });
  }
};

const getRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // console.log({ refreshToken });

    if (!refreshToken)
      return res.send({
        status: false,
        message: "Refresh token not provided!",
      });
    const userId = await verifyRefreshToken(refreshToken);

    const user = await userModel.findById(userId);

    if (!user)
      return res.send({
        status: false,
        message: "User not found!",
      });

    const payload = myPayload(user);

    const accessToken = await signAccessToken(userId, payload);
    const refToken = await signRefreshToken(userId);

    res.cookie("refreshToken", refToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.send({ accessToken: accessToken, refreshToken: refToken });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  signin,
  forgotPassword,
  handleResetPassword,
  logout,
  activateUser,
  grant_permission,
  getRefreshToken,
  getUsers,
};
