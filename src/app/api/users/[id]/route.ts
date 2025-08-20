import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { connectDB } from "@/utils/db";
import { requirePermission } from "@/utils/adminAccess";

const getUserModel = async () => (await import("@/models/userModel")).default;

// GET /api/users/[id] - get user details
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const auth = await requirePermission(request, "user:read");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		
		const user = await User.findById(params.id, {
			password: 0,
			forgotPasswordToken: 0,
			forgotPasswordTokenExpiry: 0,
			verifyToken: 0,
			verifyTokenExpiry: 0,
			otp: 0
		});
		
		if (!user) return ApiResponseHandler.notFound("User not found");
		
		return ApiResponseHandler.success(user, "User details fetched successfully");
	} catch (err) {
		console.error("Get user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}

// PUT /api/users/[id] - update user details
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
		
		// Use the safe update method from the model
		const updated = await User.updateEditableFieldsById(params.id, body, {
			new: true,
			runValidators: true
		});
		
		if (!updated) return ApiResponseHandler.notFound("User not found");
		
		return ApiResponseHandler.success(updated, "User updated successfully");
	} catch (err) {
		console.error("Update user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}

// DELETE /api/users/[id] - soft delete user
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const auth = await requirePermission(request, "user:write");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		
		const user = await User.findById(params.id);
		if (!user) return ApiResponseHandler.notFound("User not found");
		
		// Soft delete
		await user.softDelete();
		
		return ApiResponseHandler.success(null, "User deleted successfully");
	} catch (err) {
		console.error("Delete user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}
