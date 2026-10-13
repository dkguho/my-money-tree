// backend/routes/plaidRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { 
  createLinkToken, 
  exchangePublicToken, 
  getBankBalance, 
  syncBankTransactions 
} = require("../controllers/plaidController");

// ALL routes now require the user to be logged in (protect middleware)
router.post("/create-link-token", protect, createLinkToken);
router.post("/exchange-public-token", protect, exchangePublicToken);

// NEW: Routes for Automatic Mode
router.get("/balance", protect, getBankBalance);
router.get("/sync", protect, syncBankTransactions);

module.exports = router;