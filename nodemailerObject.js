const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // or 'STARTTLS'
  auth: {
    user: process.env.MY_EMAIL_USER,
    pass: process.env.MY_EMAIL_PASSWORD,
  },
});

module.exports = transporter;
