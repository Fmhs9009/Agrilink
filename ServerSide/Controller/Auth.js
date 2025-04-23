const OTP = require("../Model/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const User = require("../Model/User")
const Otp=OTP;
const ErrorHandler = require('../utils/errorHandler');
const { AUTH_CONFIG, STATUS_CODES } = require('../config/constants');
const { sendEmail } = require('../utils/emailService');

// Export the Signup function as a route handler
exports.Signup = async (req, res) => {
  try {
    const { 
      Name, 
      email, 
      password, 
      accountType, 
      otp, 
      farmName, 
      FarmLocation, 
      contactNumber,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    console.log("Signup request received with data:", {
      Name, 
      email,
      accountType,
      farmName,
      FarmLocation,
      contactNumber,
      hasAccountNumber: !!accountNumber,
      hasIfscCode: !!ifscCode,
      hasUpiId: !!upiId
    });

    // Basic validation
    if (!Name || !email || !password || !accountType || !otp) {
      return res.status(400).json({
        success: false,
        Message: "All fields are required",
      });
    }

    // Additional validation for farmers
    if (accountType === "farmer") {
      if (!farmName || !FarmLocation) {
        return res.status(400).json({
          success: false,
          Message: "Please provide all the required fields for farmers",
        });
      }
      
      // Validate bank details for farmers - at least one payment method must be provided
      const hasUpi = !!upiId;
      const hasBankAccount = !!(accountNumber && ifscCode);
      
      if (!hasUpi && !hasBankAccount) {
        return res.status(400).json({
          success: false,
          Message: "Please provide either UPI ID or Bank Account details",
        });
      }
    }

    // Check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(403).json({
        success: false,
        Message: "User already exists. Please log in.",
      });
    }

    // Verify OTP
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        Message: "Invalid OTP",
      });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create user data object
    const userDataObj = {
      Name,
      email,
      password: hashPassword,
      contactNumber,
      accountType,
      image: null,
      farmName: accountType === "farmer" ? farmName : null,
      FarmLocation: FarmLocation || null,
    };
    
    // Add bank details for farmers
    if (accountType === "farmer") {
      if (upiId) {
        userDataObj.upiId = upiId;
      }
      if (accountNumber) {
        userDataObj.accountNumber = accountNumber;
      }
      if (ifscCode) {
        userDataObj.ifscCode = ifscCode;
      }
    }

    console.log("Creating user with data:", userDataObj);

    // Create a new user
    const userData = await User.create(userDataObj);

    // Generate JWT token for the new user
    const payload = {
      email: userData.email,
      id: userData._id,
      accountType: userData.accountType,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    // Remove password from response
    userData.password = undefined;

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Return success response with token and user data
    return res.cookie("token", token, options).status(201).json({
      success: true,
      Message: "User successfully registered",
      token: token,
      user: userData,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

exports.verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        Message: "Both email and OTP are required",
      });
    }

    // Find the most recent OTP for this email
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (response.length === 0) {
      return res.status(400).json({
        success: false,
        Message: "OTP not found. Please request a new one.",
      });
    }

    // Check if OTP matches
    if (otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        Message: "Invalid OTP",
      });
    }

    // Check if OTP is expired (10 minutes)
    const otpCreationTime = new Date(response[0].createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime - otpCreationTime) / (1000 * 60); // in minutes

    if (timeDifference > 10) {
      return res.status(400).json({
        success: false,
        Message: "OTP has expired. Please request a new one.",
      });
    }

    // OTP is valid
    return res.status(200).json({
      success: true,
      Message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      Message: "Something went wrong",
      status: false,
    });
  }
};

exports.Login = async (req, res) => {
  try {
      const { email, password } = req.body;
      if (!email || !password) {
          return res.status(400).json({
              success: false,
              message: "All fields are required",
          });
      }

      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found. Please register first.",
          });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({
              success: false,
              message: "Incorrect email or password",
          });
      }

      const payload = {
          email: user.email,
          id: user._id,
          accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "2h",
          
      });

      // user.token = token;
      user.password = undefined;

      const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true,
          secure: true,
          // secure: process.env.NODE_ENV === "production",
      };

      return res.cookie("token", token, options).status(200).json({
          success: true,
          message: "Login successful",
          user,
          token: token,
      });

  } catch (error) {
      return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message,
      });
  }
};

