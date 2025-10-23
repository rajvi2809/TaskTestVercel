const express = require("express");
const { body } = require("express-validator");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();


router.use(authenticateToken);


router.get("/", getCart);


router.post(
  "/",
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive integer"),
  ],
  addToCart
);


router.put(
  "/items/:id",
  [
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
  ],
  updateCartItem
);


router.delete("/items/:id", removeFromCart);

// Clear entire cart
router.delete("/", clearCart);

module.exports = router;
