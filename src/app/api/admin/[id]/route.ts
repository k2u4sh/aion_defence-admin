import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import { requireAdminAuth } from "@/utils/adminAccess";

// Ensure models are registered
const ensureModelsRegistered = () => {
  // These imports will register the models with Mongoose
  require("@/models/adminModel");
  require("@/models/adminGroupModel");
};

// GET /api/admin/[id]
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
    
    // Get the Admin model
    const Admin = require("@/models/adminModel").default;
    
    const resolvedParams = await params;
    const admin = await Admin.findById(resolvedParams.id).populate("groups", "name permissions");
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: admin,
      message: "Admin fetched"
    });
  } catch (err) {
    console.error("Get admin error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/[id]
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
    
    // Get the models
    const Admin = require("@/models/adminModel").default;
    const AdminGroup = require("@/models/adminGroupModel").default;
    
    const resolvedParams = await params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    const { firstName, lastName, role, permissions, groups, isActive, password } = body || {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (role !== undefined) update.role = role;
    if (Array.isArray(permissions)) update.permissions = permissions;
    if (typeof isActive === "boolean") update.isActive = isActive;

    if (Array.isArray(groups)) {
      const found = await AdminGroup.find({ _id: { $in: groups } }, { _id: 1 });
      if (found.length !== groups.length) {
        return NextResponse.json(
          { success: false, message: "One or more groups not found" },
          { status: 400 }
        );
      }
      update.groups = found.map((g: any) => g._id);
    }

    // If password change is requested, use document save to trigger hashing
    if (typeof password === 'string' && password.length > 0) {
      const doc = await Admin.findById(resolvedParams.id).select('+password');
      if (!doc) {
        return NextResponse.json(
          { success: false, message: "Admin not found" },
          { status: 404 }
        );
      }
      // Apply other updates on the document
      Object.assign(doc, update);
      doc.password = password;
      await doc.save();
      const populated = await Admin.findById(resolvedParams.id).populate("groups", "name permissions");
      return NextResponse.json({
        success: true,
        data: populated,
        message: "Admin updated"
      });
    }

    const admin = await Admin.findByIdAndUpdate(resolvedParams.id, update, { new: true }).populate("groups", "name permissions");
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: admin,
      message: "Admin updated"
    });
  } catch (err) {
    console.error("Update admin error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/[id] (soft delete)
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
    
    // Get the Admin model
    const Admin = require("@/models/adminModel").default;
    
    const resolvedParams = await params;
    const admin = await Admin.findById(resolvedParams.id);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }
    admin.deletedAt = new Date();
    admin.isActive = false;
    await admin.save();
    return NextResponse.json({
      success: true,
      data: null,
      message: "Admin deleted"
    });
  } catch (err) {
    console.error("Delete admin error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}


