import { connectToDatabase as connectDB } from "@/lib/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getPermissionModel = async () => (await import("@/models/permissionModel")).default;

// GET list permissions (paginated)
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "role:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Permission = await getPermissionModel();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [{ key: { $regex: search, $options: "i" } }, { name: { $regex: search, $options: "i" } }];
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Permission.find(filter).sort({ key: 1 }).skip(skip).limit(limit),
      Permission.countDocuments(filter)
    ]);

    return ApiResponseHandler.paginated(items, page, limit, total, "Permissions fetched");
  } catch (err) {
    console.error("List permissions error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST create permission
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "role:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Permission = await getPermissionModel();
    const body = await request.json();
    const { key, name, description = "", category = "general" } = body || {};
    if (!key || !name) return ApiResponseHandler.error("key and name are required", 400);

    const exists = await Permission.findOne({ key });
    if (exists) return ApiResponseHandler.error("Permission key already exists", 409);

    const created = await Permission.create({ key, name, description, category });
    return ApiResponseHandler.success(created, "Permission created", 201);
  } catch (err) {
    console.error("Create permission error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


