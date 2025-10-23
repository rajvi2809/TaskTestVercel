const pool = require("../config/database");

class OrderItem {
  static async create(orderId, productId, quantity, priceAtPurchase) {
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
      VALUES ($1, $2, $3, $4)
      RETURNING id, order_id, product_id, quantity, price_at_purchase
    `;
    const result = await pool.query(query, [
      orderId,
      productId,
      quantity,
      priceAtPurchase,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = "SELECT * FROM order_items WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = "SELECT * FROM order_items WHERE order_id = $1";
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async delete(id) {
    const query = "DELETE FROM order_items WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = OrderItem;
