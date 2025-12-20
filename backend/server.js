const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load environment variables
dotenv.config({ path: "./config/env/config.env" });

// Import routes
const authRoutes = require("./routers/auth");
const userRoutes = require("./routers/user");
const accountRoutes = require("./routers/account");
const transactionRoutes = require("./routers/transaction");
const billRoutes = require("./routers/bill");
const exchangeRoutes = require("./routers/exchange");
const smartRoutes = require("./routers/smart");
const chatbotRoutes = require("./routers/chatbot");
const adminRoutes = require("./routers/admin");

// Import error handler
const errorHandler = require("./helpers/error/errorHandler");

// Initialize Express app
const app = express();

// CORS Configuration - Allow frontend origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  process.env.FRONTEND_URL, // Set this to your Vercel frontend URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/smart", smartRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", adminRoutes);

// Alias routes for frontend compatibility
app.use("/api/accounts", accountRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

module.exports = app;
