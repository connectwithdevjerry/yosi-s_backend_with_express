const { ADMIN_PERM, INSTRUCTOR_PERM } = require("../constants");
const classModel = require("../models/classes.model");
const userModel = require("../models/user.model");
const transporter = require("../nodemailerObject");
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
    const classes = await classModel
      .find({ published: true }, { toBeUpdatedByInstructor: 0, published: 0 })
      .populate("instructor")
      .exec();
    // const classes = await classModel.find({});
    return res.send({ status: true, data: classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return res.send({ status: false, message: error.message });
  }
};
const get_filtered_classes = async (req, res) => {
  const agemin = Number(req.params.ageMin);
  const agemax = Number(req.params.ageMax);

  console.log({ agemin, agemax });

  try {
    if (!agemin && !agemax) {
      const classes = await classModel
        .find({ published: true }, { toBeUpdatedByInstructor: 0, published: 0 })
        .populate("instructor")
        .exec();
      console.log(classes);
      return res.send({ status: true, data: classes });
    }
    const classes = await classModel
      .find(
        { published: true, ageMin: agemin, ageMax: agemax },
        { toBeUpdatedByInstructor: 0, published: 0 }
      )
      .populate("instructor")
      .exec();
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
    const classes = await classModel.find({}).populate("students").exec();
    console.log({ classes });
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

    const class_to_get = await classModel
      .findOne({ uniqueRouteId })
      .populate("instructor")
      .exec();
    console.log(class_to_get);

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
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const filter = { uniqueRouteId };
    const class_to_update = await classModel.findOne(filter);

    if (!class_to_update)
      return res.send({
        status: false,
        message: "Could not find class with this identifier",
      });

    console.log({ class_to_update });

    const either_is_permitted =
      class_to_update.instructor === req.user || req.role === ADMIN_PERM;

    if (
      permitted_user.includes(req.role) &&
      either_is_permitted &&
      !class_to_update.pusblished
    ) {
      try {
        const result = await updateClassSchema.validateAsync(req.body);

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

          class_to_update.published = result.published;

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

        class_to_update.published = result.published;

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
    console.log(errors);
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

const remove_me_from_class = async (req, res) => {
  try {
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const filter = { uniqueRouteId };
    const delete_resp = await classModel.findOne(filter);
    if (!delete_resp) {
      return res.send({ status: false, message: "Class not found!" });
    }

    const updated_students = delete_resp.students.filter(
      (student) => student != req.user
    );

    const get_my_quota = delete_resp?.quotaPerStudent?.filter(
      (myquota) => myquota.student == req.user
    );

    const updateQuota = delete_resp?.quotaPerStudent?.filter(
      (myquota) => myquota.student != req.user
    );

    if (!get_my_quota) {
      return res.send({ status: false, message: "You are not enrolled!" });
    }

    const current_signups = delete_resp.no_of_current_signups;

    const val = current_signups - get_my_quota[0]?.quota;

    delete_resp.no_of_current_signups = val;

    delete_resp.students = updated_students;
    delete_resp.quotaPerStudent = updateQuota;
    await delete_resp.save();

    return res.send({ status: true, message: "Class deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: error.message });
  }
};

const join_class = async (req, res) => {
  try {
    const { uniqueRouteId } = await uniqueRouteIdSchema.validateAsync({
      uniqueRouteId: req.params.id,
    });

    const quota = req.body.quota || 1;

    const class_to_join = await classModel.findOne({ uniqueRouteId });
    if (!class_to_join) {
      return res.send({ status: false, message: "Class not found!" });
    }
    if (class_to_join.published === false) {
      return res.send({ status: false, message: "Class is not published!" });
    }
    if (
      class_to_join.no_of_max_signups <= class_to_join.no_of_current_signups
    ) {
      return res.send({ status: false, message: "Class is full!" });
    }
    if (class_to_join.students.includes(req.user)) {
      return res.send({ status: false, message: "You are already enrolled!" });
    }

    const capacityAfterJoined = class_to_join.no_of_current_signups + quota;

    if (capacityAfterJoined > class_to_join.no_of_max_signups) {
      return res.send({
        status: false,
        message: "We do not have enough room to take in your students!",
      });
    }

    

    class_to_join.no_of_current_signups = capacityAfterJoined;

    class_to_join.students.push(req.user);

    console.log(class_to_join.quotaPerStudent);

    class_to_join.quotaPerStudent.push({ student: req.user, quota });

    await class_to_join.save();
    console.log(class_to_join.quotaPerStudent);

    return res.send({
      status: true,
      message: "You have joined the class!",
    });

    // const classTitle = class_to_join.title;
    // const firstName = class_to_join.firstName;

    // const user = await userModel.findOne({ _id: req.user });
    // const email = user.email;

    // let mailOptions = {
    //   from: process.env.MY_EMAIL_USER,
    //   to: email,
    //   subject: `${firstName}, Welcome aboard!`,
    //   text: `Hi ${firstName}, this is to notify you that you have successfully joined the ${classTitle} dance class.
    //   We'll be happy having you at our class. We'll keep communication with you from this email address!
    //   `,
    // };

    // await transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log({ error });
    //     return res.send({ status: false, message: "Failed to send email" });
    //   }
    //   console.log("Email sent: " + info.response);

    //   return res.send({
    //     status: true,
    //     message: "You have joined the class! We'll keep contact by mails.",
    //   });
    // });
  } catch (err) {
    console.log(err);
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
  remove_me_from_class,
  get_filtered_classes,
};
