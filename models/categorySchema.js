const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    Category: {
      type: String,
      required: true,
      trim: true,
    },
    Status: {
      type: String,
      default: "A",
    },
  },
  { timestamps: true }
);

const category = new mongoose.model("category", categorySchema);

module.exports = category;
