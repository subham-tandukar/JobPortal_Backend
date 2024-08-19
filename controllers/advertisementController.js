const Advertisement = require("../models/advertisementSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");
const path = require("path");

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// ---- add Advertisement ----
exports.advertisement = async (req, res) => {
  const {
    FLAG,
    AdvertisementID,
    Position,
    Link,
    Image,
    Status,
    BulkAdvertisementID,
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

      if (!Position || !Link || !file) {
        deleteFile();
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }

      let existingAd = await Advertisement.findOne({ Position });
      if (existingAd) {
        deleteFile();
        return res.status(422).json({
          StatusCode: 422,
          Message: "This advertisement placement already exists",
        });
      }
      const slug = generateSlug(Position);

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

      const adData = new Advertisement({
        Position,
        Status,
        Link,
        Slug: slug,
        Image: fileUrl,
      });
      await adData.save();

      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error creating advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Position || !Link || file ? !file : !Image) {
        if (file) {
          deleteFile();
        }
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }

      if (Position) {
        const existingData = await Advertisement.findOne({
          Position,
          _id: { $ne: AdvertisementID },
        });
        if (existingData) {
          deleteFile();
          return res.status(422).json({
            StatusCode: 422,
            Message: "This advertisement placement already exists",
          });
        }
      }

      let ad = await Advertisement.findById({ _id: AdvertisementID });
      if (!ad) {
        if (file) {
          deleteFile();
        }
        return res.status(404).json({
          StatusCode: 404,
          Message: "Advertisement not found",
        });
      }

      let fileUrl = ad.Image;
      const filename = file && file.filename; // Extract filename from path

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

          fileUrl = `${process.env.REACT_APP_URL}/uploads/img/${filename}`;
        }
      }

      const slug = generateSlug(Position);

      const update = {
        Position,
        Status,
        Link,
        Slug: slug,
        Image: fileUrl,
      };

      await Advertisement.findByIdAndUpdate(AdvertisementID, update, {
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
          Message: "Error updating advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        let sortQuery = { createdAt: -1 };
        let query = {};
        if (Status) query.Status = Status;
        if (Position) query.Position = { $regex: Position, $options: "i" };

        const Page = parseInt(req.body.Page) || 1;
        const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
        const skip = (Page - 1) * PageSize;

        let adData;

        adData = await Advertisement.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(PageSize);

        const transformedData = adData.map((item) => ({
          ...item.toObject(),
          Image: `${process.env.REACT_APP_URL}/uploads/img/${item.Image}`,
        }));

        const totalDocuments = await Advertisement.countDocuments(query);

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
        const showad = await Advertisement.find({
          _id: AdvertisementID,
        }).sort({ createdAt: -1 });

        const transformedData = showad.map((item) => ({
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

      await Advertisement.findByIdAndUpdate(AdvertisementID, update, {
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
          Message: "Error updating Advertisement status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteAd = await Advertisement.findByIdAndDelete({
        _id: AdvertisementID,
      });

      if (!deleteAd) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Advertisement not found",
        });
      }

      const fileName = deleteAd.Image;
      if (fileName) {
        // Construct the file path to the associated PDF file
        const filePath = path.join(__dirname, "../uploads/img", fileName);

        // Check if the file exists before attempting to delete
        if (fs.existsSync(filePath)) {
          // Delete the file synchronously
          fs.unlinkSync(filePath);
        }
      }

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting Advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Advertisement.deleteMany({
        _id: { $in: BulkAdvertisementID },
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

// --- get advertisement ---
exports.advertisementList = async (req, res) => {
  try {
    const adData = await Advertisement.find({ Status: "A" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: adData.length,
      Values: adData.length <= 0 ? null : adData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
