const { ADMIN_PERM, INSTRUCTOR_PERM } = require("../constants");
const classModel = require("../models/classes.model");
const userModel = require("../models/user.model");
const {
  createClassSchema,
  updateClassSchema,
  uniqueRouteIdSchema,
  grantPermSchema,
} = require("../validation_schema");
const crypto = require("crypto");

const create_class = async (req, res) => {
  const permitted_user = [ADMIN_PERM, INSTRUCTOR_PERM];
  if (!permitted_user.includes(req.role))
    return res.send({
      status: false,
      message: "You do not have the permission to perform this operation!",
    });
  try {
    const result = await createClassSchema.validateAsync(req.body);
    const myclass = await new classModel(result);
    const salt = crypto.randomBytes(16).toString("hex");
    myclass.uniqueRouteId = salt;
    myclass.save();
    return res.send({
      status: true,
      message: "class successfully created!",
      data: myclass,
    });
  } catch (error) {
    console.log(error.message);
    return res.send({ status: false, message: error.message });
  }
};

// this is separate because admin or instructor must also be able to view as user
const get_classes_user = async (req, res) => {
  try {
    const classes = await classModel.find(
      { published: true },
      { students: 0, toBeUpdatedByInstructor: 0, published: 0, instructor: 0 }
    );
    // const classes = await classModel.find({});
    return res.send({ status: true, data: classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return res.send({ status: false, message: error.message });
  }
};

// this is separate because admin or instructor must also be able to view as user
const get_classes_admin = async (req, res) => {
  const permitted_users = [ADMIN_PERM, INSTRUCTOR_PERM];
  if (!permitted_users.includes(req.role))
    return res.send({
      status: false,
      message: "You do not have permission to view this!",
    });
  try {
    const classes = await classModel.find({}).populate("students").exec();;
    return res.send({ status: true, data: classes });
  } catch (e) {
    console.error("Error fetching classes:", e.message);
    return res.send({
      status: false,
      message: "Error fetching classes! Kindly Reload",
    });
  }
};

const get_class = async (req, res) => {
  try {
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const class_to_get = await classModel.findOne({ uniqueRouteId });

    if (!class_to_get)
      return res.send({
        status: false,
        message: "No class found!",
      });
    return res.send({
      status: true,
      data: class_to_get,
    });
  } catch (error) {
    return { status: false, message: error.message };
  }
};

const _h = (val) => {
  return val ? val : false;
};

const update_class = async (req, res) => {
  // only admin and the instructor assigned to the course can edit course, you can't edit a published form

  const permitted_user = [INSTRUCTOR_PERM, ADMIN_PERM];

  try {
    const { uniqueRouteId } = uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const filter = { uniqueRouteId };
    const class_to_update = await classModel.findOne(filter);

    const either_is_permitted =
      class_to_update.instructor == req.user || req.role === ADMIN_PERM;

    if (
      permitted_user.includes(req.role) &&
      either_is_permitted &&
      !class_to_update.pusblished
    ) {
      try {
        const result = await updateClassSchema.validateAsync(req.body);

        console.log(class_to_update.instructor);

        // check if admin gave instructor permission to update certain fields before updating
        if (req.role === INSTRUCTOR_PERM) {
          const {
            description: updateDescription,
            dateAndTime: udateDateAndTime,
            ageGroup: updateAgeGroup,
            venue: updateVenue,
            style: updateStyle,
            no_of_max_signups: update_no_of_max_signups,
          } = class_to_update.toBeUpdatedByInstructor;

          if (updateDescription)
            class_to_update.description = result.description;

          if (update_no_of_max_signups)
            class_to_update.no_of_max_signups = result.no_of_max_signups;

          if (updateAgeGroup) {
            class_to_update.ageMin = result.ageMin;
            class_to_update.ageMax = result.ageMax;
          }

          if (udateDateAndTime)
            class_to_update.dateAndTime = result.dateAndTime;

          if (updateVenue) class_to_update.venue = result.venue;

          if (updateStyle) class_to_update.style = result.style;

          await class_to_update.save();

          return res.send({
            status: true,
            message: "Class successfully updated!",
            data: class_to_update,
          });
        }

        // admin can update all fields
        class_to_update.description = result.description;
        class_to_update.no_of_max_signups = result.no_of_max_signups;
        class_to_update.ageMin = result.ageMin;
        class_to_update.ageMax = result.ageMax;
        class_to_update.dateAndTime = result.dateAndTime;
        class_to_update.venue = result.venue;
        class_to_update.style = result.style;
        class_to_update.toBeUpdatedByInstructor.description = _h(
          result.updateDescription
        );
        class_to_update.toBeUpdatedByInstructor.no_of_max_signups = _h(
          result.update_no_of_max_signups
        );
        class_to_update.toBeUpdatedByInstructor.ageGroup = _h(
          result.updateAgeGroup
        );
        class_to_update.toBeUpdatedByInstructor.dateAndTime = _h(
          result.udateDateAndTime
        );
        class_to_update.toBeUpdatedByInstructor.venue = _h(result.updateVenue);
        class_to_update.toBeUpdatedByInstructor.style = _h(result.update_style);

        await class_to_update.save();

        return res.send({
          status: true,
          message: "Class successfully updated!",
          data: class_to_update,
        });
      } catch (errors) {
        return res.send({ status: false, message: errors.message });
      }
    } else {
      return res.send({
        status: false,
        message: class_to_update.pusblished
          ? "You can't edit a published form!"
          : "You don't have permission to make edits to this form",
      });
    }
  } catch (errors) {
    return res.send({ status: false, message: errors.message });
  }
};

const publish_class = async (req, res) => {
  const permitted_user = [ADMIN_PERM, INSTRUCTOR_PERM];
  const uniqueRouteId = req.params.id;

  if (!uniqueRouteId)
    return res.send({ status: false, message: "Invalid unique route Id" });

  if (!permitted_user.includes(req.role))
    return res.send({
      status: false,
      message: "You don't have permission to publish",
    });

  try {
    const class_to_publish = await classModel.findOne({ uniqueRouteId });

    if (!class_to_publish)
      return res.send({ status: false, message: "Form does not exist!" });

    class_to_publish.published = true;

    await class_to_publish.save();

    return res.send({
      status: true,
      message: "Form successfully published!",
      data: class_to_publish,
    });
  } catch (err) {
    return res.send({ status: false, message: err.message });
  }
};

const delete_class = async (req, res) => {
  const permitted_user = [ADMIN_PERM];

  if (!permitted_user.includes(req.role))
    return res.send({
      status: false,
      message: "You are don't have permission to delete!",
    });

  try {
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const filter = { uniqueRouteId };
    const delete_resp = await classModel.findOneAndDelete(filter);

    if (delete_resp) {
      return res.send({ status: true, message: "Class deleted successfully!" });
    }

    return res.send({ status: false, message: "Class not found!" });
  } catch (error) {
    console.log(error.message);
    return res.send({ status: false, message: error.message });
  }
};

const join_class = async (req, res) => {
  try {
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const class_to_join = await classModel.findOne({ uniqueRouteId });
    if (!class_to_join) {
      return res.send({ status: false, message: "Class not found!" });
    }
    if (class_to_join.no_of_max_signups <= class_to_join.students.length) {
      return res.send({ status: false, message: "Class is full!" });
    }
    if (class_to_join.students.includes(req.user)) {
      return res.send({ status: false, message: "You are already enrolled!" });
    }

    class_to_join.students.push(req.user);
    await class_to_join.save();

    return res.send({ status: true, message: "You have joined the class!" });
  } catch (err) {
    console.log(err.message);
    return res.send({ status: false, message: err.message });
  }
};

module.exports = {
  create_class,
  get_classes_user,
  get_classes_admin,
  update_class,
  delete_class,
  get_class,
  publish_class,
  join_class,
};
