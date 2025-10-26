const express = require("express");
const multer = require("multer");
const {
  createUser,
  getUsers,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserProfile,
  loginUser,
  testSupabaseConnection,
  uploadProfileImage
} = require("../controllers/users.controller");
const { requireMember, requireAdmin } = require("../middleware/auth.middleware");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.get("/users", getUsers);

router.post("/users", createUser);

router.post("/users/login", requireMember, loginUser);

router.patch("/users/:id", updateUser);

router.put("/users/:id", updateUserProfile);

router.delete("/users/:id", deleteUser);

router.get("/users/:id/profile", getUserProfile);

// Upload profile image endpoints
router.post("/users/:id/profile-image", requireMember, upload.single('profile_image'), uploadProfileImage);
router.post("/users/:id/admin/profile-image", requireAdmin, upload.single('profile_image'), uploadProfileImage);

// Test Supabase connection endpoint
router.get("/test-supabase", testSupabaseConnection);

module.exports = router;
