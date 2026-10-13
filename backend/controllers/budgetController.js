const Budget = require("../models/Budget");

// GET /api/budget (Scoped to the authenticated user)
const getBudget = async (req, res) => {
  try {
    const username = req.user.username;
    let budget = await Budget.findOne({ username });

    if (!budget) {
      budget = await Budget.create({
        username,
        income: 0,
        incomeDate: null,
        envs: [
          { id: "env_1", name: "Food", limit: 0 },
          { id: "env_2", name: "Transport", limit: 0 },
          { id: "env_3", name: "Shopping", limit: 0 },
          { id: "env_4", name: "Entertainment", limit: 0 },
          { id: "env_5", name: "Bills", limit: 0 },
        ],
        exp: [],
        goals: [],
        wish: [],
      });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error("Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
};

// PUT /api/budget (Saves changes for authenticated user)
const updateBudget = async (req, res) => {
  try {
    const username = req.user.username;
    const { income, incomeDate, envs, exp, goals, wish } = req.body;

    const updated = await Budget.findOneAndUpdate(
      { username },
      { income, incomeDate, envs, exp, goals, wish },
      { returnDocument: "after", upsert: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(500).json({ error: "Failed to update budget" });
  }
};

module.exports = { getBudget, updateBudget };