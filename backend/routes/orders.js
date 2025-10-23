const express = require("express");
const { body } = require("express-validator");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getDailyRevenue,
  getTopCustomers,
} = require("../controllers/orderController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

// Customer routes
router.post(
  "/",
  authenticateToken,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Cart must have at least one item"),
    body("items.*.productId").notEmpty(),
    body("items.*.quantity").isInt({ min: 1 }),
  ],
  createOrder
);

router.get("/my-orders", authenticateToken, getUserOrders);
router.get("/:id", authenticateToken, getOrderById);

// Admin routes
router.get("/", authenticateToken, authorizeAdmin, getAllOrders);
router.get(
  "/reports/daily-revenue",
  authenticateToken,
  authorizeAdmin,
  getDailyRevenue
);
router.get(
  "/reports/top-customers",
  authenticateToken,
  authorizeAdmin,
  getTopCustomers
);

module.exports = router;
