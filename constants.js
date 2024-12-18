// permissions
const ADMIN_PERM = "admin";
const INSTRUCTOR_PERM = "instructor";
const USER_PERM = "user";

// url paths
const USER = "/user";
const USER_SIGNUP = "/signup";
const USER_SIGNIN = "/signin";
const USER_FORGOT_PASS = "/forgot_password";
const USER_RESET_PASS = "/reset_password";
const USER_LOGOUT = "/logout";
const ACTIVATE = "/activate/:token";
const GRANT_PERMISSION = "/grant_user_permission";
const GET_REFRESH = "/get_access";
const GET_USERS = "/get_users";
const ADMIN_STUDENT_REG = "/admin_super_signup/:id";

const CLASSES = "/classes";
const CREATE_CLASS = "/create_class";
const PUBLISH = "/publish/:id";
const GET_CLASS = "/get_class/:id";
const REMOVE_FROM_CLASS = "/remove_from_class/:id";
const GET_CLASSES = "/get_classes";
const GET_CLASSES_ADMIN = "/get_classes_admin";
const GET_FILTERED_CLASSES = "/get_filtered_classes/:ageMin/:ageMax";
const UPDATE_CLASS = "/update_class/:id";
const DELETE_CLASS = "/delete_class/:id";
const JOIN_CLASS = "/join_class/:id";

// cookie constants
const REFRESH_TOKEN = "refreshToken";

module.exports = {
  CLASSES,
  CREATE_CLASS,
  ADMIN_PERM,
  INSTRUCTOR_PERM,
  USER_PERM,
  USER,
  GET_FILTERED_CLASSES,
  USER_SIGNUP,
  USER_SIGNIN,
  USER_FORGOT_PASS,
  USER_RESET_PASS,
  USER_LOGOUT,
  REFRESH_TOKEN,
  CREATE_CLASS,
  GET_CLASSES,
  GET_CLASSES_ADMIN,
  UPDATE_CLASS,
  DELETE_CLASS,
  REMOVE_FROM_CLASS,
  GET_CLASS,
  ACTIVATE,
  PUBLISH,
  GET_USERS,
  JOIN_CLASS,
  GRANT_PERMISSION,
  GET_REFRESH,
  ADMIN_STUDENT_REG,
};
