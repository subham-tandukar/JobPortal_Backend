const Job = require("../models/jobSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");
const application = require("../models/applicationSchema");
const path = require("path");

// Function to generate slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

function generateUniqueRandomNumber() {
  const timestamp = Date.now(); // Get current timestamp
  const randomNum = Math.floor(Math.random() * 1000); // Generate random number
  return `${timestamp}${randomNum}`; // Concatenate timestamp and random number
}

// ---- add job ----
exports.job = async (req, res) => {
  const {
    JobID,
    ComName,
    ComLogo,
    JobDesignation,
    JobDescription,
    ExpiryDate,
    Location,
    Salary,
    Category,
    JobType,
    IsFeatured,
    IsPublished,
    FLAG,
    BulkJobID,
    UserID,
    Qualification,
    Experience,
    Gender,
    Update,
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
      if (
        !ComName ||
        !JobDesignation ||
        !JobDescription ||
        !ExpiryDate ||
        !Location ||
        !Salary ||
        !Category ||
        !JobType
      ) {
        deleteFile();
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      // Generate unique random number
      const randomNum = generateUniqueRandomNumber();

      // Generate slug based on unique random number and JobDesignation
      const slug = generateSlug(`${JobDesignation}-${randomNum}`);

      // Generate slug based on ComName and JobDesignation
      // const slug = generateSlug(`${ComName}-${JobDesignation}`);

      // Check if the combination of ComName and JobDesignation already exists
      let existingJob = await Job.findOne({ ComName, JobDesignation });
      if (existingJob) {
        deleteFile();
        return res.status(422).json({
          StatusCode: 422,
          Message:
            "This Company and Job Designation combination already exists",
        });
      }

      let fileUrl = "";
      if (file) {
        const filename = file.filename; // Extract filename from path
        if (file.mimetype.startsWith("image")) {
          fileUrl = filename;
        } else {
          return res.status(422).json({
            StatusCode: 422,
            Message: "Only Images are allowed",
          });
        }
      }

      const jobData = new Job({
        UserID,
        ComName,
        JobDesignation,
        Slug: slug,
        JobDescription,
        ExpiryDate,
        Location,
        Salary,
        Category,
        JobType,
        IsFeatured,
        IsPublished,
        Qualification,
        Experience,
        Gender,
        ComLogo: fileUrl,
      });
      await jobData.save();

      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error creating job",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (
        !ComName ||
        !JobDesignation ||
        !JobDescription ||
        !ExpiryDate ||
        !Location ||
        !Salary ||
        !Category ||
        !JobType
      ) {
        deleteFile();
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      let job = await Job.findById({ _id: JobID });
      if (ComName && JobDesignation) {
        const existingData = await Job.findOne({
          ComName,
          JobDesignation,
          _id: { $ne: JobID },
        });
        if (existingData) {
          deleteFile();
          return res.status(422).json({
            StatusCode: 422,
            Message:
              "This Company and Job Designation combination already exists",
          });
        }
      }

      let fileUrl = job.ComLogo;

      const filename = file && file.filename; // Extract filename from path

      if (file) {
        if (!file.mimetype.startsWith("image")) {
          deleteFile();
          return res.status(422).json({
            StatusCode: 422,
            Message: "Only Images are allowed",
          });
        } else {
          if (fileUrl) {
            const deleteOldFile = path.join(
              __dirname,
              "../uploads/img",
              fileUrl
            );

            // Check if the file exists before attempting to delete
            if (fs.existsSync(deleteOldFile)) {
              // Delete the file synchronously
              fs.unlinkSync(deleteOldFile);
            }
          }
          fileUrl = filename;
        }
      }

      // Generate unique random number
      const randomNum = generateUniqueRandomNumber();

      // Generate slug based on unique random number and JobDesignation
      const slug = generateSlug(`${JobDesignation}-${randomNum}`);
      // Generate slug based on ComName and JobDesignation
      // const slug = generateSlug(`${ComName}-${JobDesignation}`);

      const update = {
        UserID,
        ComName,
        JobDesignation,
        Slug: slug,
        JobDescription,
        ExpiryDate,
        Location,
        Salary,
        Category,
        JobType,
        IsFeatured,
        IsPublished,
        Qualification,
        Experience,
        Gender,
        ComLogo: fileUrl,
      };

      await Job.findByIdAndUpdate(JobID, update, {
        new: true,
      });

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating job",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        const unique = await Job.findOne({ UserID: UserID });
        if (!unique) {
          return res.status(422).json({
            StatusCode: 422,
            Message: "User doesn't exist",
          });
        }

        let sortQuery = { createdAt: -1 };
        let query = {};
        if (UserID) query.UserID = UserID;
        if (Category) query.Category = Category;
        if (IsPublished) query.IsPublished = IsPublished;
        if (IsFeatured) query.IsFeatured = IsFeatured;
        if (JobDesignation)
          query.JobDesignation = { $regex: JobDesignation, $options: "i" };

        const Page = parseInt(req.body.Page) || 1;
        const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
        const skip = (Page - 1) * PageSize;

        let jobdata;

        jobdata = await Job.find(query)
          .sort(sortQuery)
          .populate("Category")
          .populate("JobType")
          .skip(skip)
          .limit(PageSize);

        const totalDocuments = await Job.countDocuments(query);

        // Get the count of applications for each job
        const jobIds = jobdata.map((job) => job._id); // Extract job IDs
        const applicationCounts = await application.aggregate([
          { $match: { JobID: { $in: jobIds } } }, // Filter applications by job IDs
          { $group: { _id: "$JobID", count: { $sum: 1 } } }, // Group applications by job and count
        ]);

        // Map application counts to job data
        jobdata = jobdata.map((job) => {
          const countObj = applicationCounts.find((count) =>
            count._id.equals(job._id)
          );
          const count = countObj ? countObj.count : 0;

          // To check expiry date
          const todayDate = new Date();
          const expiryDate = new Date(job.ExpiryDate);

          let year = todayDate.getFullYear();
          let month = String(todayDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
          let day = String(todayDate.getDate()).padStart(2, "0");

          const formattedTodayDate = `${year}-${month}-${day}`;
          const formattedExpiryDate = job.ExpiryDate;

          // Compare expiry date with today's date
          let IsExpired = formattedExpiryDate >= formattedTodayDate ? "N" : "Y";

          let ExpiresIn;
          if (formattedExpiryDate === formattedTodayDate) {
            ExpiresIn = "Today";
          } else if (formattedExpiryDate > formattedTodayDate) {
            const diffTime = Math.abs(expiryDate - todayDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const months = Math.floor((diffDays % 365) / 30);

            if (months >= 1) {
              ExpiresIn = expiryDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            } else {
              ExpiresIn = `${diffDays} day${diffDays > 1 ? "s" : ""}`;
            }
          } else {
            ExpiresIn = "Expired";
          }
          return {
            ...job.toObject(),
            ComLogo: `${process.env.REACT_APP_URL}/uploads/img/${job.ComLogo}`,
            NoOfApplications: count,
            IsExpired,
            ExpiresIn,
          };
        });

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Pagination: {
            Page,
            PageSize,
            Total: totalDocuments, // Total number of documents in the collection
          },
          Count: jobdata.length,
          Values: jobdata.length <= 0 ? null : jobdata,
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
        const unique = await Job.findOne({ UserID: UserID });
        if (!unique) {
          return res.status(422).json({
            StatusCode: 422,
            Message: "User doesn't exist",
          });
        }
        let jobData;

        // Check if Status is "-1" to retrieve all categories

        // Retrieve categories filtered by Category and populate the Category field
        jobData = await Job.find({
          _id: JobID,
          UserID: UserID,
        })
          .sort({ createdAt: -1 })
          .populate("Category")
          .populate("JobType");

        const transformedData = jobData.map((item) => ({
          ...item.toObject(),
          ComLogo: `${process.env.REACT_APP_URL}/uploads/img/${item.ComLogo}`,
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
      let update;
      if (Update === "Publish") {
        update = {
          IsPublished,
        };
      } else if (Update === "Feature") {
        update = {
          IsFeatured,
        };
      } else {
      }

      await Job.findByIdAndUpdate(JobID, update, {
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
          Message: "Error updating job status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      try {
        const deleteJob = await Job.findByIdAndDelete({ _id: JobID });

        if (!deleteJob) {
          return res.status(404).json({
            StatusCode: 404,
            Message: "Job not found",
          });
        }
        const fileName = deleteJob.ComLogo;
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
          Message: "Error deleting job",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Job.deleteMany({
        _id: { $in: BulkJobID },
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
      res.status(400).json({ StatusCode: 400, Message: "Invalid flag" });
    }
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get job ---
exports.jobList = async (req, res) => {
  try {
    let jobdata;

    jobdata = await Job.find({ IsPublished: "Y" })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobdata.length,
      Values: jobdata.length <= 0 ? null : jobdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get single job ---
exports.singleJob = async (req, res) => {
  try {
    const { slug } = req.params;

    const unique = await Job.findOne({ Slug: slug });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Job doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const jobdata = await Job.find({ Slug: slug })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    // Retrieve the current job based on the slug
    const currentJob = await Job.findOne({ Slug: slug })
      .populate("Category")
      .populate("JobType");

    if (!currentJob) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Job doesn't exist",
      });
    }

    const currentCategory = currentJob.Category._id;

    const categoryJob = await Job.find({
      Category: currentCategory,
    })
      .populate("Category")
      .populate("JobType");

    // Retrieve all jobs of the same category, excluding the current job
    const relatedJobs = categoryJob.filter(
      (item) => item._id.toString() !== currentJob._id.toString()
    );

    const transformedData = jobdata.map((job) => ({
      ...job.toObject(),
      RelatedJobs: relatedJobs.length <= 0 ? null : relatedJobs,
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

// get featured job
exports.featuredJob = async (req, res) => {
  try {
    const jobdata = await Job.find({ IsFeatured: "Y", IsPublished: "Y" })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobdata.length,
      Values: jobdata.length <= 0 ? null : jobdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
// get Intern job
exports.internJob = async (req, res) => {
  try {
    const jobdata = await Job.find()
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    const internData = jobdata.filter(
      (item) => item.JobType.JobType === "Intern"
    );

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: internData.length,
      Values: internData.length <= 0 ? null : internData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get location wise job ---
exports.locationJob = async (req, res) => {
  try {
    const { location } = req.params;
    const unique = await Job.findOne({ Location: location });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Job doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const jobdata = await Job.find({ Location: location })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobdata.length,
      Values: jobdata.length <= 0 ? null : jobdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get category wise job ---
exports.categoryJob = async (req, res) => {
  try {
    const { category } = req.params;
    const unique = await Job.find({ Category: category });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Job doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const jobdata = await Job.find({ Category: category, IsPublished: "Y" })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobdata.length,
      Values: jobdata.length <= 0 ? null : jobdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- filter job ---
exports.filterJob = async (req, res) => {
  try {
    const { JobType, Category, JobDesignation, ComName, Location } = req.query;

    let sortQuery = { createdAt: -1 };
    let query = { IsPublished: "Y" };

    // Check each filter parameter individually and add it to the query if it exists
    if (JobType) query.JobType = JobType;
    if (Location) query.Location = Location;
    if (JobDesignation)
      query.JobDesignation = { $regex: JobDesignation, $options: "i" };
    if (Category) query.Category = Category;
    if (ComName) query.ComName = ComName;

    let jobdata;

    jobdata = await Job.find(query)
      .sort(sortQuery)
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobdata.length,
      Values: jobdata.length <= 0 ? null : jobdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
