const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectMongoDB = require("./config/mongodb");
const pool = require("./config/database");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");

const app = express();

// app.use(
//   cors({
//     origin:
//       process.env.NODE_ENV === "production"
//         ? // ["https://your-frontend-url.com"]
//           ["http://localhost:5173"]
//         : [
//             "http://localhost:3000",
//             "http://localhost:5173",
//             "http://localhost:5174",
//           ],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectMongoDB();

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Health check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "Server is running" });
// });

app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  const fs = require("fs");
  fs.appendFileSync("error.log", `${new Date().toISOString()}: ${err.stack}\n`);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
