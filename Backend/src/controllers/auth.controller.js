const userModel = require("../models/user.model");
const tokenBlacklistModel = require("../models/tokenBlacklist.model");
const emailServices = require("../services/email.service");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    // 1. Extract fields from request body
    const { name, email, password } = req.body;

    // 2. Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // 3. Check if user with this email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered" });
    }

    // 4. Create new user (password hashing handled by pre-save hook)
    const user = await userModel.create({ name, email, password });

    // 5. Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "4d",
    });

    // 6. Set token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
    });

    // 7. Send success response (exclude password)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    await emailServices.sendRegistrationEmail(user.email, user.name);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    // 1. Extract email & password
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find user by email (explicitly select password since it's excluded by default)
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Compare passwords using the model method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "4d",
    });

    // 5. Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
    });

    // 6. Send response
    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logoutUser = async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(200).json({ message: "Logout successful" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  await tokenBlacklistModel.create({ token });
  res.clearCookie("token");

  res.status(200).json({ message: "Logout successful" });
};


module.exports = { registerUser, loginUser, logoutUser };