const User = require("../models/adminUserSchema");
const bcrypt = require("bcrypt");
const { generateToken, authToken } = require("../utils/GenerateToken");

const MAX_LOGIN_ATTEMPTS = 10;
const BAN_DURATION = 60000; // 1 minute in milliseconds

// Validate email format
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return regex.test(email);
}

// Handle login logic
exports.login = async (req, res) => {
  const { Email, Password, Role } = req.body;

  try {
    // Check if both email and password are provided
    if (!Email || !Password) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Please fill the required fields",
      });
    }

    if (!isValidEmail(Email)) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Invalid email format",
      });
    }

    let user = await User.findOne({ Email });

    // Check if the user exists
    if (!user) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "User does not exist",
      });
    }

    // Check if the user is banned
    if (user.BannedUntil && user.BannedUntil > new Date()) {
      const remainingTime = Math.floor((user.BannedUntil - new Date()) / 1000); // Round down to remove decimal part
      return res.status(403).json({
        StatusCode: 403,
        Message: `User is banned. Please try again after ${remainingTime} seconds.`,
      });
    }

    // Check if password is correct
    const passwordCompare = await bcrypt.compare(Password, user.Password);
    if (!passwordCompare) {
      // Increment login attempts
      user.LoginAttempts = (user.LoginAttempts || 0) + 1;

      if (user.LoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Ban the user for a certain duration
        user.BannedUntil = new Date(Date.now() + BAN_DURATION);
        // Reset login attempts to default value after banning
        user.LoginAttempts = 0;
      }

      await user.save(); // Save the updated user document

      // Calculate remaining login attempts
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - user.LoginAttempts;
      // Check if there is only one remaining attempt left
      if (user.LoginAttempts === 0) {
        const remainingTime = Math.floor(
          (user.BannedUntil - new Date()) / 1000
        ); // Round down to remove decimal part
        return res.status(403).json({
          StatusCode: 403,
          Message: `User is banned. Please try again after ${remainingTime} seconds.`,
        });
      }

      return res.status(422).json({
        StatusCode: 422,
        Message: `Invalid credentials. ${remainingAttempts} ${
          remainingAttempts === 1 ? "attempt" : "attempts"
        } remaining.`,
      });
    }

    // Reset login attempts on successful login
    user.LoginAttempts = 0;
    user.LastLoggedIn = new Date();
    await user.save(); // Save the updated user document

    // Generate JWT token
    const data = {
      User: {
        Id: user._id,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
      },
    };
    generateToken(res, data);
    if (Role === user.Role) {
      res.status(200).json({
        StatusCode: 200,
        Message: "success",
        Token: authToken(data),
        Values: {
          Token: authToken(data),
          UserID: user._id,
          Name: user.Name,
          Email: user.Email,
          Role: user.Role,
        },
      });
    } else {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Invalid role for this user",
      });
    }
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// Google
exports.google = async (req, res, next) => {
  const { Email } = req.body;
  try {
    let user = await User.findOne({ Email });
    if (user) {
      generateToken(res, data);
      res.status(200).json({
        StatusCode: 200,
        Message: "success",
        Token: authToken(data),
      });
    } else {
      // Generate random password
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(generatedPassword, salt);

      const newUser = new User({
        Name: req.body.name,
        Email: req.body.email,
        Password: secPass,
        Profile: req.body.photoURL,
        Source: "GOOGLE",
      });
      newUser.LastLoggedIn = new Date();
      await newUser.save();

      const data = {
        User: {
          Id: newUser._id,
          Name: newUser.Name,
          Email: newUser.Email,
          Role: newUser.Role,
        },
      };

      generateToken(res, data);
      res.status(200).json({
        StatusCode: 200,
        Message: "success",
        Token: authToken(data),
        Values: {
          Token: authToken(data),
          UserID: user._id,
          Name: user.Name,
          Email: user.Email,
          Role: user.Role,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.signOut = async (req, res) => {
  res.clearCookie("th_token").status(200).json({
    StatusCode: 200,
    Message: "Success",
  });
};
