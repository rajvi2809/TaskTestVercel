const mongoose = require("mongoose");
require("dotenv").config();

const connectMongoDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    // Test the connection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));

  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Don't exit, just log the error
    const fs = require('fs');
    fs.appendFileSync('mongodb-error.log', `${new Date().toISOString()}: ${error.stack}\n`);
    console.log("Continuing without MongoDB connection...");
  }
};

module.exports = connectMongoDB;
