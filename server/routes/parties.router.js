const express = require("express");
const {
  getHotTopicParties,
  getUpcomingParties,
  getAllParties,
  searchParties,
  toggleLike,
  getEventDetails,
  createParty,
} = require("../controllers/parties.controller");

const router = express.Router();

// Get hot topic parties
router.get("/parties/hot-topic", getHotTopicParties);

// Get upcoming parties
router.get("/parties/upcoming", getUpcomingParties);

// Get all parties
router.get("/parties", getAllParties);

// Search parties
router.get("/parties/search", searchParties);

// Toggle like status
router.patch("/parties/:id/like", toggleLike);

// Get event details
router.get("/parties/:id", getEventDetails);

// Create new party
router.post("/newParty", createParty);

module.exports = router;
