const express = require("express");
const router = express.Router();
const multer = require("multer");
const bcrypt = require('bcryptjs'); // যদি bcrypt সমস্যা করে
const User = require("../models/User"); // ✅ আপনার User model

// Multer config for profile picture
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage });

// Middleware for authentication (example JWT)
const authMiddleware = require("../middleware/auth");

// ✅ Get profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// ✅ Update profile
router.put("/", authMiddleware, upload.single("profilePic"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address, password } = req.body;

    const updateData = { name, email, phone, address };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.profilePic = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
