import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";
import Order from "@/models/orderModel";
import Review from "@/models/reviewModel";
import Product from "@/models/productModel";

// GET /api/admin/users/[id]/stats - Sales and rating stats for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();
    const { id } = await params;

    // Total sales as seller (sum of item totalPrice where item.seller == userId and order delivered/complete)
    const deliveredStatuses = ['delivered', 'complete'];
    const salesAgg = await Order.aggregate([
      { $match: { status: { $in: deliveredStatuses } } },
      { $unwind: "$items" },
      { $match: { "items.seller": (global as any).mongoose?.Types?.ObjectId ? (global as any).mongoose.Types.ObjectId.createFromHexString(id) : require('mongoose').Types.ObjectId.createFromHexString(id) } },
      { $group: { _id: null, totalSales: { $sum: "$items.totalPrice" }, numOrders: { $sum: 1 } } }
    ]);

    const totalSales = salesAgg?.[0]?.totalSales || 0;
    const numSalesItems = salesAgg?.[0]?.numOrders || 0;

    // Average rating given by user (product reviews only, approved)
    const ratingAgg = await Review.aggregate([
      { $match: { reviewer: require('mongoose').Types.ObjectId.createFromHexString(id), targetType: 'product', status: 'approved' } },
      { $group: { _id: null, averageRatingGiven: { $avg: "$rating" }, totalReviewsGiven: { $sum: 1 } } }
    ]);

    const averageRatingGiven = ratingAgg?.[0]?.averageRatingGiven || 0;
    const totalReviewsGiven = ratingAgg?.[0]?.totalReviewsGiven || 0;

    // Average product rating received for products sold by this user
    const products = await Product.find({ seller: id }, { _id: 1 }).lean();
    let averageRatingReceived = 0;
    let totalReviewsReceived = 0;
    if (products.length > 0) {
      const productIds = products.map((p: any) => p._id);
      const receivedAgg = await Review.aggregate([
        { $match: { targetType: 'product', targetId: { $in: productIds }, status: 'approved' } },
        { $group: { _id: null, averageRatingReceived: { $avg: "$rating" }, totalReviewsReceived: { $sum: 1 } } }
      ]);
      averageRatingReceived = receivedAgg?.[0]?.averageRatingReceived || 0;
      totalReviewsReceived = receivedAgg?.[0]?.totalReviewsReceived || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        numSalesItems,
        averageRatingGiven,
        totalReviewsGiven,
        averageRatingReceived,
        totalReviewsReceived
      }
    });
  } catch (error: any) {
    console.error("Error computing user stats:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to compute stats" },
      { status: 500 }
    );
  }
}


