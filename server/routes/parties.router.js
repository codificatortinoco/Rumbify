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

// Get guest list for a party
router.get("/parties/:id/guests", require("../controllers/guests.controller").getPartyGuests);

// New: Guests summary endpoint
router.get("/parties/:id/guests/summary", require("../controllers/guests.controller").getGuestsSummary);

// Create new party
router.post("/newParty", createParty);

module.exports = router;
