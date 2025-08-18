import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { requirePermission } from "@/utils/adminAccess";

const getAdminModel = async () => (await import("@/models/adminModel")).default;
const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

// GET /api/admin - list admins
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:read");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Admin = await getAdminModel();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (isActive !== null) filter.isActive = isActive === "true";
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];

    const [items, total] = await Promise.all([
      Admin.find(filter).populate("groups", "name permissions").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Admin.countDocuments(filter)
    ]);

    return ApiResponseHandler.paginated(items, page, limit, total, "Admins fetched successfully");
  } catch (err) {
    console.error("List admins error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// POST /api/admin - create admin (including optional groups)
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "admin:write");
    if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
    await connectDB();
    const Admin = await getAdminModel();
    const AdminGroup = await getAdminGroupModel();
    const body = await request.json();

    const { firstName, lastName, email, password, role = "admin", permissions = [], groups = [] } = body || {};
    if (!firstName || !lastName || !email || !password) {
      return ApiResponseHandler.error("firstName, lastName, email, and password are required", 400);
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) return ApiResponseHandler.error("Email already exists", 409);

    let groupIds = [] as string[];
    if (Array.isArray(groups) && groups.length > 0) {
      const found = await AdminGroup.find({ _id: { $in: groups } }, { _id: 1 });
      if (found.length !== groups.length) {
        return ApiResponseHandler.error("One or more groups not found", 400);
      }
      groupIds = found.map(g => g._id.toString());
    }

    const admin = await Admin.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      permissions,
      groups: groupIds
    });

    return ApiResponseHandler.success(admin, "Admin created", 201);
  } catch (err) {
    console.error("Create admin error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


