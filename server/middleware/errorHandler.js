const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";

  console.error(`[${req.method} ${req.originalUrl}]`, err);

  const respond = (statusCode, message) =>
    res.status(statusCode).json({
      success: false,
      message,
      ...(!isProd && { stack: err.stack }),
    });

  // Explicit app errors (controllers/middleware set .statusCode deliberately) — unchanged behavior
  if (err.statusCode) {
    return respond(err.statusCode, err.message || "Request failed");
  }

  // Mongoose invalid ObjectId cast (defense-in-depth alongside explicit isValidId guards)
  if (err.name === "CastError") {
    return respond(400, "Invalid ID format");
  }

  // Mongoose schema validation error that bypassed the Joi validate middleware
  if (err.name === "ValidationError") {
    return respond(400, "Validation failed");
  }

  // MongoDB duplicate key (race condition past the pre-emptive findOne checks)
  if (err.code === 11000) {
    return respond(409, "A record with these details already exists");
  }

  // Multer upload errors — file too large gets 413, everything else 400
  if (err.name === "MulterError") {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return respond(statusCode, err.message || "File upload failed");
  }

  // Truly unexpected — never leak Mongo/Mongoose/driver internals to the client
  return respond(500, isProd ? "Internal Server Error" : err.message || "Internal Server Error");
};

module.exports = errorHandler;

//for errors