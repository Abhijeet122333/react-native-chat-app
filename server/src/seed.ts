import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load .env variables (like MONGO_URL)
dotenv.config();

// --- Example User schema ---
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

async function runSeed() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("✅ Connected to MongoDB");

    // 2. Clear existing users (optional)
    await User.deleteMany({});
    console.log("🧹 Old users removed");

    // 3. Add new users
    const hashedPassword = await bcrypt.hash("123456", 10);


    await User.insertMany([
      { username: "Alice", email: "alice@example.com", password: hashedPassword },
      { username: "Bob", email: "bob@example.com", password: hashedPassword },
      { username: "Charlie", email: "charlie@example.com", password: hashedPassword },
    ]);

    console.log("🌱 Seed data inserted successfully");

    // 4. Close DB connection
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

runSeed();
