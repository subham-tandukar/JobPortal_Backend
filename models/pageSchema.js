const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
    },
    Slug: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const pages = new mongoose.model("page", pageSchema);

module.exports = pages;
