const category = require("../models/categorySchema");
const cloudinary = require("../cloudinary");

// ---- Category ----
exports.category = async (req, res) => {
  const { FLAG, CategoryID, Category, Status, BulkCategoryID } = req.body;

  try {
    if (FLAG === "I") {
      if (!Category) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      let unique = await category.findOne({ Category });
      if (unique) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This Category already exist",
        });
      }

      const categoryData = new category({
        Status,
        Category,
      });
      await categoryData.save();
      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error Creating Category",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Category) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      if (Category) {
        const existingcategory = await category.findOne({
          Category,
          _id: { $ne: CategoryID },
        });
        if (existingcategory) {
          return res.status(422).json({
            StatusCode: 422,
            Message: "This Category already exists",
          });
        }
      }

      let update;

      update = {
        Status,
        Category,
      };

      await category.findByIdAndUpdate(CategoryID, update, {
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
          Message: "Error updating category",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        let sortQuery = { createdAt: -1 };
        let query = {};
        if (Status) query.Status = Status;
        if (Category) query.Category = { $regex: Category, $options: "i" };

        const Page = parseInt(req.body.Page) || 1;
        const PageSize = parseInt(req.body.PageSize) || 10; // default page size is 10
        const skip = (Page - 1) * PageSize;

        let categoryData;

        categoryData = await category
          .find(query)
          .sort(sortQuery)
          .select("Category Status")
          .skip(skip)
          .limit(PageSize);

        const totalDocuments = await category.countDocuments(query);

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Pagination: {
            Page,
            PageSize,
            Total: totalDocuments, // Total number of documents in the collection
          },
          Count: categoryData.length,
          Values: categoryData.length <= 0 ? null : categoryData,
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
        let categoryData;

        // Check if Status is "-1" to retrieve all categories

        // Retrieve categories filtered by CategoryID and populate the Category field
        categoryData = await category
          .find({
            _id: CategoryID,
          })
          .select("Category Status")
          .sort({ createdAt: -1 });

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: categoryData.length,
          Values: categoryData.length <= 0 ? null : categoryData,
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
      await category.findByIdAndUpdate(CategoryID, update, {
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
          Message: "Error updating category status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteCategory = await category.findByIdAndDelete({
        _id: CategoryID,
      });

      if (!deleteCategory) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Category not found",
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
          Message: "Error deleting category",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await category.deleteMany({
        _id: { $in: BulkCategoryID },
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

exports.categoryList = async (req, res) => {
  try {
    const categorydata = await category
      .find({ Status: "A" })
      .select("Category Status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: categorydata.length,
      Values: categorydata.length <= 0 ? null : categorydata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
