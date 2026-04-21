import DKUser from "./userModel.js";
import { StatusCodes } from "http-status-codes";
import { comparePassword, hashpasword } from "../../utils/passwordUtils.js";
import { createJWT, verifyJWT } from "../../utils/tokenUtils.js";
import sendPasswordResetEmail from "../../utils/sendPasswordResetEmail.js";
import crypto from "crypto";
// Register First Admin 
export const registerUser = async (req, res) => {
    const userExists = await DKUser.findOne({ email: req.body.email });
    if (userExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "User already exists" });
    }

    const isFirstUser = (await DKUser.countDocuments() === 0);
    req.body.role = isFirstUser ? "admin" : "user";


    const hashedPassword = await hashpasword(req.body.password);
    req.body.password = hashedPassword;
    req.body.isVerified = true

    const user = await DKUser.create(req.body);
    res.status(StatusCodes.CREATED).json({ success: true, message: "User registered successfully", user });
};
// Login 
export const login = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "email and password fields are required" });
    }

    const user = await DKUser.findOne({ email: req.body.email });
    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "User not found" });
    }
    const isMatch = await comparePassword(req.body.password, user.password);
    if (!isMatch) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid password" });
    }
    const token = createJWT({ userId: user._id.toString(), role: user.role });
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 60 * 1000,
    });
    res.status(StatusCodes.OK).json({ success: true, message: "User logged in successfully", user });
}

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Both old and new passwords are required" });
    }

    // userId will usually come from decoded JWT (middleware)
    const userId = req.user.userId; 

    const user = await DKUser.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    // check old password
    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Old password is incorrect" });
    }

    // hash new password
    const hashedNewPassword = await hashpasword(newPassword);
    user.password = hashedNewPassword;

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await DKUser.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No user found with this email address"
      });
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiration (1 hour from now)
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    await user.save();

    // Get origin from request
    const origin = process.env.CLIENT_URL;

    // Send password reset email
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      passwordResetToken,
      origin,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset email sent successfully. Please check your email."
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token, email, and new password are required"
      });
    }

    // Find user with valid reset token
    const user = await DKUser.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired password reset token"
      });
    }

    // Hash new password
    const hashedPassword = await hashpasword(newPassword);
    
    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = "";
    user.passwordResetExpires = undefined;
    
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};
// Validate Reset Token (optional - for frontend validation)
export const validateResetToken = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token and email are required"
      });
    }

    const user = await DKUser.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Valid reset token"
    });

  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error"
    });
  }
};


export const logout = async (req, res) => {
    res.cookie("token", "logout", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000
    });
    res.status(StatusCodes.OK).json({
        success: true,
        message: "Logout successful"
    });
};

export const isUserLoggedIn = async (req, res) => {
  const token = req.cookies.token;
  console.log({token});
  if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Token required! Authentication failed"
      });
  }
  const decoded = verifyJWT(token);
  if (!decoded) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed! Redirecting to login..."
      });
  }
  const user = await DKUser.findById(decoded.userId);
  if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "User not found! Redirecting to login..."
      });
  }
  res.status(StatusCodes.OK).json({
      success: true,
      message: "User is logged in",
      user
  });
}