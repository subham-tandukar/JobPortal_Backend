const Job = require("../models/jobSchema");
const Application = require("../models/applicationSchema");
// --- count ---
exports.locationCount = async (req, res) => {
  try {
    // Retrieve job data from the database
    const jobData = await Job.find();

    // Create a map to store locations and their counts
    const locationMap = new Map();

    // Iterate through job data to count locations
    jobData.forEach((job) => {
      const location = job.Location;
      if (locationMap.has(location)) {
        // Increment count if location exists
        locationMap.set(location, locationMap.get(location) + 1);
      } else {
        // Add location to map if it doesn't exist
        locationMap.set(location, 1);
      }
    });

    // Format the data as required
    const locationData = [];
    locationMap.forEach((count, location) => {
      locationData.push({ Location: location, Count: count });
    });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: locationData.length <= 0 ? null : locationData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.dashboardCount = async (req, res) => {
  try {
    // Total Jobs count------------------------
    const totalJobCt = await Job.find({ IsPublished: "Y" });
    const totalJob = totalJobCt.length;

    // Application count------------------------
    const applicationCt = await Application.find();
    const application = applicationCt.length;

    // Approved count------------------------
    const approvedCt = await Application.find({ JobStatus: "A" });
    const approved = approvedCt.length;

    // Rejected count------------------------
    const rejectedCt = await Application.find({ JobStatus: "R" });
    const rejected = rejectedCt.length;

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: [
        {
          Jobs: totalJob,
          Applications: application,
          Approved: approved,
          Rejected: rejected,
        },
      ],
    });

  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
