const mongoose = require("mongoose");

const jwtSchema = mongoose.Schema({
  refreshToken: { type: String, required: true }, // refreshtoken
  userId: { type: String, required: true, unique: true },
  dateCreated: { type: Date, immutable: true, default: () => Date.now() },
  token_lasts_secs: { type: Number, required: true },
});

const jwtModel = mongoose.model("jwt_collection", jwtSchema);
module.exports = jwtModel;
