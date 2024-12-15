const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./jwt_db_access");
require("dotenv").config();

const signAccessToken = (userId, payload = {}) => {
  return new Promise((resolve, reject) => {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: "1h",
      issuer: "maimi_dance_festival.com",
      audience: userId,
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err.message);
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

const signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: "1y",
      issuer: "maimi_dance_festival.com",
      audience: userId,
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err.message);
        // reject(err)
        reject(createError.InternalServerError());
      }

      const isSaved = client.saveJWT(userId, token, 365 * 24 * 60 * 60);

      if (!isSaved) {
        console.log("Refresh token was not saved in database!");
        reject(createError.InternalServerError());
        return;
      }

      resolve(token);
    });
  });
};

const verifyAccessToken = (req, res, next) => {
  if (!req.headers["authorization"]) return next(createError.Unauthorized());
  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader.split(" ");
  const token = bearerToken[1];
  console.log({ token });
  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      const message =
        err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
      return res.status(403).json({ message });
    }
    console.log({ payload });
    req.payload = payload;
    req.role = payload.permissionLev;
    req.user = payload.aud;
    next();
  });
};

const verifyRefreshToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    JWT.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        const userId = payload.aud;

        const isExisting = await client.getJWT(userId);

        console.log({ isExisting });

        if (isExisting === false) {
          console.log("Error occured while getting JWT!");
          reject(createError.InternalServerError());
          return;
        } else if (!isExisting) {
          reject(createError.Unauthorized()); // empty jwt
        } else {
          if (refreshToken === isExisting.refreshToken) return resolve(userId);
          reject(createError.Unauthorized());
        }
      }
    );
  });
};

const signForgotToken = (email) => {
  console.log({ email });
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.FORGOT_TOKEN_SECRET;
    const options = {
      expiresIn: "10m",
      issuer: "pickurpage.com",
      audience: email,
    };
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err.message);
        reject(createError.InternalServerError());
        return;
      }
      resolve(token);
    });
  });
};

const verifyForgotToken = (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, process.env.FORGOT_TOKEN_SECRET, (err, payload) => {
      if (err) {
        reject(createError.InternalServerError(err.message));
      }
      resolve(payload.aud);
    });
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signForgotToken,
  verifyForgotToken,
  verifyAccessToken,
  verifyRefreshToken,
};
