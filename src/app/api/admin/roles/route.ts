import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// GET /api/admin/roles - Get all roles
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

    // Define available roles
    const roles = [
      {
        name: "super_admin",
        displayName: "Super Administrator",
        description: "Full system access with all permissions",
        permissions: ["*"]
      },
      {
        name: "admin",
        displayName: "Administrator",
        description: "Full administrative access",
        permissions: ["admin:*"]
      },
      {
        name: "moderator",
        displayName: "Moderator",
        description: "Content moderation and user management",
        permissions: ["content:*", "user:read", "user:update"]
      },
      {
        name: "support",
        displayName: "Support",
        description: "Customer support and basic operations",
        permissions: ["user:read", "order:read", "order:update"]
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        roles
      }
    });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create a new role (if needed)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    // For now, roles are predefined
    return NextResponse.json(
      { success: false, message: "Roles are predefined and cannot be created" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create role" },
      { status: 500 }
    );
  }
}


