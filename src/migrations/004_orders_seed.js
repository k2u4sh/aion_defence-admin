import { connectDB } from "../dbConfig/DatabaseManager.js";
import Order from "../models/orderModel.js";

const sampleOrders = [
  {
    orderNumber: "ORD-20241201-0001",
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
    customerPhone: "+1-555-0101",
    orderDate: new Date("2024-12-01T10:00:00Z"),
    totalAmount: 299.99,
    orderStatus: "pending",
    paymentStatus: "pending",
    paymentMethod: "Credit Card",
    shippingAddress: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439011", // Sample product ID
        productName: "Wireless Headphones",
        quantity: 1,
        price: 299.99
      }
    ],
    notes: "Please deliver before 5 PM",
    trackingNumber: null,
    estimatedDelivery: new Date("2024-12-05T17:00:00Z"),
    actualDelivery: null,
    adminNotes: null
  },
  {
    orderNumber: "ORD-20241201-0002",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.johnson@example.com",
    customerPhone: "+1-555-0102",
    orderDate: new Date("2024-12-01T11:30:00Z"),
    totalAmount: 149.50,
    orderStatus: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "PayPal",
    shippingAddress: {
      street: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439012",
        productName: "Smart Watch",
        quantity: 1,
        price: 149.50
      }
    ],
    notes: null,
    trackingNumber: "TRK123456789",
    estimatedDelivery: new Date("2024-12-04T17:00:00Z"),
    actualDelivery: null,
    adminNotes: "Customer requested express shipping"
  },
  {
    orderNumber: "ORD-20241201-0003",
    customerName: "Michael Brown",
    customerEmail: "michael.brown@example.com",
    customerPhone: "+1-555-0103",
    orderDate: new Date("2024-12-01T14:15:00Z"),
    totalAmount: 89.99,
    orderStatus: "processing",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    shippingAddress: {
      street: "789 Pine Street",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439013",
        productName: "Bluetooth Speaker",
        quantity: 1,
        price: 89.99
      }
    ],
    notes: null,
    trackingNumber: null,
    estimatedDelivery: new Date("2024-12-06T17:00:00Z"),
    actualDelivery: null,
    adminNotes: null
  },
  {
    orderNumber: "ORD-20241201-0004",
    customerName: "Emily Davis",
    customerEmail: "emily.davis@example.com",
    customerPhone: "+1-555-0104",
    orderDate: new Date("2024-12-01T16:45:00Z"),
    totalAmount: 199.99,
    orderStatus: "shipped",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    shippingAddress: {
      street: "321 Elm Street",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439014",
        productName: "Gaming Mouse",
        quantity: 1,
        price: 199.99
      }
    ],
    notes: "Fragile item - handle with care",
    trackingNumber: "TRK987654321",
    estimatedDelivery: new Date("2024-12-03T17:00:00Z"),
    actualDelivery: null,
    adminNotes: "Package insured for full value"
  },
  {
    orderNumber: "ORD-20241201-0005",
    customerName: "David Wilson",
    customerEmail: "david.wilson@example.com",
    customerPhone: "+1-555-0105",
    orderDate: new Date("2024-12-01T18:20:00Z"),
    totalAmount: 449.99,
    orderStatus: "delivered",
    paymentStatus: "paid",
    paymentMethod: "Bank Transfer",
    shippingAddress: {
      street: "654 Maple Drive",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439015",
        productName: "Laptop Stand",
        quantity: 1,
        price: 449.99
      }
    ],
    notes: null,
    trackingNumber: "TRK456789123",
    estimatedDelivery: new Date("2024-12-02T17:00:00Z"),
    actualDelivery: new Date("2024-12-02T14:30:00Z"),
    adminNotes: "Delivered early - customer satisfied"
  },
  {
    orderNumber: "ORD-20241201-0006",
    customerName: "Lisa Anderson",
    customerEmail: "lisa.anderson@example.com",
    customerPhone: "+1-555-0106",
    orderDate: new Date("2024-12-01T20:10:00Z"),
    totalAmount: 79.99,
    orderStatus: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "Credit Card",
    shippingAddress: {
      street: "987 Cedar Lane",
      city: "Denver",
      state: "CO",
      zipCode: "80201",
      country: "USA"
    },
    items: [
      {
        productId: "507f1f77bcf86cd799439016",
        productName: "Phone Case",
        quantity: 1,
        price: 79.99
      }
    ],
    notes: "Customer changed mind",
    trackingNumber: null,
    estimatedDelivery: null,
    actualDelivery: null,
    adminNotes: "Refund processed - customer requested cancellation"
  }
];

export async function seedOrders() {
  try {
    console.log("🌱 Starting orders seeding...");
    
    await connectDB();
    
    // Clear existing orders
    await Order.deleteMany({});
    console.log("🗑️  Cleared existing orders");
    
    // Insert sample orders
    const insertedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Successfully seeded ${insertedOrders.length} orders`);
    
    // Log some sample data
    console.log("📊 Sample order data:");
    insertedOrders.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.customerName} - $${order.totalAmount} (${order.orderStatus}/${order.paymentStatus})`);
    });
    
    console.log("🎉 Orders seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding orders:", error);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedOrders()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
