require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/health", healthRoutes);

app.use(errorHandler);

module.exports = app;

//app.js tells the server to get req from the client, reading json req, use routes, taking care of errors.