require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { USER, CLASSES } = require("./constants");
const userRoute = require("./routes/user.route");
const classRoute = require("./routes/classes.route");

const app = express();
const URI = process.env.MONGODB_URL;
const PORT = process.env.PORT || 5000;

mongoose
  .connect(URI)
  .then(() => {
    console.log("mongodb connected successfully!");
  })
  .catch((err) => {
    console.log("mongodb could not connect, try again", err);
  });

const corsOptions = {
  origin: "https://yosi-frontend-with-react.vercel.app",
  // origin: "http://localhost:5173",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(USER, userRoute);
app.use(CLASSES, classRoute);

app.get("/", (req, res) => {
  res.send("you've reached yosi's admin server!");
});

app.listen(PORT, (err) => {
  if (err) {
    console.log("server error", err);
  } else {
    console.log(`check running server on url http://localhost:${PORT}`);
  }
});
