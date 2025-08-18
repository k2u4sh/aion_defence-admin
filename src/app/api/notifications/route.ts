import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Dynamic import for models
const getNotificationModel = async () => {
  const notificationModule = await import("@/models/notificationModel");
  return notificationModule.default;
};

// GET: Get user's notifications
async function getNotifications(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Notification = await getNotificationModel();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    // Build query
    const query: Record<string, unknown> = { recipient: user.userId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unreadCount = await (Notification as any).getUnreadCount(user.userId);

    return ApiResponseHandler.success({
      message: "Notifications retrieved successfully",
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return ApiResponseHandler.error("Error fetching notifications", 500);
  }
}

// POST: Create notification or perform actions
async function handleNotificationActions(request: NextRequest, user: JWTPayload) {
  try {
    await connectDB();
    const Notification = await getNotificationModel();

    const body = await request.json();
    const { action, notificationId, notificationIds } = body;

    switch (action) {
      case 'mark-read':
        if (notificationId) {
          const notification = await Notification.findOne({
            _id: notificationId,
            recipient: user.userId
          });
          if (notification) {
            await notification.markAsRead();
          }
        }
        break;

      case 'mark-all-read':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (Notification as any).markAllAsRead(user.userId);
        break;

      case 'archive':
        if (notificationId) {
          const notification = await Notification.findOne({
            _id: notificationId,
            recipient: user.userId
          });
          if (notification) {
            await notification.archive();
          }
        }
        break;

      case 'bulk-archive':
        if (notificationIds && Array.isArray(notificationIds)) {
          await Notification.updateMany(
            {
              _id: { $in: notificationIds },
              recipient: user.userId
            },
            { status: 'archived' }
          );
        }
        break;

      case 'delete':
        if (notificationId) {
          await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: user.userId
          });
        }
        break;

      default:
        return ApiResponseHandler.error("Invalid action", 400);
    }

    return ApiResponseHandler.success(null, "Action completed successfully");

  } catch (error) {
    console.error("Error handling notification action:", error);
    return ApiResponseHandler.error("Error handling notification action", 500);
  }
}

export const GET = withAuth(getNotifications);
export const POST = withAuth(handleNotificationActions);
