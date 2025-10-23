const express = require("express");
const { body } = require("express-validator");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategorySalesSummary,
} = require("../controllers/productController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();


router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/sales-summary", getCategorySalesSummary);
router.get("/:id", getProductById);


router.post(
  "/",
  authenticateToken,
  authorizeAdmin,
  [
    body("sku").trim().notEmpty().withMessage("SKU is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
  ],
  createProduct
);

router.put(
  "/:id",
  authenticateToken,
  authorizeAdmin,
  [
    body("sku").optional().trim(),
    body("name").optional().trim(),
    body("price").optional().isFloat({ min: 0 }),
    body("category").optional().trim(),
  ],
  updateProduct
);

router.delete("/:id", authenticateToken, authorizeAdmin, deleteProduct);

module.exports = router;
