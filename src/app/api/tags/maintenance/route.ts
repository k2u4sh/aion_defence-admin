import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { withAuth } from "@/utils/auth";
import type { JWTPayload } from "@/utils/jwt";
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

// Dynamic import for models
const getTagModel = async () => {
  const tagModule = await import("@/models/tagModel");
  return tagModule.default;
};

// POST: Bulk update tag counts and cleanup unused tags (Admin only)
async function updateTagCounts(request: NextRequest, user: JWTPayload) {
  try {
    // Check admin permissions
    if (!user.roles.includes('admin')) {
      return ApiResponseHandler.error("Access denied. Admin role required", 403);
    }

    await connectDB();
    const Tag = await getTagModel();

    // Update product counts for all tags
    await (Tag as unknown as { updateProductCounts(): Promise<void> }).updateProductCounts();

    // Clean unused tags
    const cleanupResult = await (Tag as unknown as { cleanUnusedTags(): Promise<{ deletedCount: number }> }).cleanUnusedTags();

    return ApiResponseHandler.success({
      message: "Tag counts updated and unused tags cleaned",
      success: true,
      data: {
        deletedTagsCount: cleanupResult.deletedCount
      }
    });

  } catch (error) {
    console.error("Update tag counts error:", error);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}

// Export the protected route
export const POST = withAuth(updateTagCounts);
