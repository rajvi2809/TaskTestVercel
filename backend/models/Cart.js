const pool = require("../config/database");

class Cart {
  static async findOrCreateByUserId(userId) {
    
    let cart = await this.findByUserId(userId);

    if (!cart) {
      
      const query = `
        INSERT INTO carts (user_id, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        RETURNING id, user_id, created_at, updated_at
      `;
      const result = await pool.query(query, [userId]);
      cart = result.rows[0];
    }

    return cart;
  }

  static async findByUserId(userId) {
    const query = "SELECT * FROM carts WHERE user_id = $1";
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async getCartWithItems(userId) {
    try {
      const cart = await this.findOrCreateByUserId(userId);

      if (!cart) return null;

      
      const Product = require("./Product");
      const cartItemsResult = await pool.query(
        "SELECT * FROM cart_items WHERE cart_id = $1 ORDER BY added_at DESC",
        [cart.id]
      );

      const cartWithItems = {
        ...cart,
        items: [],
      };

      
      for (const item of cartItemsResult.rows) {
        try {
          const product = await Product.findById(item.product_id);
          if (product) {
            cartWithItems.items.push({
              id: item.id,
              productId: item.product_id,
              quantity: item.quantity,
              addedAt: item.added_at,
              product: {
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                sku: product.sku,
                category: product.category,
                stock: product.stock,
              },
            });
          } else {
            console.warn(`Product ${item.product_id} not found in MongoDB`);
            
            cartWithItems.items.push({
              id: item.id,
              productId: item.product_id,
              quantity: item.quantity,
              addedAt: item.added_at,
              product: null, 
            });
          }
        } catch (error) {
          console.error(
            `Error fetching product ${item.product_id}:`,
            error.message
          );
          
          cartWithItems.items.push({
            id: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            addedAt: item.added_at,
            product: null,
          });
        }
      }

      return cartWithItems;
    } catch (error) {
      console.error("Error in getCartWithItems:", error);
      throw error;
    }
  }

  static async clearCart(userId) {
    const cart = await this.findByUserId(userId);
    if (cart) {
      await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);
    }
    return true;
  }

  static async delete(id) {
    await pool.query("DELETE FROM carts WHERE id = $1", [id]);
    return true;
  }
}

module.exports = Cart;
