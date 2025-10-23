const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");


const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  try {
    let total = 0;
    const productsToUpdate = [];
    const productCache = new Map();

    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
      }

      total += product.price * item.quantity;
      productsToUpdate.push({
        productId: product._id,
        quantity: item.quantity,
      });
      productCache.set(product._id.toString(), product);
    }

    
    const order = await Order.create(userId, total);

    
    for (const item of items) {
      const productIdKey = item.productId?.toString();
      const cachedProduct =
        productCache.get(productIdKey) || (await Product.findById(item.productId));

      await OrderItem.create(
        order.id,
        item.productId,
        item.quantity,
        cachedProduct?.price || 0
      );
    }

    
    if (productsToUpdate.length > 0) {
      const bulkOps = productsToUpdate.map(({ productId, quantity }) => ({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { stock: -quantity }, $set: { updatedAt: new Date() } },
        },
      }));

      await Product.bulkWrite(bulkOps, { ordered: false });
    }

    res.status(201).json({
      message: "Order created successfully",
      order: { ...order, total: parseFloat(total.toFixed(2)) },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
};


const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.findByUserId(userId);
    res.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
};


const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.getAll();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


const getDailyRevenue = async (req, res) => {
  try {
    const revenue = await Order.getDailyRevenue();
    res.json({ dailyRevenue: revenue });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch revenue data" });
  }
};


const getTopCustomers = async (req, res) => {
  try {
    const customers = await Order.getTopCustomers();
    res.json({ topCustomers: customers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer data" });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getDailyRevenue,
  getTopCustomers,
};
