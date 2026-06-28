require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const treatmentRoutes = require("./routes/treatmentRoutes");
const labRoutes = require("./routes/labRoutes");
const messageRoutes = require("./routes/messageRoutes");
const symptomRoutes = require("./routes/symptomRoutes");
const documentRoutes = require("./routes/documentRoutes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/treatments", treatmentRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/documents", documentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

//app.js tells the server to get req from the client, reading json req, use routes, taking care of errors.