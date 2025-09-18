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

// GET /api/admin/orders/[id] - Get a specific order
export async function GET(
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

    // Get order with populated fields
    const order = await Order.findById(id)
      .populate("buyer", "firstName lastName email phone companyName")
      .populate("items.product", "name sku basePrice images")
      .populate("items.seller", "firstName lastName companyName email")
      .populate("messages.from", "firstName lastName")
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Transform order to match frontend interface
    const transformedOrder = {
      _id: (order as any)._id,
      orderNumber: (order as any).orderNumber,
      orderType: (order as any).orderType,
      buyer: {
        _id: (order as any).buyer?._id || '',
        firstName: (order as any).buyer?.firstName || '',
        lastName: (order as any).buyer?.lastName || '',
        email: (order as any).buyer?.email || '',
        phone: (order as any).buyer?.phone || '',
        companyName: (order as any).buyer?.companyName || ''
      },
      items: ((order as any).items || []).map((item: any) => ({
        _id: item._id || '',
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          sku: item.product.sku,
          images: item.product.images || []
        } : undefined,
        seller: item.seller ? {
          _id: item.seller._id,
          firstName: item.seller.firstName,
          lastName: item.seller.lastName,
          companyName: item.seller.companyName
        } : undefined,
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        variant: item.variant,
        productSnapshot: item.productSnapshot,
        itemType: item.itemType || 'product',
        subscriptionPlan: item.subscriptionPlan
      })),
      subtotal: (order as any).subtotal || 0,
      taxAmount: (order as any).taxAmount || 0,
      shippingCost: (order as any).shippingCost || 0,
      discount: (order as any).discount || 0,
      totalAmount: (order as any).totalAmount || 0,
      shippingAddress: (order as any).shippingAddress || {},
      billingAddress: (order as any).billingAddress || {},
      payment: (order as any).payment || {},
      status: (order as any).status || 'pending',
      trackingNumber: (order as any).trackingNumber,
      carrier: (order as any).carrier,
      confirmedAt: (order as any).confirmedAt,
      shippedAt: (order as any).shippedAt,
      deliveredAt: (order as any).deliveredAt,
      cancelledAt: (order as any).cancelledAt,
      customerNotes: (order as any).customerNotes,
      adminNotes: (order as any).adminNotes,
      messages: ((order as any).messages || []).map((msg: any) => ({
        _id: msg._id || '',
        from: {
          _id: msg.from?._id || '',
          firstName: msg.from?.firstName || '',
          lastName: msg.from?.lastName || ''
        },
        message: msg.message || '',
        timestamp: msg.timestamp || '',
        isFromBuyer: msg.isFromBuyer || false,
        isFromSeller: msg.isFromSeller || false,
        isFromAdmin: msg.isFromAdmin || false
      })),
      subscription: (order as any).subscription,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Update a specific order
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

    // Update order
    const order = await Order.findByIdAndUpdate(
      id,
      { ...body, updatedBy: adminId },
      { new: true, runValidators: true }
    )
      .populate("buyer", "firstName lastName email phone companyName")
      .populate("items.product", "name sku basePrice images")
      .populate("items.seller", "firstName lastName companyName email")
      .populate("messages.from", "firstName lastName");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: order
    });

  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/[id] - Delete a specific order
export async function DELETE(
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

    // Soft delete order
    const order = await Order.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
