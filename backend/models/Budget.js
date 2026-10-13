// backend/models/Budget.js
const mongoose = require("mongoose");

const EnvelopeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  limit: { type: Number, default: 0 },
});

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  env: { type: String, required: true },
  amt: { type: Number, required: true },
  note: { type: String, default: "" },
  t: { type: Number, default: () => Date.now() },
});

const GoalSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  target: { type: Number, required: true },
  saved: { type: Number, default: 0 },
  updatedAt: { type: Number, default: () => Date.now() },
});

const WishSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  t: { type: Number, default: () => Date.now() },
});

// NEW: Schema for raw transactions fresh from the bank
const BankTxSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true },
  name: { type: String, required: true }, // e.g., "McDonalds"
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  pending: { type: Boolean, default: false }
});

const BudgetSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    income: { type: Number, default: 0 },
    incomeDate: { type: Number, default: null },
    envs: { type: [EnvelopeSchema], default: [] },
    exp: { type: [ExpenseSchema], default: [] },
    goals: { type: [GoalSchema], default: [] },
    wish: { type: [WishSchema], default: [] },
    
    // NEW: Automatic Mode & Plaid Integration Fields
    syncMode: { type: String, default: "manual", enum: ["manual", "auto"] },
    plaidAccessToken: { type: String, default: null },
    plaidAccountId: { type: String, default: null },
    plaidInstName: { type: String, default: null }, // e.g., "Chase Checking"
    plaidCursor: { type: String, default: null }, // Remembers where Plaid left off
    bankInbox: { type: [BankTxSchema], default: [] }, // The waiting room for new swipes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", BudgetSchema);