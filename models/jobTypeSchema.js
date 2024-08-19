const mongoose = require("mongoose");

const jobTypeSchema = new mongoose.Schema(
  {
    JobType: {
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

const jobType = new mongoose.model("jobType", jobTypeSchema);

module.exports = jobType;
