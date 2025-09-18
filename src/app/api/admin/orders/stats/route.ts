import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Order from "@/models/orderModel";
import User from "@/models/userModel";
import Product from "@/models/productModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  User;
  Product;
  Order;
};

export async function GET(request: NextRequest) {
  try {
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get date range for stats (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate pipeline for order statistics
    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          orderStatusCounts: {
            $push: "$status"
          },
          paymentStatusCounts: {
            $push: "$payment.status"
          }
        }
      }
    ]);

    // Get counts for each order status
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts for each payment status
    const paymentStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: "$payment.status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const orderStatusCounts: any = {};
    orderStatusStats.forEach((stat: any) => {
      orderStatusCounts[stat._id] = stat.count;
    });

    const paymentStatusCounts: any = {};
    paymentStatusStats.forEach((stat: any) => {
      paymentStatusCounts[stat._id] = stat.count;
    });

    const result = {
      totalOrders: stats[0]?.totalOrders || 0,
      totalRevenue: stats[0]?.totalRevenue || 0,
      pendingOrders: orderStatusCounts.pending || 0,
      confirmedOrders: orderStatusCounts.confirmed || 0,
      processingOrders: orderStatusCounts.processing || 0,
      shippedOrders: orderStatusCounts.shipped || 0,
      deliveredOrders: orderStatusCounts.delivered || 0,
      cancelledOrders: orderStatusCounts.cancelled || 0,
      pendingPayments: paymentStatusCounts.pending || 0,
      paidOrders: paymentStatusCounts.completed || 0,
      failedPayments: paymentStatusCounts.failed || 0,
      refundedPayments: paymentStatusCounts.refunded || 0,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      message: "Order statistics fetched successfully",
      data: result
    });

  } catch (err) {
    console.error("Error fetching order statistics:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order statistics" },
      { status: 500 }
    );
  }
}
