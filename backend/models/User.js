const pool = require("../config/database");
const bcryptjs = require("bcryptjs");

class User {
  static async create(name, email, passwordHash, role = "customer") {
    const query = `
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, role, created_at
    `;
    const result = await pool.query(query, [name, email, passwordHash, role]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query =
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll() {
    const query = "SELECT id, name, email, role, created_at FROM users";
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, name, email) {
    const query = `
      UPDATE users SET name = $1, email = $2 WHERE id = $3
      RETURNING id, name, email, role, created_at
    `;
    const result = await pool.query(query, [name, email, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = "DELETE FROM users WHERE id = $1 RETURNING id";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(passwordHash, plainPassword) {
    return bcryptjs.compare(plainPassword, passwordHash);
  }

  static async hashPassword(plainPassword) {
    return bcryptjs.hash(plainPassword, 10);
  }
}

module.exports = User;
