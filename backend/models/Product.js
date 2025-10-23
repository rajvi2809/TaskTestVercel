const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  description: String,
  stock: { type: Number, default: 0 },
  image: String,
  updatedAt: { type: Date, default: Date.now, index: true },
});

productSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
