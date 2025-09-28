import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  require("@/models/roleModel");
};

// GET /api/admin/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;

    const role = await Role.findById(id).lean();

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role
    });

  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[id] - Update a specific role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;

    const body = await request.json();
    const { key, name, description, permissions } = body;

    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (key !== undefined) role.key = key;
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();

    return NextResponse.json({
      success: true,
      data: role,
      message: "Role updated successfully"
    });

  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[id] - Delete a specific role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;

    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    // Check if role is being used by any admins
    const Admin = require("@/models/adminModel").default;
    const adminUsingRole = await Admin.findOne({ role: role.key });
    
    if (adminUsingRole) {
      return NextResponse.json(
        { success: false, message: "Cannot delete role that is currently assigned to admins" },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete role" },
      { status: 500 }
    );
  }
}
