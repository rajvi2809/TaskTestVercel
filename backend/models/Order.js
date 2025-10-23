const pool = require("../config/database");

class Order {
  static async create(userId, total, additionalData = {}) {
    const status = additionalData.status || "completed";

    const query = `
      INSERT INTO orders (user_id, total, status, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, user_id, total, status, created_at
    `;
    const result = await pool.query(query, [userId, total, status]);
    const row = result.rows[0];
    const createdAtIso = row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString();

    return {
      id: row.id,
      user_id: row.user_id,
      total: row.total,
      status: row.status,
      shipping_address: null,
      subtotal: null,
      tax: null,
      shipping: null,
      created_at: createdAtIso,
    };
  }

  static async findById(id) {
    // Get order with items
    const orderQuery = `
      SELECT o.*,
        CASE
          WHEN COUNT(oi.id) = 0 THEN '[]'::json
          ELSE json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'quantity', oi.quantity,
            'priceAtPurchase', oi.price_at_purchase
          ))
        END as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, o.user_id, o.total, o.status, o.shipping_address, o.subtotal, o.tax, o.shipping, o.created_at
    `;

    const result = await pool.query(orderQuery, [id]);
    const order = result.rows[0];

    if (!order) return null;

    // Get product details from MongoDB for each item
    const Product = require("./Product");
    const itemsWithProducts = [];

    for (const item of order.items) {
      try {
        const product = await Product.findById(item.productId);
        itemsWithProducts.push({
          ...item,
          product: product,
        });
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        itemsWithProducts.push({
          ...item,
          product: null,
        });
      }
    }

    const normalizeItems = (rawItems) => {
      if (!rawItems) return [];
      const itemsArray = Array.isArray(rawItems)
        ? rawItems
        : typeof rawItems === "string"
        ? JSON.parse(rawItems)
        : rawItems.items || [];

      return itemsArray.map((item) => {
        const productId = item.productId ?? item.product_id;
        const priceAtPurchase =
          item.priceAtPurchase ?? item.price_at_purchase ?? 0;

        return {
          id: item.id,
          productId,
          product_id: productId,
          quantity: Number(item.quantity) || 0,
          priceAtPurchase: Number(priceAtPurchase) || 0,
          product: item.product || null,
        };
      });
    };

    const normalizedItems = normalizeItems(order.items).map((item, index) => {
      const product = itemsWithProducts[index]?.product || item.product || null;
      return {
        ...item,
        product,
      };
    });

    return {
      id: order.id,
      userId: order.user_id,
      total: Number(order.total) || 0,
      status: order.status || "completed",
      createdAt: order.created_at ? new Date(order.created_at).toISOString() : null,
      shippingAddress: order.shipping_address,
      items: normalizedItems,
    };
  }

  static async findByUserId(userId) {
    const query = `
      SELECT o.*,
        CASE
          WHEN COUNT(oi.id) = 0 THEN '[]'::json
          ELSE json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase))
        END as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.user_id, o.total, o.status, o.created_at
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    const rows = result.rows || [];

    return rows.map((row) => {
      const itemsRaw = row.items;
      let parsedItems = [];

      if (Array.isArray(itemsRaw)) {
        parsedItems = itemsRaw;
      } else if (typeof itemsRaw === "string") {
        try {
          parsedItems = JSON.parse(itemsRaw);
        } catch (error) {
          parsedItems = [];
        }
      }

      const normalizedItems = parsedItems.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: Number(item.price_at_purchase),
      }));

      return {
        id: row.id,
        userId: row.user_id,
        total: Number(row.total),
        status: row.status || "completed",
        createdAt: row.created_at
          ? new Date(row.created_at).toISOString()
          : null,
        items: normalizedItems,
      };
    });
  }

  static async getAll() {
    const query = `
      SELECT o.*,
        CASE
          WHEN COUNT(oi.id) = 0 THEN '[]'::json
          ELSE json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price_at_purchase', oi.price_at_purchase
            )
          )
        END as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.user_id, o.total, o.status, o.created_at
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query);
    const rows = result.rows || [];

    return rows.map((row) => {
      const itemsRaw = row.items;
      let parsedItems = [];

      if (Array.isArray(itemsRaw)) {
        parsedItems = itemsRaw;
      } else if (typeof itemsRaw === "string") {
        try {
          parsedItems = JSON.parse(itemsRaw);
        } catch (error) {
          parsedItems = [];
        }
      }

      const normalizedItems = parsedItems.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: Number(item.price_at_purchase),
      }));

      const createdAtIso = row.created_at
        ? new Date(row.created_at).toISOString()
        : null;
      const updatedAtIso = row.updated_at
        ? new Date(row.updated_at).toISOString()
        : createdAtIso;

      return {
        id: row.id,
        userId: row.user_id,
        total: Number(row.total),
        status: row.status || "completed",
        createdAt: createdAtIso,
        updatedAt: updatedAtIso,
        items: normalizedItems,
      };
    });
  }

  static async getDailyRevenue() {
    const query = `
      SELECT DATE(o.created_at) as date, SUM(o.total) as revenue
      FROM orders o
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getTopCustomers() {
    const query = `
      SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Order;
