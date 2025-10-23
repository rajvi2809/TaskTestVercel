const { Pool } = require("pg");

let pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  global.pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });
}

pool = global.pool;
module.exports = pool;
