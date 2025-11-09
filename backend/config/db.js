// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = "mongodb://127.0.0.1:27017/myDatabase"; // replace with your DB name

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // optional: faster timeout
    });

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;

