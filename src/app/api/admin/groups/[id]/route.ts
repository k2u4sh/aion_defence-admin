import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  require("@/models/adminGroupModel");
};

// GET /api/admin/groups/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    // Get the AdminGroup model
    const AdminGroup = require("@/models/adminGroupModel").default;
    
    const resolvedParams = await params;
    const group = await AdminGroup.findById(resolvedParams.id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: group,
      message: "Group fetched"
    });
  } catch (err) {
    console.error("Get group error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/groups/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    // Get the AdminGroup model
    const AdminGroup = require("@/models/adminGroupModel").default;
    
    const resolvedParams = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    const { name, description, permissions } = body || {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (Array.isArray(permissions)) update.permissions = permissions;

    const group = await AdminGroup.findByIdAndUpdate(resolvedParams.id, update, { new: true });
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: group,
      message: "Group updated"
    });
  } catch (err) {
    console.error("Update group error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/groups/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    // Get the AdminGroup model
    const AdminGroup = require("@/models/adminGroupModel").default;
    
    const resolvedParams = await params;
    const group = await AdminGroup.findByIdAndDelete(resolvedParams.id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: null,
      message: "Group deleted"
    });
  } catch (err) {
    console.error("Delete group error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


