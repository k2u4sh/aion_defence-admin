#!/usr/bin/env node

import { seedOrders } from "../src/migrations/004_orders_seed.js";

console.log("🚀 Starting Order Management System Seeding...");
console.log("=" .repeat(50));

try {
  await seedOrders();
  console.log("=" .repeat(50));
  console.log("🎉 All seeding operations completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("=" .repeat(50));
  console.error("❌ Seeding failed with error:", error.message);
  process.exit(1);
}
