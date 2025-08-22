import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getOrderModel = async () => (await import("@/models/orderModel")).default;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");

    await connectDB();
    const Order = await getOrderModel();
    const { id } = params;

    const body = await request.json();
    const { orderStatus, paymentStatus } = body;

    // Validate the order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return ApiResponseHandler.notFound("Order not found");
    }

    // Build update object
    const updateData: any = {};
    if (orderStatus) {
      // Validate order status
      const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validOrderStatuses.includes(orderStatus)) {
        return ApiResponseHandler.badRequest("Invalid order status");
      }
      updateData.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      // Validate payment status
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return ApiResponseHandler.badRequest("Invalid payment status");
      }
      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiResponseHandler.badRequest("No valid status to update");
    }

    // Add timestamp
    updateData.updatedAt = new Date();

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    return ApiResponseHandler.success("Order status updated successfully", {
      order: updatedOrder,
      updatedFields: Object.keys(updateData)
    });

  } catch (err) {
    console.error("Error updating order status:", err);
    return ApiResponseHandler.serverError("Failed to update order status");
  }
}
