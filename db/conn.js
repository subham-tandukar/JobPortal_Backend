const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const connectDB = (DB) => {
  return mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = connectDB;
