const multer = require("multer");
const path = require("path");
const fs = require("fs");

// multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.mimetype.startsWith('image')) {
      uploadPath = path.join(__dirname, "../uploads/img");
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(__dirname, "../uploads/pdf");
    } else {
      // Handle other file types or reject them
      return cb(new Error('Unsupported file type'));
    }

    // Check if the destination folder exists, if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, "file_" + uniqueSuffix + "_" + file.originalname); // Generate unique filename
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Optional: limit file size (e.g., 5MB)
});

module.exports = upload;
