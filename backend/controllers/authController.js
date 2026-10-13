const User = require("../models/User");
const Budget = require("../models/Budget");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const defaultEnvelopes = [
  { id: "env_1", name: "Food", limit: 0 },
  { id: "env_2", name: "Transport", limit: 0 },
  { id: "env_3", name: "Shopping", limit: 0 },
  { id: "env_4", name: "Entertainment", limit: 0 },
  { id: "env_5", name: "Bills", limit: 0 },
];

const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = username?.trim().toLowerCase();

    if (!cleanUser || !password) {
      return res.status(400).json({ error: "Username and password required." });
    }

    const existing = await User.findOne({ username: cleanUser });
    if (existing) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: cleanUser,
      password: hashedPassword,
    });

    // Create starting budget document for the new user
    await Budget.create({
      username: cleanUser,
      income: 0,
      incomeDate: null,
      envs: defaultEnvelopes,
      exp: [],
      goals: [],
      wish: [],
    });

    const token = jwt.sign(
      { id: newUser._id, username: cleanUser },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({ token, username: cleanUser });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = username?.trim().toLowerCase();

    const user = await User.findOne({ username: cleanUser });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      { id: user._id, username: cleanUser },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({ token, username: cleanUser });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed." });
  }
};

module.exports = { register, login };