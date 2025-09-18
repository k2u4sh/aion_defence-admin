import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { connectDB } from "@/utils/db";
import { requirePermission } from "@/utils/adminAccess";
import bcrypt from "bcryptjs";

const getUserModel = async () => (await import("@/models/userModel")).default;

// PUT /api/users/[id]/password - change user password
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const resolvedParams = await params;
		const auth = await requirePermission(request, "user:write");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		const body = await request.json();
		const { newPassword } = body;
		
		if (!newPassword || newPassword.length < 8) {
			return ApiResponseHandler.error("Password must be at least 8 characters", 400);
		}

		// Find user and update password
		const user = await User.findById(resolvedParams.id);
		if (!user) return ApiResponseHandler.notFound("User not found");

		// Hash the new password
		const salt = await bcrypt.genSalt(12);
		const hashedPassword = await bcrypt.hash(newPassword, salt);
		
		// Update the user's password
		user.password = hashedPassword;
		await user.save();
		
		return ApiResponseHandler.success(null, "Password updated successfully");
	} catch (err) {
		console.error("Change password error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}
