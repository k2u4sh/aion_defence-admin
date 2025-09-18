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

// PUT /api/admin/orders/[id]/status - Update order or payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const adminId = authCheck.admin?._id;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 401 }
      );
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { updatedBy: adminId };

    // Handle order status update
    if (body.status) {
      updateData.status = body.status;
      
      // Set timestamp based on status
      const now = new Date();
      switch (body.status) {
        case 'confirmed':
          updateData.confirmedAt = now;
          break;
        case 'shipped':
          updateData.shippedAt = now;
          break;
        case 'delivered':
          updateData.deliveredAt = now;
          break;
        case 'cancelled':
          updateData.cancelledAt = now;
          break;
      }
    }

    // Handle payment status update
    if (body.payment) {
      updateData.payment = {
        ...order.payment,
        ...body.payment
      };
      
      // Set payment timestamp
      if (body.payment.status === 'completed' && !order.payment.paidAt) {
        updateData.payment.paidAt = new Date();
      }
      if (body.payment.status === 'refunded' && !order.payment.refundedAt) {
        updateData.payment.refundedAt = new Date();
      }
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("buyer", "firstName lastName email phone companyName")
      .populate("items.product", "name sku basePrice images")
      .populate("items.seller", "firstName lastName companyName email")
      .populate("messages.from", "firstName lastName");

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder
    });

  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}