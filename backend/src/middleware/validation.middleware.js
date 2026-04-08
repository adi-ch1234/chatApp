import mongoose from "mongoose";

/**
 * Middleware to validate that a route parameter is a valid MongoDB ObjectId.
 * Usage: router.get("/:id", validateObjectId("id"), handler)
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ message: `Invalid ${paramName} format` });
    }
    next();
  };
};

/**
 * Strips MongoDB query operators ($gt, $ne, $in, etc.) from request body
 * to prevent NoSQL injection attacks.
 */
export const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
