const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user is missing",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };

// checks if the user has the right role(if he is a patient he cant do oncologist role editing)