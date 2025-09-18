import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import Product from "@/models/productModel";
import { requireAdminAuth } from "@/utils/adminAccess";

// GET /api/admin/products/stats - Get product statistics
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

    // Get total products
    const totalProducts = await Product.countDocuments({ deletedAt: null });

    // Get active products
    const activeProducts = await Product.countDocuments({ 
      deletedAt: null, 
      status: 'active' 
    });

    // Get low stock products
    const lowStock = await Product.countDocuments({
      deletedAt: null,
      $expr: {
        $lt: ['$quantity', '$lowStockThreshold']
      }
    });

    // Get total value (sum of all products' basePrice * quantity)
    const totalValueResult = await Product.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$basePrice', '$quantity'] } }
        }
      }
    ]);

    const totalValue = totalValueResult.length > 0 ? totalValueResult[0].totalValue : 0;

    // Get recent products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProducts = await Product.countDocuments({
      deletedAt: null,
      createdAt: { $gte: thirtyDaysAgo }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStock,
        totalValue,
        recentProducts
      }
    });

  } catch (error) {
    console.error("Error fetching product stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch product statistics" },
      { status: 500 }
    );
  }
}
