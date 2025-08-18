import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getRoleModel = async () => (await import("@/models/roleModel")).default;

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Role = await getRoleModel();
    const doc = await Role.findOne({ key: params.key });
    if (!doc) return ApiResponseHandler.notFound("Role not found");
    return ApiResponseHandler.success(doc, "Role fetched");
  } catch (err) {
    console.error("Get role error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Role = await getRoleModel();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    const { name, description, permissions } = body || {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (Array.isArray(permissions)) update.permissions = permissions;
    const doc = await Role.findOneAndUpdate({ key: params.key }, update, { new: true });
    if (!doc) return ApiResponseHandler.notFound("Role not found");
    return ApiResponseHandler.success(doc, "Role updated");
  } catch (err) {
    console.error("Update role error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Role = await getRoleModel();
    const doc = await Role.findOneAndDelete({ key: params.key });
    if (!doc) return ApiResponseHandler.notFound("Role not found");
    return ApiResponseHandler.success(null, "Role deleted");
  } catch (err) {
    console.error("Delete role error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


