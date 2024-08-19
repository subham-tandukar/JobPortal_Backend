const jwt = require("jsonwebtoken");

const authToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    // expiresIn: "1h",
    expiresIn: "30d", // Set token expiry to 30 days
  });
};

const generateToken = (res, data) => {
  // const expiryDate = new Date(Date.now() + 3600000); // 1 hour
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds

  res.cookie("th_token", authToken(data), {
    httpOnly: true,
    maxAge: expiryDate,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });
};

module.exports = { authToken, generateToken };
