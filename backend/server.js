/**
 * BonesDB v2 - Server Entry Point
 * Modernized: native MongoDB driver replaced with Mongoose
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const corsOptions = require("./config/corsOptions");

const port = process.env.PORT || 8000;

const app = express();

app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v2/donor", require("./routes/donorRoutes"));
app.use("/api/v2/user", require("./routes/userRoutes"));
app.use("/api/v2/auth", require("./routes/authRoutes"));
app.use("/api/v2/admin", require("./routes/adminRoutes"));

// Catch-all 404
app.all("*", (req, res) => {
  res.status(404).json({ error: "not found" });
});

app.use(errorHandler);

// Connect to MongoDB via Mongoose - no deprecated options needed in Mongoose 7+
mongoose
  .connect(process.env.BONES_DB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.stack);
    process.exit(1);
  });
