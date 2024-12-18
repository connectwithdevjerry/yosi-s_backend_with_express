const mongoose = require("mongoose");

const classSchema = mongoose.Schema({
  title: { type: String, required: true }, // refreshtoken
  description: { type: String },
  dateAndTime: { type: Date },
  venue: { type: String },
  ageMin: { type: Number },
  ageMax: { type: Number },
  style: { type: String },
  uniqueRouteId: { type: String, unique: true },
  no_of_current_signups: { type: Number, default: 0 },
  no_of_max_signups: { type: Number, minValue: 1 },
  classImage: { type: String },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user_collection",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_collection",
    },
  ],
  quotaPerStudent: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_collection",
        required: true,
      },
      quota: { type: Number, minValue: 1 },
    },
  ],
  toBeUpdatedByInstructor: {
    description: { type: Boolean, default: false },
    dateAndTime: { type: Boolean, default: false },
    ageGroup: { type: Boolean, default: false },
    venue: { type: Boolean, default: false },
    no_of_max_signups: { type: Boolean, default: false },
    style: { type: Boolean, default: false },
  },
  published: {
    type: Boolean,
    default: false,
  },
});

const classModel = mongoose.model("class_collection", classSchema);
module.exports = classModel;
