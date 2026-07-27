const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";

  console.error(`[${req.method} ${req.originalUrl}]`, err);

  const respond = (statusCode, message) =>
    res.status(statusCode).json({
      success: false,
      message,
      ...(!isProd && { stack: err.stack }),
    });

  
  if (err.statusCode) {
    return respond(err.statusCode, err.message || "Request failed");
  }


  if (err.name === "CastError") {
    return respond(400, "Invalid ID format");
  }


  if (err.name === "ValidationError") {
    return respond(400, "Validation failed");
  }


  if (err.code === 11000) {
    return respond(409, "A record with these details already exists");
  }


  if (err.name === "MulterError") {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return respond(statusCode, err.message || "File upload failed");
  }


  return respond(500, isProd ? "Internal Server Error" : err.message || "Internal Server Error");
};

module.exports = errorHandler;

