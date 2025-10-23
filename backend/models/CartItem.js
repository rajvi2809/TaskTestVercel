const pool = require("../config/database");

class CartItem {
  static async addToCart(cartId, productId, quantity = 1) {
    // Check if item already exists in cart
    const existingItem = await this.findByCartAndProduct(cartId, productId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      return this.updateQuantity(existingItem.id, newQuantity);
    } else {
      // Add new item
      const query = `
        INSERT INTO cart_items (cart_id, product_id, quantity, added_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, cart_id, product_id, quantity, added_at
      `;
      const result = await pool.query(query, [cartId, productId, quantity]);
      return result.rows[0];
    }
  }

  static async updateQuantity(id, quantity) {
    if (quantity <= 0) {
      return this.remove(id);
    }

    const query = `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2
      RETURNING id, cart_id, product_id, quantity, added_at
    `;
    const result = await pool.query(query, [quantity, id]);
    return result.rows[0];
  }

  static async remove(id) {
    const query =
      "DELETE FROM cart_items WHERE id = $1 RETURNING id, cart_id, product_id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCartAndProduct(cartId, productId) {
    const query =
      "SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2";
    const result = await pool.query(query, [cartId, productId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = "SELECT * FROM cart_items WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCartId(cartId) {
    const query =
      "SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY added_at DESC";
    const result = await pool.query(query, [cartId]);
    return result.rows;
  }
}

module.exports = CartItem;
