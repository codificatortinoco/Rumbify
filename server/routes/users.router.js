const express = require("express");
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  getUserProfile,
  loginUser
} = require("../controllers/users.controller");
const router = express.Router();

router.get("/users", getUsers);

router.post("/users", createUser);

router.post("/users/login", loginUser);

router.patch("/users/:id", updateUser);

router.delete("/users/:id", deleteUser);

router.get("/users/:id/profile", getUserProfile);

module.exports = router;
