const jwtModel = require("./models/jwt.model");

const saveJWT = async (userId, refreshToken, token_lasts_secs) => {
  const result = { userId, refreshToken, token_lasts_secs };

  try {
    const exists = await jwtModel.findOne({ userId });

    if (exists) {
      exists.refreshToken = refreshToken;
      exists.token_lasts_secs = token_lasts_secs;
      exists.save();
    } else {
      const jwt = new jwtModel(result);
      await jwt.save();
    }

    return true;
  } catch {
    return false;
  }
};

const getJWT = async (userId) => {
  try {
    const jwt = await jwtModel.findOne({ userId });
    return jwt;
  } catch {
    return false;
  }
};

const deleteJWT = async (userId) => {
  try {
    await jwtModel.deleteOne({ userId });
    return true;
  } catch {
    return false;
  }
};

module.exports = { saveJWT, getJWT, deleteJWT };