exports.sendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      const userexist = await User.findOne({ email });
      if (userexist) {
        return res.status(401).json({
          success: false,
          Message: "User Already Exist",
        });
      }
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      console.log("OTP Generated", otp);
  
      let result = await OTP.findOne({ otp: otp });
      while (result) {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        result = await OTP.findOne({ otp: otp });
      }
      let otpPayLoad = { email, otp };
      const otpBody = await OTP.create(otpPayLoad);
  
      res.status(200).json({
        success: true,
        Message: "Otp sent succesfully",
      });
    } catch (error) {
      res.status(501).json({
        success: false,
        Message: "Otp not  sent succesfully",
      });
    }
  };

  exports.changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Both current password and new password are required"
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Check if current password is correct
      const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Error changing password:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to change password",
        error: error.message
      });
    }
  };

exports.updateProfile = async (req, res) => {
  try {
    const { 
      Name, 
      contactNumber, 
      address, 
      city, 
      farmName, 
      FarmLocation, 
      accountNumber,
      ifscCode,
      upiId 
    } = req.body;
    
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields if provided
    const updateData = {};
    if (Name) updateData.Name = Name;
    if (contactNumber) updateData.contactNumber = contactNumber;
    
    // Update FarmLocation for both farmers and customers
    if (FarmLocation) updateData.FarmLocation = FarmLocation;
    
    // For farmers, also update farmName and bank details if provided
    if (user.accountType === 'farmer') {
      if (farmName) updateData.farmName = farmName;
      if (accountNumber) updateData.accountNumber = accountNumber;
      if (ifscCode) updateData.ifscCode = ifscCode;
      if (upiId) updateData.upiId = upiId;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.accountType },
    process.env.JWT_SECRET,
    { expiresIn: AUTH_CONFIG.JWT_EXPIRE }
  );
};

/**
 * Generate OTP
 * @returns {string} OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, accountType, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler('Email already registered', STATUS_CODES.BAD_REQUEST));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRE);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      accountType,
      phone,
      otp,
      otpExpiry
    });

    // Send verification email
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Your OTP for email verification is: ${otp}`
    });

    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 * @route POST /api/auth/verify-otp
 */
/*
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      otp,
      otpExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorHandler('Invalid or expired OTP', STATUS_CODES.BAD_REQUEST));
    }

    // Update user verification status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
*/

/**
 * Resend OTP
 * @route POST /api/auth/resend-otp
 */
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler('User not found', STATUS_CODES.NOT_FOUND));
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + AUTH_CONFIG.OTP_EXPIRE);

    // Update user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send email
    await sendEmail({
      email: user.email,
      subject: 'New OTP for Email Verification',
      message: `Your new OTP for email verification is: ${otp}`
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true
    });

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
/*
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {
      name: req.body.name,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};
*/

/**
 * Change password
 * @route PUT /api/auth/password
 */
/*
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return next(new ErrorHandler('Current password is incorrect', STATUS_CODES.BAD_REQUEST));
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, AUTH_CONFIG.SALT_ROUNDS);
    await user.save();

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
*/

/**
 * Get user by ID
 * @route GET /api/auth/user/:id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId).select('-password -otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message
    });
  }
};

// Request Password Reset function
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist"
      });
    }

    // Generate reset token without OTP
    const resetToken = jwt.sign(
      { email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store reset token with user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

    // Create email message with the reset link
    const message = `
      <h2>Password Reset Request</h2>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    try {
      // Send the reset email
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Link',
        message
      });
      console.log("Reset Link:",resetUrl)
      return res.status(200).json({
        success: true,
        message: "Password reset link sent to your email"
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Email could not be sent"
      });
    }
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Reset Password function
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Find user with token
    const user = await User.findOne({
      email: decoded.email,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};