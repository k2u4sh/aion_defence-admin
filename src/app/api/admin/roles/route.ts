import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  require("@/models/roleModel");
};

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
    
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Get the Role model
    const Role = require("@/models/roleModel").default;

    // Get roles from database
    const roles = await Role.find({}).sort({ name: 1 }).lean();

    // If no roles exist, create default roles
    if (roles.length === 0) {
      const defaultRoles = [
        {
          key: "super_admin",
          name: "Super Administrator",
          description: "Full system access with all permissions",
          permissions: ["*"]
        },
        {
          key: "admin",
          name: "Administrator", 
          description: "Full administrative access",
          permissions: ["admin:*"]
        },
        {
          key: "moderator",
          name: "Moderator",
          description: "Content moderation and user management",
          permissions: ["content:*", "user:read", "user:update"]
        },
        {
          key: "support",
          name: "Support",
          description: "Customer support and basic operations",
          permissions: ["user:read", "order:read", "order:update"]
        }
      ];

      await Role.insertMany(defaultRoles);
      const newRoles = await Role.find({}).sort({ name: 1 }).lean();
      return NextResponse.json({
        success: true,
        data: newRoles
      });
    }

    return NextResponse.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create a new role
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

    await connectDB();
    
    // Ensure models are registered
    ensureModelsRegistered();
    
    // Get the Role model
    const Role = require("@/models/roleModel").default;

    const body = await request.json();
    const { key, name, description, permissions = [] } = body;

    // Validate required fields
    if (!key || !name) {
      return NextResponse.json(
        { success: false, message: "Key and name are required" },
        { status: 400 }
      );
    }

    // Check if role with same key already exists
    const existingRole = await Role.findOne({ key });
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: "Role with this key already exists" },
        { status: 409 }
      );
    }

    // Create new role
    const newRole = new Role({
      key,
      name,
      description,
      permissions
    });

    await newRole.save();

    return NextResponse.json({
      success: true,
      data: newRole,
      message: "Role created successfully"
    });

  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create role" },
      { status: 500 }
    );
  }
}


