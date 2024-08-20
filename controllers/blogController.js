const Blog = require("../models/blogSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");
const path = require("path");

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// ---- add book ----
exports.blog = async (req, res) => {
  const {
    FLAG,
    BlogID,
    Title,
    Description,
    Auther,
    Category,
    Image,
    CommentID,
    Status,
    BulkBlogID,
  } = req.body;
  const file = req.file;
  // Define the uploads folder path
  const uploadsFolderPath = path.join(__dirname, "../uploads/img");
  const filePath = file ? path.join(uploadsFolderPath, file.filename) : null;
  const deleteFile = () => {
    // Check if the file exists before attempting to delete
    if (filePath && fs.existsSync(filePath)) {
      // Delete the file synchronously
      fs.unlinkSync(filePath);
    }
  };

  try {
    if (FLAG === "I") {
      // Check if the uploads folder exists, if not, create it
      if (!fs.existsSync(uploadsFolderPath)) {
        fs.mkdirSync(uploadsFolderPath, { recursive: true });
      }

      if (!Title || !Description || !file || !Auther || !Category) {
        deleteFile();
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }

      const slug = generateSlug(Title);

      let existingBlog = await Blog.findOne({ Title: Title });
      if (existingBlog) {
        deleteFile();

        return res.status(422).json({
          StatusCode: 422,
          Message: "This title already exists",
        });
      }

      let fileUrl;
      const filename = file.filename; // Extract filename from path
      if (file.mimetype.startsWith("image")) {
        fileUrl = filename;
      } else {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Only Images are allowed",
        });
      }

      const blogData = new Blog({
        Status,
        Title,
        Description,
        Auther,
        Slug: slug,
        Category: Category,
        Image: fileUrl,
      });
      await blogData.save();

      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        deleteFile();
        res.status(500).json({
          StatusCode: 500,
          Message: "Error creating blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (Title) {
        const existingBlog = await Blog.findOne({
          Title,
          _id: { $ne: BlogID },
        });
        if (existingBlog) {
          deleteFile();
          return res.status(422).json({
            StatusCode: 422,
            Message: "This title already exists",
          });
        }
      }
      if (
        !Title || !Description || !Auther || !Category || file ? !file : !Image
      ) {
        if (file) {
          deleteFile();
        }
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }
      let blog = await Blog.findById({ _id: BlogID });
      if (!blog) {
        if (file) {
          deleteFile();
        }
        return res.status(404).json({
          StatusCode: 404,
          Message: "Blog not found",
        });
      }

      let fileUrl = blog.Image;
      const filename = file && file.filename;

      if (file) {
        if (!file.mimetype.startsWith("image")) {
          deleteFile();
          return res.status(422).json({
            StatusCode: 422,
            Message: "Only Images are allowed",
          });
        } else {
          const deleteOldFile = path.join(__dirname, "../uploads/img", fileUrl);

          // Check if the file exists before attempting to delete
          if (fs.existsSync(deleteOldFile)) {
            // Delete the file synchronously
            fs.unlinkSync(deleteOldFile);
          }

          fileUrl = filename;
        }
      }

      const slug = generateSlug(Title);

      const update = {
        Status,
        Title,
        Auther,
        Category,
        Slug: slug,
        Description,
        Image: fileUrl,
      };

      await Blog.findByIdAndUpdate(BlogID, update, {
        new: true,
      });

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        if (file) {
          deleteFile();
        }
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "UC") {
      // Assuming req.body.Comment is an array of comments to be added
      const newComments = req.body.Comments;

      // Find the blog post by ID
      const blogPost = await Blog.findById(BlogID);

      // Add the new comments to the existing comments
      blogPost.Comments.push(...newComments);

      // Save the updated blog post
      await blogPost.save();

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating comment",
          Error: error.message,
        });
      }
    } else if (FLAG === "DC") {
      // Assuming CommentID is provided in the request body
      if (!CommentID) {
        return res.status(422).json({
          Message: "Please provide the CommentID to delete the comment",
        });
      }

      // Find the blog post by ID
      const blogPost = await Blog.findById(BlogID);

      // Find the index of the comment to delete
      const commentIndex = blogPost.Comments.findIndex(
        (comment) => comment._id == CommentID
      );

      if (commentIndex === -1) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Comment not found",
        });
      }

      // Remove the comment from the array
      blogPost.Comments.splice(commentIndex, 1);

      // Save the updated blog post
      await blogPost.save();

      res.status(201).json({
        StatusCode: 200,
        Message: "success",
      });
    } else if (FLAG === "S") {
      try {
        let sortQuery = { createdAt: -1 };
        let query = {};
        if (Status) query.Status = Status;
        if (Category) query.Category = Category;
        if (Title) query.Title = { $regex: Title, $options: "i" };

        const Page = parseInt(req.body.Page) || 1;
        const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
        const skip = (Page - 1) * PageSize;

        let blogdata;

        blogdata = await Blog.find(query)
          .sort(sortQuery)
          .populate("Category")
          .populate("Auther")
          .skip(skip)
          .limit(PageSize);

        const transformedData = blogdata.map((item) => ({
          ...item.toObject(),
          Image: `${process.env.REACT_APP_URL}/uploads/img/${item.Image}`,
        }));

        const totalDocuments = await Blog.countDocuments(query);

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Pagination: {
            Page,
            PageSize,
            Total: totalDocuments, // Total number of documents in the collection
          },
          Count: transformedData.length,
          Values: transformedData.length <= 0 ? null : transformedData,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Internal Server Error",
          Error: error.message,
        });
      }
    } else if (FLAG === "SI") {
      try {
        const showblog = await Blog.find({ _id: BlogID })
          .sort({ createdAt: -1 })
          .populate("Category")
          .populate("Auther");

        const transformedData = showblog.map((item) => ({
          ...item.toObject(),
          Image: `${process.env.REACT_APP_URL}/uploads/img/${item.Image}`,
        }));

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: transformedData.length,
          Values: transformedData.length <= 0 ? null : transformedData,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Internal Server Error",
          Error: error.message,
        });
      }
    } else if (FLAG === "US") {
      const update = {
        Status,
      };

      await Blog.findByIdAndUpdate(BlogID, update, {
        new: true,
      });

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating blog status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      try {
        const deleteBlog = await Blog.findByIdAndDelete({ _id: BlogID });

        if (!deleteBlog) {
          return res.status(404).json({
            StatusCode: 404,
            Message: "Blog not found",
          });
        }

        const fileName = deleteBlog.Image;
        if (fileName) {
          // Construct the file path to the associated PDF file
          const filePath = path.join(__dirname, "../uploads/img", fileName);

          // Check if the file exists before attempting to delete
          if (fs.existsSync(filePath)) {
            // Delete the file synchronously
            fs.unlinkSync(filePath);
          }
        }
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Blog.deleteMany({
        _id: { $in: BulkBlogID },
      });

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
          DeletedCount: deleteResults.deletedCount,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "An error occurred while performing bulk delete",
          Error: error.message,
        });
      }
    } else {
      deleteFile();
      res.status(400).json({ StatusCode: 400, Message: "Invalid flag" });
    }
  } catch (error) {
    deleteFile();
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get single blog ---
exports.singleBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const unique = await Blog.findOne({ Slug: slug });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Blog doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const blogdata = await Blog.find({ Slug: slug })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("Auther");

    // Retrieve the current job based on the slug
    const currentBlog = await Blog.findOne({ Slug: slug })
      .populate("Category")
      .populate("Auther");

    if (!currentBlog) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Blog doesn't exist",
      });
    }

    const currentCategory = currentBlog.Category._id;

    const categoryJob = await Blog.find({
      Category: currentCategory,
    })
      .populate("Category")
      .populate("Auther");

    // Retrieve all jobs of the same category, excluding the current job
    const relatedBlogs = categoryJob.filter(
      (item) => item._id.toString() !== currentBlog._id.toString()
    );

    const transformedData = blogdata.map((job) => ({
      ...job.toObject(),
      Image: `${process.env.REACT_APP_URL}/uploads/img/${job.Image}`,
      RelatedBlogs: relatedBlogs.length <= 0 ? null : relatedBlogs,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: transformedData.length <= 0 ? null : transformedData[0],
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get blog ---
exports.blogList = async (req, res) => {
  try {
    let sortQuery = { createdAt: -1 };
    let query = {};
    query.Status = "A";

    const Page = parseInt(req.body.Page) || 1;
    const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
    const skip = (Page - 1) * PageSize;

    let blogdata;

    blogdata = await Blog.find(query)
      .sort(sortQuery)
      .populate("Category")
      .populate("Auther")
      .skip(skip)
      .limit(PageSize);

    const transformedData = blogdata.map((item) => ({
      ...item.toObject(),
      Image: `${process.env.REACT_APP_URL}/uploads/img/${item.Image}`,
    }));

    const totalDocuments = await Blog.countDocuments(query);

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Pagination: {
        Page,
        PageSize,
        Total: totalDocuments, // Total number of documents in the collection
      },
      Count: transformedData.length,
      Values: transformedData.length <= 0 ? null : transformedData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
