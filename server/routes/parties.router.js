const express = require("express");
const {
  getHotTopicParties,
  getUpcomingParties,
  getAllParties,
  searchParties,
  toggleLike,
  getEventDetails,
  createParty,
  getAdminStatistics,
  getAdminParties,
  getAdminMetrics,
} = require("../controllers/parties.controller");
const { requireAdmin } = require("../middleware/auth.middleware");

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

// Get guest list for a party (Admin only)
router.get("/parties/:id/guests", requireAdmin, require("../controllers/guests.controller").getPartyGuests);

// New: Guests summary endpoint (Admin only)
router.get("/parties/:id/guests/summary", requireAdmin, require("../controllers/guests.controller").getGuestsSummary);

// Create new party (Admin only) - temporarily disabled auth for testing
router.post("/newParty", requireAdmin, createParty);
// Alias route for consistency with frontend naming
router.post("/create-party", requireAdmin, createParty);

// Get admin statistics (Admin only)
router.post("/admin/statistics", requireAdmin, getAdminStatistics);

// Get admin parties (Admin only)
router.post("/admin/parties", requireAdmin, getAdminParties);

// Get admin metrics (Admin only)
router.post("/admin/metrics", requireAdmin, getAdminMetrics);

module.exports = router;
