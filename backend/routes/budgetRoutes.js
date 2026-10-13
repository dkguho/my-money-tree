const express = require("express");
const router = express.Router();
const { getBudget, updateBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getBudget);
router.put("/", protect, updateBudget);

module.exports = router;