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

// GET /api/admin/orders - Get all orders with pagination and filters
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    const query: any = { deletedAt: null };
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "buyer.firstName": { $regex: search, $options: "i" } },
        { "buyer.lastName": { $regex: search, $options: "i" } },
        { "buyer.email": { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query["payment.status"] = paymentStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get orders with populated fields
    const orders = await Order.find(query)
      .populate("buyer", "firstName lastName email phone companyName")
      .populate("items.product", "name sku basePrice images")
      .populate("items.seller", "firstName lastName companyName email")
      .populate("messages.from", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform orders to match frontend interface
    const transformedOrders = orders.map((order: any) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      buyer: {
        _id: order.buyer?._id || '',
        firstName: order.buyer?.firstName || '',
        lastName: order.buyer?.lastName || '',
        email: order.buyer?.email || '',
        phone: order.buyer?.phone || '',
        companyName: order.buyer?.companyName || ''
      },
      items: (order.items || []).map((item: any) => ({
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
      subtotal: order.subtotal || 0,
      taxAmount: order.taxAmount || 0,
      shippingCost: order.shippingCost || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount || 0,
      shippingAddress: order.shippingAddress || {},
      billingAddress: order.billingAddress || {},
      payment: order.payment || {},
      status: order.status || 'pending',
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      messages: (order.messages || []).map((msg: any) => ({
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
      subscription: order.subscription,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get total count
    const total = await Order.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders - Create a new order
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const adminId = authCheck.admin?._id;
    if (!adminId) return NextResponse.json(
      { success: false, message: "Admin not found" },
      { status: 401 }
    );

    // Create order with admin as creator
    const orderData = {
      ...body,
      createdBy: adminId,
      updatedBy: adminId
    };

    const order = new Order(orderData);
    await order.save();

    // Populate the created order
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name sku price image");

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating order:", error);
    
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
