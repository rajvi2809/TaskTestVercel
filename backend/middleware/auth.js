const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (!req.user.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const authorizeAdminOrSelf = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};

module.exports = { authenticateToken, authorizeAdmin, authorizeAdminOrSelf };
