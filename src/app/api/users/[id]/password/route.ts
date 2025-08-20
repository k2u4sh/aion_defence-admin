import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { connectDB } from "@/utils/db";
import { requirePermission } from "@/utils/adminAccess";

const getUserModel = async () => (await import("@/models/userModel")).default;

// PUT /api/users/[id]/password - change user password
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
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
		const user = await User.findById(params.id);
		if (!user) return ApiResponseHandler.notFound("User not found");

		// Use the safe password update method from the model
		await user.setPassword(newPassword);
		
		return ApiResponseHandler.success(null, "Password updated successfully");
	} catch (err) {
		console.error("Change password error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}
