const page = require("../models/pageSchema");

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// ---- Page ----
exports.page = async (req, res) => {
  const { FLAG, PageID, Title, Description, BulkPageID } = req.body;

  try {
    if (FLAG === "I") {
      if (!Title || !Description) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      const slug = generateSlug(Title);

      let unique = await page.findOne({ Title });
      if (unique) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This Page already exist",
        });
      }

      const pageData = new page({
        Title,
        Description,
        Slug: slug,
      });
      await pageData.save();
      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error Creating Page",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Title || !Description) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      if (Title) {
        const existingData = await page.findOne({
          Title,
          _id: { $ne: PageID },
        });
        if (existingData) {
          return res.status(422).json({
            StatusCode: 422,
            Message: "This Page already exist",
          });
        }
      }
      const slug = generateSlug(Title);
      let update;

      update = {
        Title,
        Slug: slug,
        Description,
      };

      await page.findByIdAndUpdate(PageID, update, {
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
          Message: "Error updating page",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        let sortQuery = { createdAt: -1 };
        let query = {};
        if (Title) query.Title = { $regex: Title, $options: "i" };

        const Page = parseInt(req.body.Page) || 1;
        const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
        const skip = (Page - 1) * PageSize;

        let pageData;

        pageData = await page
          .find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(PageSize);

        const totalDocuments = await page.countDocuments(query);

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Pagination: {
            Page,
            PageSize,
            Total: totalDocuments, // Total number of documents in the collection
          },
          Count: pageData.length,
          Values: pageData.length <= 0 ? null : pageData,
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
        let pageData;

        // Check if Status is "-1" to retrieve all categories

        // Retrieve categories filtered by PageID and populate the Category field
        pageData = await page
          .find({
            _id: PageID,
          })
          .sort({ createdAt: -1 });

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: pageData.length,
          Values: pageData.length <= 0 ? null : pageData,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Internal Server Error",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deletePage = await page.findByIdAndDelete({
        _id: PageID,
      });

      if (!deletePage) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Page not found",
        });
      }

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting page",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await page.deleteMany({
        _id: { $in: BulkPageID },
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

exports.singlePage = async (req, res) => {
  try {
    const { slug } = req.params;

    const unique = await page.findOne({ Slug: slug });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Page doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const pagedata = await page.find({ Slug: slug }).sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: pagedata.length <= 0 ? null : pagedata[0],
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.pageList = async (req, res) => {
  try {
    const pagedata = await page.find().sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: pagedata.length,
      Values: pagedata.length <= 0 ? null : pagedata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
