import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

// GET /api/admin/groups - list with pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "group:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const AdminGroup = await getAdminGroupModel();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    const search = searchParams.get("search");
    if (search) filter.name = { $regex: search, $options: "i" };

    const [items, total] = await Promise.all([
      AdminGroup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminGroup.countDocuments(filter)
    ]);

    return ApiResponseHandler.paginated(items, page, limit, total, "Groups fetched successfully");
  } catch (err) {
    console.error("List groups error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST /api/admin/groups - create
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "group:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const AdminGroup = await getAdminGroupModel();
    const body = await request.json();

    const { name, description = "", permissions = [] } = body || {};
    if (!name || typeof name !== "string") {
      return ApiResponseHandler.error("'name' is required", 400);
    }

    const exists = await AdminGroup.findOne({ name: name.trim() });
    if (exists) return ApiResponseHandler.error("Group name already exists", 409);

    const group = await AdminGroup.create({ name: name.trim(), description, permissions });
    return ApiResponseHandler.success(group, "Group created", 201);
  } catch (err) {
    console.error("Create group error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


