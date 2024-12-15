const express = require("express");
const router = express.Router();
const {
  create_class,
  get_classes_admin,
  get_classes_user,
  update_class,
  delete_class,
  get_class,
  publish_class,
  join_class,
} = require("../controllers/classes.controller");
const {
  CREATE_CLASS,
  GET_CLASSES,
  GET_CLASSES_ADMIN,
  UPDATE_CLASS,
  DELETE_CLASS,
  GET_CLASS,
  PUBLISH,
  JOIN_CLASS,
} = require("../constants");
const { verifyAccessToken } = require("../jwt_helpers");

router.get(GET_CLASS, get_class);
router.get(GET_CLASSES, get_classes_user); // no need for any form of authentication and authorization checks
router.post(CREATE_CLASS, verifyAccessToken, create_class);
router.get(GET_CLASSES_ADMIN, verifyAccessToken, get_classes_admin); // verify that user is authenticated and is an admin and instructor
router.put(UPDATE_CLASS, verifyAccessToken, update_class);
router.delete(DELETE_CLASS, verifyAccessToken, delete_class);
router.put(JOIN_CLASS, verifyAccessToken, join_class);
router.post(PUBLISH, verifyAccessToken, publish_class);

module.exports = router;
