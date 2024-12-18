const Joi = require("@hapi/joi");

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(5).required(),
});

const signUpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(10).required(),
  newPassword: Joi.string().min(5).required(),
  cnewPassword: Joi.string().min(5).required(),
});

const createClassSchema = Joi.object({
  title: Joi.string().required(),
  instructor: Joi.string().required(),
  classImage: Joi.string().required(),
  description: Joi.string(),
  dateAndTime: Joi.date(),
  venue: Joi.string(),
  ageMin: Joi.number(),
  ageMax: Joi.number(),
  style: Joi.string(),
  published: Joi.boolean(),
  no_of_max_signups: Joi.number(),
  update_no_of_max_signups: Joi.boolean(),
  update_style: Joi.boolean(),
  updateDescription: Joi.boolean(),
  udateDateAndTime: Joi.boolean(),
  updateAgeGroup: Joi.boolean(),
  updateVenue: Joi.boolean(),
});

const uniqueRouteIdSchema = Joi.object({
  uniqueRouteId: Joi.string().required(),
});

const grantPermSchema = Joi.object({
  email: Joi.string().email().required(),
  permission_type: Joi.string().required(),
});

const updateClassSchema = Joi.object({
  description: Joi.string(),
  dateAndTime: Joi.date(),
  venue: Joi.string(),
  ageMin: Joi.number(),
  ageMax: Joi.number(),
  style: Joi.string(),
  published: Joi.boolean(),
  no_of_max_signups: Joi.number(),
  update_style: Joi.boolean(),
  update_no_of_max_signups: Joi.boolean(),
  updateDescription: Joi.boolean(),
  udateDateAndTime: Joi.boolean(),
  updateAgeGroup: Joi.boolean(),
  updateVenue: Joi.boolean(),
});

module.exports = {
  authSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createClassSchema,
  updateClassSchema,
  uniqueRouteIdSchema,
  grantPermSchema,
};
