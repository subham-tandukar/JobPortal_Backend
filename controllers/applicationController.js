const application = require("../models/applicationSchema");
const Job = require("../models/jobSchema");
const express = require("express");
const cloudinary = require("../cloudinary");
const sendMail = require("../utils/SendMail");
const fs = require("fs");
const path = require("path");

// ---- apply form ----
exports.applyJob = async (req, res) => {
  const { JobID, Name, Email, PhoneNumber, CV } = req.body;

  const user = req.user;

  const userId = user.User.Id;

  const file = req.file;

  // Define the uploads folder path
  const uploadsFolderPath = path.join(__dirname, "../uploads/pdf");
  const filePath = file ? path.join(uploadsFolderPath, file.filename) : null;

  const deleteFile = () => {
    // Check if the file exists before attempting to delete
    if (filePath && fs.existsSync(filePath)) {
      // Delete the file synchronously
      fs.unlinkSync(filePath);
    }
  };

  try {
    // Check if the uploads folder exists, if not, create it
    if (!fs.existsSync(uploadsFolderPath)) {
      fs.mkdirSync(uploadsFolderPath, { recursive: true });
    }
    if (!Name || !PhoneNumber || !file) {
      deleteFile();
      return res.status(422).json({
        StatusCode: 422,
        Message: "Please fill the required fields",
      });
    }

    // Check if the user has already applied for the job
    const existingApplication = await application.findOne({
      JobID,
      CandidateID: userId,
    });
    if (existingApplication) {
      deleteFile();

      return res.status(422).json({
        StatusCode: 422,
        Message: "You have already applied for this job",
      });
    }

    // const base64Pdf = CV.split(",")[1];
    // // Decode base64 string to binary
    // const pdfBuffer = Buffer.from(base64Pdf, "base64");

    // // Create a unique filename
    // const filename = `pdf_${Date.now()}.pdf`;

    // // Save the PDF file to the server
    // const filePath = path.join(__dirname, "../uploads", filename);
    // fs.writeFileSync(filePath, pdfBuffer);
    // Return the URL for accessing the uploaded PDF

    // Determine file URL based on file type
    let fileUrl;
    const filename = file.filename; // Extract filename from path
    if (file.mimetype === "application/pdf") {
      fileUrl = `${process.env.REACT_APP_URL}/uploads/pdf/${filename}`;
    } else {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Only PDF files are allowed",
      });
    }

    const applicationData = new application({
      Name,
      PhoneNumber,
      Email,
      JobID,
      CV: fileUrl,
      JobStatus: "P",
      CandidateID: userId,
    });
    await applicationData.save();

    try {
      const messageBody = `<p>Hello <b>${Name}</b>,</p>
      <strong>Thank you for applying for the job. We have received your application and will review it shortly.</strong>
      <p>Best regards,<br/>Talent Hospitality</p>`;

      sendMail("Thank you for applying!", messageBody, Email);

      res.status(201).json({
        StatusCode: 200,
        Message: "success",
      });
    } catch (error) {
      deleteFile();
      res.status(500).json({
        StatusCode: 500,
        Message: "Error applying application",
        Error: error.message,
      });
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

// Serve PDF file
exports.viewPdf = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.applicationList = async (req, res) => {
  try {
    const { JobStatus, JobDesignation, Name } = req.query;

    let sortQuery = { createdAt: -1 };
    let query = {};
    if (JobStatus) query.JobStatus = JobStatus;
    if (JobDesignation) query.JobID = JobDesignation;
    if (Name) query.Name = { $regex: Name, $options: "i" };

    const Page = parseInt(req.body.Page) || 1;
    const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
    const skip = (Page - 1) * PageSize;

    let applications;

    applications = await application
      .find(query)
      .sort(sortQuery)
      .populate("JobID")
      .skip(skip)
      .limit(PageSize);

    const totalDocuments = await application.countDocuments(query);

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
      Job: application.JobID.JobDesignation,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
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

exports.singleApplication = async (req, res) => {
  try {
    const jobId = req.params.jobId; // Extract jobId from request parameters

    const { JobStatus, Name } = req.query;

    let sortQuery = { createdAt: -1 };
    let query = { JobID: jobId };
    if (JobStatus) query.JobStatus = JobStatus;
    if (Name) query.Name = { $regex: Name, $options: "i" };

    const Page = parseInt(req.body.Page) || 1;
    const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
    const skip = (Page - 1) * PageSize;

    let applications;

    applications = await application
      .find(query)
      .sort(sortQuery)
      .populate("JobID")
      .skip(skip)
      .limit(PageSize);

    const totalDocuments = await application.countDocuments(query);

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
      Job: application.JobID.JobDesignation,
    }));

    const job = transformedData[0]?.Job;

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Pagination: {
        Page,
        PageSize,
        Total: totalDocuments, // Total number of documents in the collection
      },
      Count: transformedData.length,
      Job: job,
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

exports.appliedList = async (req, res) => {
  const user = req.user;
  const userId = user.User.Id;

  try {
    // Query applications for the specified user
    const userApplications = await application.find({ CandidateID: userId });

    // Extract job IDs from the user's applications
    const jobIds = userApplications.map((application) => application.JobID);

    // Query jobs corresponding to the extracted job IDs
    const jobs = await Job.find({ _id: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Count: jobs.length,
      Values: jobs.length <= 0 ? null : jobs,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

//
exports.application = async (req, res) => {
  const { FLAG, JobStatus, ApplicationID, BulkApplicationID } = req.body;

  try {
    if (FLAG === "US") {
      const update = {
        JobStatus,
      };

      const appliedApplication = await application.findById({
        _id: ApplicationID,
      });
      const appliedJob = await Job.findById({ _id: appliedApplication.JobID });
      await application.findByIdAndUpdate(ApplicationID, update, {
        new: true,
      });

      try {
        const subject = `Application Update: ${appliedJob.JobDesignation}`;
        let messageBody;

        if (JobStatus === "A") {
          messageBody = `
            <p>Hello <strong>${appliedApplication.Name}</strong>,</p>
            <p>Congratulations! Your application for the job ${appliedJob.JobDesignation} has been accepted.</p>
            <p>We are excited to have you join our team. Please reach out if you have any questions.</p>
            <p>Best regards,<br/>Talent Hospitality</p>
          `;
        } else if (JobStatus === "R") {
          messageBody = `
            <p>Hello <strong>${appliedApplication.Name}</strong>,</p>
            <p>We regret to inform you that your application for the job ${appliedJob.JobDesignation} was not successful.</p>
            <p>Thank you for your interest and time. We encourage you to apply for future opportunities.</p>
            <p>Best regards,<br/>Talent Hospitality</p>
          `;
        }

        await sendMail(subject, messageBody, appliedApplication.Email);

        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating aplication status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      try {
        const deleteApplication = await application.findByIdAndDelete(
          ApplicationID
        );

        if (!deleteApplication) {
          return res.status(404).json({
            StatusCode: 404,
            Message: "Application not found",
          });
        }

        // Retrieve the PDF filename from the application object
        const pdfFilename = deleteApplication.CV;

        if (!pdfFilename) {
          return res.status(404).json({
            StatusCode: 404,
            Message: "PDF filename not found for the application",
          });
        }
        // Construct the file path to the associated PDF file
        const pdfFilePath = path.join(
          __dirname,
          "../uploads/pdf",
          pdfFilename.split("/")[5]
        );

        // Check if the file exists before attempting to delete
        if (fs.existsSync(pdfFilePath)) {
          // Delete the file synchronously
          fs.unlinkSync(pdfFilePath);
        }
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting application",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      try {
        // Perform bulk delete operation in MongoDB
        const deleteResults = await application.deleteMany({
          _id: { $in: BulkApplicationID },
        });

        // Retrieve the list of deleted applications
        const bulkApplications = await application.find({
          _id: { $in: BulkApplicationID },
        });

        bulkApplications.forEach((app) => {
          const pdfFilename = app.pdfFilename;
          if (pdfFilename) {
            const pdfFilePath = path.join(__dirname, "../uploads", pdfFilename);
            // Check if the file exists before attempting to delete
            if (fs.existsSync(pdfFilePath)) {
              // Delete the file synchronously
              fs.unlinkSync(pdfFilePath);
            }
          }
        });

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
