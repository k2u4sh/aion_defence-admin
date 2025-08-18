import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { ROLE_DEFAULT_PERMISSIONS } from "@/utils/permissions";

// GET /api/admin/roles - list available roles and default permissions
export async function GET(_request: NextRequest) {
  const roles = Object.keys(ROLE_DEFAULT_PERMISSIONS).map(key => ({
    role: key,
    defaultPermissions: ROLE_DEFAULT_PERMISSIONS[key]
  }));
  return ApiResponseHandler.success(roles, "Roles fetched");
}


