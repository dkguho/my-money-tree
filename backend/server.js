const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "https://my-money-tree-roan.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Explicitly respond to preflight OPTIONS requests across all routes
app.options("*", cors(corsOptions));

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Compass successfully!"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("GoalJar API is running perfectly!");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/budget", require("./routes/budgetRoutes"));
app.use("/api/plaid", require("./routes/plaidRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});