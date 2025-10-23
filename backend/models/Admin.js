const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

adminSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

adminSchema.methods.verifyPassword = async function (plainPassword) {
  return bcryptjs.compare(plainPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
