import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Dynamic import for models
const getOrderModel = async () => {
  const orderModule = await import("@/models/orderModel");
  return orderModule.default;
};

// GET: Advanced analytics dashboard
async function getAnalytics(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Order = await getOrderModel();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Check if admin or seller
    const isAdmin = user.roles.includes('admin');
    const isSeller = user.roles.includes('seller');

    if (!isAdmin && !isSeller) {
      return ApiResponseHandler.error("Access denied. Admin or Seller role required", 403);
    }

    // Build base query
    const baseQuery = isAdmin ? {} : { 'items.seller': user.userId };

    // Revenue Analytics
    const revenueAnalytics = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Product Performance
    const productPerformance = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      ...(isSeller ? [{ $match: { 'items.seller': user.userId } }] : []),
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          averagePrice: { $avg: '$items.unitPrice' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          productImage: { $arrayElemAt: ['$product.images.url', 0] },
          sku: '$product.sku',
          totalSold: 1,
          totalRevenue: 1,
          averagePrice: 1,
          orderCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Customer Analytics (for admins)
    let customerAnalytics = null;
    if (isAdmin) {
      customerAnalytics = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$buyer',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        {
          $project: {
            customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
            customerEmail: '$customer.email',
            totalOrders: 1,
            totalSpent: 1,
            averageOrderValue: 1,
            lastOrderDate: 1
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]);
    }

    // Category Performance
    const categoryPerformance = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$items' },
      ...(isSeller ? [{ $match: { 'items.seller': user.userId } }] : []),
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Order Status Distribution
    const orderStatusDistribution = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Growth Metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period));

    const currentPeriodMetrics = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const previousPeriodMetrics = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $in: ['delivered', 'shipped'] },
          createdAt: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const current = currentPeriodMetrics[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
    const previous = previousPeriodMetrics[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };

    const growthMetrics = {
      revenueGrowth: previous.totalRevenue > 0 ? 
        ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue * 100).toFixed(2) : 0,
      orderGrowth: previous.totalOrders > 0 ? 
        ((current.totalOrders - previous.totalOrders) / previous.totalOrders * 100).toFixed(2) : 0,
      aovGrowth: previous.averageOrderValue > 0 ? 
        ((current.averageOrderValue - previous.averageOrderValue) / previous.averageOrderValue * 100).toFixed(2) : 0
    };

    return ApiResponseHandler.success({
      message: "Analytics retrieved successfully",
      success: true,
      data: {
        period: `${period} days`,
        overview: {
          totalRevenue: current.totalRevenue,
          totalOrders: current.totalOrders,
          averageOrderValue: current.averageOrderValue,
          growthMetrics
        },
        charts: {
          revenueAnalytics,
          productPerformance,
          categoryPerformance,
          orderStatusDistribution
        },
        ...(customerAnalytics && { customerAnalytics })
      }
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return ApiResponseHandler.error("Error fetching analytics", 500);
  }
}

export const GET = withAuth(getAnalytics);
