require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./routes/router");
const connectDB = require("./db/conn");
const cookieParser = require("cookie-parser");
const path = require("path");

var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
const port = process.env.PORT || 8009;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(router);

// Serve static files from the 'uploads' directory

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json("Server start 🚀");
});

const start = async () => {
  try {
    await connectDB(process.env.DATABASE);
    console.log("Connection start");
    app.listen(port, () => {
      console.log(`server is started at port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();