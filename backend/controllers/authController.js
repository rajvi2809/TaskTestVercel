const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const { validationResult } = require("express-validator");

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const passwordHash = await User.hashPassword(password);
    const newUser = await User.create(name, email, passwordHash, "customer");

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // First try to find user in PostgreSQL (both customers and admins)
    let account = await User.findByEmail(email);
    let accountType = "user";

    // If not found in PostgreSQL users, try MongoDB admins (if connected)
    if (!account) {
      try {
        account = await Admin.findOne({ email }).exec();
        accountType = "mongo_admin";
      } catch (mongoError) {
        console.log(
          "MongoDB not available for admin login:",
          mongoError.message
        );
        // Continue without MongoDB admin check
      }
    }

    if (!account) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    let isPasswordValid = false;
    if (accountType === "user") {
      isPasswordValid = await User.verifyPassword(
        account.password_hash,
        password
      );
    } else {
      isPasswordValid = await account.verifyPassword(password);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create JWT token
    let tokenPayload;
    let userInfo;

    if (accountType === "user") {
      tokenPayload = {
        id: account.id,
        email: account.email,
        role: account.role,
        type: "user",
      };
      userInfo = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        type: "user",
      };
    } else {
      tokenPayload = {
        id: account._id.toString(),
        email: account.email,
        role: account.role,
        type: "mongo_admin",
      };
      userInfo = {
        id: account._id.toString(),
        name: account.name,
        email: account.email,
        role: account.role,
        type: "mongo_admin",
      };
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: userInfo,
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful" });
};

const getCurrentUser = async (req, res) => {
  try {
    let user;
    if (req.user.type === "mongo_admin") {
      // Fetch from MongoDB
      user = await Admin.findById(req.user.id);
      if (user) {
        user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          type: "mongo_admin",
          createdAt: user.createdAt,
        };
      }
    } else {
      // Fetch from PostgreSQL
      user = await User.findById(req.user.id);
      if (user) {
        user.type = "user";
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = { register, login, logout, getCurrentUser };
