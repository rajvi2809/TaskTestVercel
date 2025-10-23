const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

// Get user's cart with items
const getCart = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Only customers can have carts, not admins
    if (req.user.type === "admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot access cart functionality" });
    }

    const userId = req.user.id;
    console.log("Fetching cart for user:", userId, "type:", req.user.type);

    const cart = await Cart.getCartWithItems(userId);
    console.log("Cart fetched:", cart ? "found" : "null");

    if (!cart) {
      return res.json({ cart: null, items: [] });
    }

    res.json({
      cart: {
        id: cart.id,
        userId: cart.user_id,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at,
      },
      items: cart.items,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch cart", error: error.message });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    // Only customers can have carts, not admins
    if (req.user.type === "admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot access cart functionality" });
    }

    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Get or create cart
    const cart = await Cart.findOrCreateByUserId(userId);

    // Add item to cart
    const cartItem = await CartItem.addToCart(cart.id, productId, quantity);

    res.json({
      message: "Item added to cart",
      cartItem: {
        id: cartItem.id,
        productId: cartItem.product_id,
        quantity: cartItem.quantity,
        addedAt: cartItem.added_at,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          sku: product.sku,
          category: product.category,
        },
      },
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Failed to add item to cart" });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    // Verify cart item belongs to user
    const cart = await Cart.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = await CartItem.findById(id);
    if (!cartItem || cartItem.cart_id !== cart.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check product stock if increasing quantity
    if (quantity > cartItem.quantity) {
      const product = await Product.findById(cartItem.product_id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.stock < quantity) {
        const availableStock = typeof product.stock === "number" ? product.stock : 0;
        const stockMessage =
          availableStock > 0
            ? `Only ${availableStock} left in stock`
            : "Product is out of stock";
        return res.status(400).json({
          message: stockMessage,
          availableStock,
          cartItemId: cartItem.id,
        });
      }
    }

    const updatedItem = await CartItem.updateQuantity(id, quantity);

    if (!updatedItem || typeof updatedItem.quantity !== "number") {
      return res.json({
        message: "Cart item removed",
        cartItem: null,
      });
    }

    const product = await Product.findById(updatedItem.product_id);
    const productPayload = product
      ? {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          sku: product.sku,
          category: product.category,
          stock: product.stock,
        }
      : null;

    res.json({
      message: "Cart item updated",
      cartItem: {
        id: updatedItem.id,
        productId: updatedItem.product_id,
        quantity: updatedItem.quantity,
        addedAt: updatedItem.added_at,
        product: productPayload,
      },
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ message: "Failed to update cart item" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify cart item belongs to user
    const cart = await Cart.findByUserId(userId);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = await CartItem.findById(id);
    if (!cartItem || cartItem.cart_id !== cart.id) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await CartItem.remove(id);

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.clearCart(userId);
    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
