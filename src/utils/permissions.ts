export const PERMISSIONS = [
  // Admin management
  "admin:read",
  "admin:write",
  // Groups
  "group:read",
  "group:write",
  // Roles
  "role:read",
  "role:write",
  // Users
  "user:read",
  "user:write",
  // Products
  "product:read",
  "product:write",
  // Orders
  "order:read",
  "order:write",
  // CMS (gated by explicit access)
  "cms:access",
  "cms:read",
  "cms:write"
] as const;

export type Permission = typeof PERMISSIONS[number] | "*";

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: ["*"],
  admin: [
    "admin:read","admin:write",
    "group:read","group:write",
    "role:read","role:write",
    "user:read","user:write",
    "product:read","product:write",
    "order:read","order:write",
    "cms:access","cms:read","cms:write"
  ],
  moderator: [
    "user:read","user:write",
    "product:read","product:write",
    "order:read"
  ],
  support: [
    "user:read",
    "order:read"
  ]
};

export function hasPermission(effectivePermissions: Permission[], required: Permission): boolean {
  if (effectivePermissions.includes("*")) return true;
  return effectivePermissions.includes(required);
}


