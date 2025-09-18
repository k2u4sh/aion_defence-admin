import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getAdminModel = async () => (await import("@/models/adminModel")).default;
const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

// GET /api/admin/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Admin = await getAdminModel();
    const admin = await Admin.findById(resolvedParams.id).populate("groups", "name permissions");
    if (!admin) return ApiResponseHandler.notFound("Admin not found");
    return ApiResponseHandler.success(admin, "Admin fetched");
  } catch (err) {
    console.error("Get admin error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// PUT /api/admin/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const auth = await requirePermission(request, "admin:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Admin = await getAdminModel();
    const AdminGroup = await getAdminGroupModel();
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
        return ApiResponseHandler.error("One or more groups not found", 400);
      }
      update.groups = found.map(g => g._id);
    }

    // If password change is requested, use document save to trigger hashing
    if (typeof password === 'string' && password.length > 0) {
      const doc = await Admin.findById(resolvedParams.id).select('+password');
      if (!doc) return ApiResponseHandler.notFound("Admin not found");
      // Apply other updates on the document
      Object.assign(doc, update);
      doc.password = password;
      await doc.save();
      const populated = await Admin.findById(resolvedParams.id).populate("groups", "name permissions");
      return ApiResponseHandler.success(populated, "Admin updated");
    }

    const admin = await Admin.findByIdAndUpdate(resolvedParams.id, update, { new: true }).populate("groups", "name permissions");
    if (!admin) return ApiResponseHandler.notFound("Admin not found");
    return ApiResponseHandler.success(admin, "Admin updated");
  } catch (err) {
    console.error("Update admin error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// DELETE /api/admin/[id] (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const auth = await requirePermission(request, "admin:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Admin = await getAdminModel();
    const admin = await Admin.findById(resolvedParams.id);
    if (!admin) return ApiResponseHandler.notFound("Admin not found");
    admin.deletedAt = new Date();
    admin.isActive = false;
    await admin.save();
    return ApiResponseHandler.success(null, "Admin deleted");
  } catch (err) {
    console.error("Delete admin error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


