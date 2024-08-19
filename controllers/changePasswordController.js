const User = require("../models/adminUserSchema");
const bcrypt = require("bcrypt");

// --- change password ---
exports.changePassword = async (req, res) => {
  const { Email, NewPassword, OldPassword } = req.body;
  try {
    // Find the user with the given email
    let user = await User.findOne({ Email: Email });

    // If user doesn't exist, send error response
    if (!user) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "User doesn't exist",
      });
    }

    // Check if old password is correct
    const isOldPasswordCorrect = await bcrypt.compare(
      OldPassword,
      user.Password
    );
    if (!isOldPasswordCorrect) {
      return res.status(401).json({ Message: "Incorrect old password" });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(NewPassword, 10);

    const isMatch = await bcrypt.compare(OldPassword, hashedPassword);
    if (isMatch) {
      return res.status(401).json({ Message: "Try a new password" });
    } else {
      // Update the user's password in the database
      user.Password = hashedPassword;
      await user.save();

      // Send response with success message
      res.status(201).json({
        StatusCode: 200,
        Message: "Password changed successfully",
      });
    }
  } catch (error) {
    // Send response with error message
    res.status(401).json({
      StatusCode: 400,
      Message: "Error updating password",
      error: error.Message,
    });
  }
};

// --- forget password ---
exports.forgetPassword = async (req, res) => {
  const { Email, NewPassword } = req.body;
  try {
    // Find the user with the given email
    let user = await User.findOne({ Email: Email });

    // If user doesn't exist, send error response
    if (!user) {
      return res.status(401).json({
        Message: "User doesn't exist",
      });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(NewPassword, 10);

    // Update the user's password in the database
    user.Password = hashedPassword;
    await user.save();

    // Send response with success message
    res.status(201).json({
      StatusCode: 200,
      Message: "Password changed successfully",
    });
  } catch (error) {
    // Send response with error message
    res.status(401).json({
      StatusCode: 400,
      Message: "Error updating password",
      error: error.Message,
    });
  }
};
