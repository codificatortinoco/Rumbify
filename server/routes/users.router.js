const express = require("express");
const {
  createUser,
  getUsers,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserProfile,
  loginUser
} = require("../controllers/users.controller");
const { requireMember } = require("../middleware/auth.middleware");
const router = express.Router();

router.get("/users", getUsers);

router.post("/users", createUser);

router.post("/users/login", requireMember, loginUser);

router.patch("/users/:id", updateUser);

router.put("/users/:id", updateUserProfile);

router.delete("/users/:id", deleteUser);

router.get("/users/:id/profile", getUserProfile);

module.exports = router;
