const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
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
    Auther: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adminUser",
    },
    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    Image: {
      type: String,
      required: true,
    },
    Status: {
      type: String,
      default: "A",
    },
    Comments: [
      {
        Name: String,
        Email: String,
        Cmt: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true },
    ],
  },
  { timestamps: true }
);

const blogs = new mongoose.model("blog", blogSchema);

module.exports = blogs;
