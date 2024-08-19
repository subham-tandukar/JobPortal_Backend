const express = require("express");
const router = new express.Router();

const adminUserControllers = require("../controllers/adminUserController");
const loginControllers = require("../controllers/loginController");
const jobControllers = require("../controllers/jobController");
const categoryControllers = require("../controllers/categoryController");
const jobTypeControllers = require("../controllers/jobTypeController");
const countControllers = require("../controllers/countController");
const blogControllers = require("../controllers/blogController");
const pageControllers = require("../controllers/pageController");
const applicationControllers = require("../controllers/applicationController");
const advertisementControllers = require("../controllers/advertisementController");
const { verifyToken } = require("../utils/VerifyToken");
const upload = require("../utils/MulterUpload");

// ==============================
router.post("/api/login", loginControllers.login);
router.get("/api/signOut", loginControllers.signOut);
router.post("/api/google", loginControllers.google);
router.post("/api/admin/user", adminUserControllers.user);
router.get("/api/admin/getUser", adminUserControllers.getUser);
router.post("/api/register", adminUserControllers.register);
router.get("/api/userInfo", verifyToken, adminUserControllers.userInfo);

router.post(
  "/api/admin/job",
  verifyToken,
  upload.single("ComLogo"),
  jobControllers.job
);
router.get("/api/jobList", jobControllers.jobList);
router.get("/api/jobList/:slug", jobControllers.singleJob);
router.get("/api/filterJob", jobControllers.filterJob);
router.get("/api/featuredJob", jobControllers.featuredJob);
router.get("/api/internJob", jobControllers.internJob);
router.get("/api/jobLocation/:location", jobControllers.locationJob);
router.get("/api/jobCategory/:category", jobControllers.categoryJob);

router.post("/api/admin/blog", upload.single("Image"), blogControllers.blog);
router.get("/api/blogList", blogControllers.blogList);
router.get("/api/blogList/:slug", blogControllers.singleBlog);

router.post("/api/admin/category", categoryControllers.category);
router.get("/api/categoryList", categoryControllers.categoryList);

router.post("/api/admin/jobType", jobTypeControllers.jobType);
router.get("/api/jobTypeList", jobTypeControllers.jobTypeList);

router.post("/api/admin/page", pageControllers.page);
router.get("/api/pageList", pageControllers.pageList);
router.get("/api/pageList/:slug", pageControllers.singlePage);

router.get("/api/location-count", countControllers.locationCount);

router.post(
  "/api/applyJob",
  verifyToken,
  upload.single("CV"),
  applicationControllers.applyJob
);

router.get("/api/appliedList", verifyToken, applicationControllers.appliedList);

router.get("/uploads/:filename", applicationControllers.viewPdf);

router.get(
  "/api/admin/applicationList",
  verifyToken,
  applicationControllers.applicationList
);

router.get(
  "/api/admin/singleApplication/:jobId",
  verifyToken,
  applicationControllers.singleApplication
);

router.post(
  "/api/admin/application",
  verifyToken,
  applicationControllers.application
);

router.get("/api/admin/dashboardCount", countControllers.dashboardCount);

//
router.post(
  "/api/admin/advertisement",
  upload.single("Image"),
  advertisementControllers.advertisement
);
router.get(
  "/api/advertisementList",
  advertisementControllers.advertisementList
);

// -------------------------------

module.exports = router;
