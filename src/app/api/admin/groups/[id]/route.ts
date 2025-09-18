import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";

const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

// GET /api/admin/groups/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await connectDB();
    const AdminGroup = await getAdminGroupModel();
    const group = await AdminGroup.findById(resolvedParams.id);
    if (!group) return ApiResponseHandler.notFound("Group not found");
    return ApiResponseHandler.success(group, "Group fetched");
  } catch (err) {
    console.error("Get group error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// PUT /api/admin/groups/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await connectDB();
    const AdminGroup = await getAdminGroupModel();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    const { name, description, permissions } = body || {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (Array.isArray(permissions)) update.permissions = permissions;

    const group = await AdminGroup.findByIdAndUpdate(resolvedParams.id, update, { new: true });
    if (!group) return ApiResponseHandler.notFound("Group not found");
    return ApiResponseHandler.success(group, "Group updated");
  } catch (err) {
    console.error("Update group error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// DELETE /api/admin/groups/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await connectDB();
    const AdminGroup = await getAdminGroupModel();
    const group = await AdminGroup.findByIdAndDelete(resolvedParams.id);
    if (!group) return ApiResponseHandler.notFound("Group not found");
    return ApiResponseHandler.success(null, "Group deleted");
  } catch (err) {
    console.error("Delete group error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


