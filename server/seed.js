// server/seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // adjust path if needed
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing users
  await User.deleteMany({});

  // Create sample users
  const users = [
    { username: "alice", password: "password123" },
    { username: "bob", password: "password123" },
  ];

  for (let u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ username: u.username, password: hashed });
  }

  console.log("Seeded users: alice, bob");
  await mongoose.disconnect();
}

run().catch(err => console.error(err));
