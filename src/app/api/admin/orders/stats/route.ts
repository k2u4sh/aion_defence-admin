import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getOrderModel = async () => (await import("@/models/orderModel")).default;

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");

    await connectDB();
    const Order = await getOrderModel();

    // Get date range for stats (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate pipeline for order statistics
    const stats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          orderStatusCounts: {
            $push: "$orderStatus"
          },
          paymentStatusCounts: {
            $push: "$paymentStatus"
          }
        }
      }
    ]);

    // Get counts for each order status
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts for each payment status
    const paymentStatusStats = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$paymentStatus",
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
      paidOrders: paymentStatusCounts.paid || 0,
      failedPayments: paymentStatusCounts.failed || 0,
      refundedPayments: paymentStatusCounts.refunded || 0,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    };

    return ApiResponseHandler.success("Order statistics fetched successfully", result);

  } catch (err) {
    console.error("Error fetching order statistics:", err);
    return ApiResponseHandler.serverError("Failed to fetch order statistics");
  }
}
