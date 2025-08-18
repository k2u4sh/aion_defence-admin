import { NextRequest } from "next/server";
import { extractTokenFromHeader, verifyAccessToken } from "@/utils/jwt";
import { ROLE_DEFAULT_PERMISSIONS, type Permission } from "@/utils/permissions";

const getAdminModel = async () => (await import("@/models/adminModel")).default;
const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

export interface AuthenticatedAdmin {
  admin: any;
  effectivePermissions: Permission[];
}

export async function getAdminFromRequest(request: NextRequest): Promise<AuthenticatedAdmin | null> {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  const Admin = await getAdminModel();
  const AdminGroup = await getAdminGroupModel();

  const admin = await Admin.findById(payload.userId).lean();
  if (!admin || admin.deletedAt || admin.isActive === false) return null;

  // Gather permissions from role defaults, direct, and groups
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[admin.role] || [];
  const direct: Permission[] = Array.isArray(admin.permissions) ? admin.permissions : [];
  let fromGroups: Permission[] = [];
  if (Array.isArray(admin.groups) && admin.groups.length) {
    const groups = await AdminGroup.find({ _id: { $in: admin.groups } }, { permissions: 1 }).lean();
    fromGroups = groups.flatMap(g => Array.isArray(g.permissions) ? g.permissions : []);
  }

  const effectivePermissions = Array.from(new Set([...(roleDefaults as Permission[]), ...direct, ...fromGroups]));
  return { admin, effectivePermissions };
}

export async function requirePermission(request: NextRequest, permission: Permission): Promise<AuthenticatedAdmin | null> {
  const auth = await getAdminFromRequest(request);
  if (!auth) return null;
  if (auth.effectivePermissions.includes("*") || auth.effectivePermissions.includes(permission)) {
    return auth;
  }
  return null;
}


