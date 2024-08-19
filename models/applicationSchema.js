const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
    },
    CandidateID: {
      type: String,
    },
    PhoneNumber: {
      type: Number,
      required: true,
    },
    JobID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
    },
    CV: {
      type: String,
      required: true,
    },
    JobStatus: {
      type: String,
      defaultValue: "P",
    },
  },
  { timestamps: true }
);

const applications = new mongoose.model("application", applicationSchema);

module.exports = applications;
