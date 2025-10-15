import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get dynamic imports for models
    const User = (await import("@/models/userModel")).default;
    const Admin = (await import("@/models/adminModel")).default;
    const Product = (await import("@/models/productModel")).default;
    const Order = (await import("@/models/orderModel")).default;
    const Category = (await import("@/models/categoryModel")).default;
    const Tag = (await import("@/models/tagModel")).default;

    // Get current date and calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalTags,
      monthlyUsers,
      monthlyProducts,
      monthlyOrders,
      yearlyUsers,
      yearlyProducts,
      yearlyOrders
    ] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({ deletedAt: null }),
      Order.countDocuments({}),
      Category.countDocuments({}),
      Tag.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfYear } }),
      Product.countDocuments({ createdAt: { $gte: startOfYear }, deletedAt: null }),
      Order.countDocuments({ createdAt: { $gte: startOfYear } })
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Get previous period data for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);

    const [
      prevMonthUsers,
      prevMonthProducts,
      prevMonthOrders,
      prevYearUsers,
      prevYearProducts,
      prevYearOrders
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: startOfMonth } }),
      Product.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: startOfMonth }, deletedAt: null }),
      Order.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: prevYearStart, $lt: startOfYear } }),
      Product.countDocuments({ createdAt: { $gte: prevYearStart, $lt: startOfYear }, deletedAt: null }),
      Order.countDocuments({ createdAt: { $gte: prevYearStart, $lt: startOfYear } })
    ]);

    // Admin role distribution
    const adminRolesAgg = await Admin.aggregate([
      { $match: { deletedAt: { $in: [null, undefined] } } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    const adminRoleDistribution: Record<string, number> = {};
    adminRolesAgg.forEach((r: any) => { adminRoleDistribution[r._id || 'unknown'] = r.count; });

    const stats = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalTags
      },
      monthly: {
        users: {
          count: monthlyUsers,
          growth: calculateGrowth(monthlyUsers, prevMonthUsers)
        },
        products: {
          count: monthlyProducts,
          growth: calculateGrowth(monthlyProducts, prevMonthProducts)
        },
        orders: {
          count: monthlyOrders,
          growth: calculateGrowth(monthlyOrders, prevMonthOrders)
        }
      },
      yearly: {
        users: {
          count: yearlyUsers,
          growth: calculateGrowth(yearlyUsers, prevYearUsers)
        },
        products: {
          count: yearlyProducts,
          growth: calculateGrowth(yearlyProducts, prevYearProducts)
        },
        orders: {
          count: yearlyOrders,
          growth: calculateGrowth(yearlyOrders, prevYearOrders)
        }
      }
      ,
      admin: {
        roleDistribution: adminRoleDistribution
      }
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
