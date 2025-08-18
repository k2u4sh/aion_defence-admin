import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getRoleModel = async () => (await import("@/models/roleModel")).default;

// GET list roles
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "role:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Role = await getRoleModel();
    const items = await Role.find({}).sort({ key: 1 });
    return ApiResponseHandler.success(items, "Roles fetched");
  } catch (err) {
    console.error("List roles error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST create role
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Role = await getRoleModel();
    const body = await request.json();
    const { key, name, description = "", permissions = [] } = body || {};
    if (!key || !name) return ApiResponseHandler.error("key and name are required", 400);
    const exists = await Role.findOne({ key });
    if (exists) return ApiResponseHandler.error("Role key already exists", 409);
    const created = await Role.create({ key, name, description, permissions });
    return ApiResponseHandler.success(created, "Role created", 201);
  } catch (err) {
    console.error("Create role error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


