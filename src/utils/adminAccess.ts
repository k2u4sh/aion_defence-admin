import { NextRequest } from "next/server";
import { extractTokenFromHeader, verifyAccessToken } from "@/utils/jwt";
import { ROLE_DEFAULT_PERMISSIONS, type Permission } from "@/utils/permissions";
import { connectToDatabase as connectDB } from "@/lib/db";

const getAdminModel = async () => (await import("@/models/adminModel")).default;
const getAdminGroupModel = async () => (await import("@/models/adminGroupModel")).default;

interface AdminDocument {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions?: Permission[];
  groups?: string[];
  deletedAt?: Date | null;
  isActive?: boolean;
}

export interface AuthenticatedAdmin {
  admin: AdminDocument;
  effectivePermissions: Permission[];
}

export async function getAdminFromRequest(request: NextRequest): Promise<AuthenticatedAdmin | null> {
  try {
    // Ensure database connection
    await connectDB();
    
    // First try to get admin from JWT token
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = extractTokenFromHeader(authHeader);
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          const Admin = await getAdminModel();
          const AdminGroup = await getAdminGroupModel();

          const admin = await Admin.findById(payload.userId).lean() as AdminDocument | null;
          if (admin && !admin.deletedAt && admin.isActive !== false) {
            // Gather permissions from role defaults, direct, and groups
            const roleDefaults = ROLE_DEFAULT_PERMISSIONS[admin.role] || [];
            const direct: Permission[] = Array.isArray(admin.permissions) ? admin.permissions : [];
            let fromGroups: Permission[] = [];
            if (Array.isArray(admin.groups) && admin.groups.length) {
              const groups = await AdminGroup.find({ _id: { $in: admin.groups } }, { permissions: 1 }).lean();
              fromGroups = groups.flatMap(g => Array.isArray(g.permissions) ? g.permissions : []).filter((p): p is Permission => typeof p === 'string');
            }

            const effectivePermissions = Array.from(new Set([...roleDefaults, ...direct, ...fromGroups]));
            return { admin, effectivePermissions };
          }
        } catch (error) {
          console.error("JWT token verification failed:", error);
        }
      }
    }

    // If JWT token is not available or invalid, try session cookie
    const sessionCookie = request.cookies.get('auth_session');
    if (sessionCookie?.value) {
      try {
        const Admin = await getAdminModel();
        const AdminGroup = await getAdminGroupModel();

        const admin = await Admin.findById(sessionCookie.value).lean() as AdminDocument | null;
        if (admin && !admin.deletedAt && admin.isActive !== false) {
          // Gather permissions from role defaults, direct, and groups
          const roleDefaults = ROLE_DEFAULT_PERMISSIONS[admin.role] || [];
          const direct: Permission[] = Array.isArray(admin.permissions) ? admin.permissions : [];
          let fromGroups: Permission[] = [];
          if (Array.isArray(admin.groups) && admin.groups.length) {
            const groups = await AdminGroup.find({ _id: { $in: admin.groups } }, { permissions: 1 }).lean();
            fromGroups = groups.flatMap(g => Array.isArray(g.permissions) ? g.permissions : []).filter((p): p is Permission => typeof p === 'string');
          }

          const effectivePermissions = Array.from(new Set([...roleDefaults, ...direct, ...fromGroups]));
          return { admin, effectivePermissions };
        }
      } catch (error) {
        console.error("Session cookie verification failed:", error);
      }
    }

    return null;
  } catch (error) {
    console.error("Database connection error in getAdminFromRequest:", error);
    return null;
  }
}

export async function requirePermission(request: NextRequest, permission: Permission): Promise<AuthenticatedAdmin | null> {
  const auth = await getAdminFromRequest(request);
  if (!auth) return null;
  if (auth.effectivePermissions.includes("*") || auth.effectivePermissions.includes(permission)) {
    return auth;
  }
  return null;
}

export async function requireAdminAuth(request: NextRequest): Promise<{ success: boolean; admin?: AdminDocument; message?: string }> {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth) {
      return { success: false, message: "Authentication required" };
    }
    return { success: true, admin: auth.admin };
  } catch (error) {
    console.error("Admin access check error:", error);
    return { success: false, message: "Access denied" };
  }
}

export async function requireAdminPermission(request: NextRequest, permission: Permission): Promise<{ success: boolean; admin?: AdminDocument; message?: string }> {
  try {
    const auth = await requirePermission(request, permission);
    if (!auth) {
      return { success: false, message: "Insufficient permissions" };
    }
    return { success: true, admin: auth.admin };
  } catch (error) {
    console.error("Admin permission check error:", error);
    return { success: false, message: "Access denied" };
  }
}

// Legacy function for backward compatibility
export async function adminAccess(request: NextRequest): Promise<{ success: boolean; adminId?: string; message?: string }> {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth) {
      return { success: false, message: "Authentication required" };
    }
    return { success: true, adminId: auth.admin._id };
  } catch (error) {
    console.error("Admin access check error:", error);
    return { success: false, message: "Access denied" };
  }
}


