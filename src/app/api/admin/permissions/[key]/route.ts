import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getPermissionModel = async () => (await import("@/models/permissionModel")).default;

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Permission = await getPermissionModel();
    const doc = await Permission.findOne({ key: params.key });
    if (!doc) return ApiResponseHandler.notFound("Permission not found");
    return ApiResponseHandler.success(doc, "Permission fetched");
  } catch (err) {
    console.error("Get permission error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Permission = await getPermissionModel();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    const { name, description, category } = body || {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    const doc = await Permission.findOneAndUpdate({ key: params.key }, update, { new: true });
    if (!doc) return ApiResponseHandler.notFound("Permission not found");
    return ApiResponseHandler.success(doc, "Permission updated");
  } catch (err) {
    console.error("Update permission error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Permission = await getPermissionModel();
    const doc = await Permission.findOneAndDelete({ key: params.key });
    if (!doc) return ApiResponseHandler.notFound("Permission not found");
    return ApiResponseHandler.success(null, "Permission deleted");
  } catch (err) {
    console.error("Delete permission error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


