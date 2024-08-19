const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    Role: {
      type: String,
    },
    Profile: {
      type: String,
      // default:"https://www.iprcenter.gov/image-repository/blank-profile-picture.png/@@images/image.png"
    },
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    Password: {
      type: String,
      required: true,
    },
    LastLoggedIn: {
      type: Date, // Field to store the last logged in date
    },
    Source: {
      type: String,
    },
    LoginAttempts: {
      type: Number,
      default: 0,
    },
    BannedUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

const adminUsers = mongoose.model("adminUser", adminUserSchema);

module.exports = adminUsers;
