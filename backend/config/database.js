const { Pool } = require("pg");
require("dotenv").config();

let pool;
if (!global.pool) {
  if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL environment variable is not defined");
  }
  global.pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  global.pool.on("error", (err) => {
    if (!process.env.POSTGRES_URL) {
      console.error("POSTGRES_URL environment variable is not defined");
    }
    console.error("Unexpected error on idle client", err);
  });
}

pool = global.pool;
module.exports = pool;
