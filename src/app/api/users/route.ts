import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { connectDB } from "@/utils/db";
import { requirePermission } from "@/utils/adminAccess";

const getUserModel = async () => (await import("@/models/userModel")).default;

// GET /api/users - list users (paginated, with comprehensive filtering)
export async function GET(request: NextRequest) {
	try {
		const auth = await requirePermission(request, "user:read");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		const { searchParams } = new URL(request.url);
		
		// Pagination
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
		const skip = (page - 1) * limit;
		
		// Filtering
		const search = searchParams.get("search");
		const isActive = searchParams.get("isActive");
		const isVerified = searchParams.get("isVerified");
		const isBlocked = searchParams.get("isBlocked");
		const role = searchParams.get("role");
		const companyType = searchParams.get("companyType");
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = searchParams.get("sortOrder") || "desc";

		// Build filter
		const filter: Record<string, unknown> = { deletedAt: null };
		if (isActive !== null) filter.isActive = isActive === "true";
		if (isVerified !== null) filter.isVerified = isVerified === "true";
		if (isBlocked !== null) filter.isBlocked = isBlocked === "true";
		if (role) filter.roles = role;
		if (companyType) filter.companyType = companyType;
		
		// Search across multiple fields
		if (search) {
			filter.$or = [
				{ firstName: { $regex: search, $options: "i" } },
				{ lastName: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ companyName: { $regex: search, $options: "i" } },
				{ mobile: { $regex: search, $options: "i" } }
			];
		}

		// Build sort object
		const sort: Record<string, 1 | -1> = {};
		sort[sortBy] = sortOrder === "desc" ? -1 : 1;

		// Fields to return (exclude sensitive data)
		const fields = {
			firstName: 1,
			lastName: 1,
			email: 1,
			mobile: 1,
			companyName: 1,
			companyType: 1,
			roles: 1,
			isActive: 1,
			isVerified: 1,
			isBlocked: 1,
			profilePicture: 1,
			lastLogin: 1,
			createdAt: 1,
			updatedAt: 1
		};

		const [items, total] = await Promise.all([
			User.find(filter, fields)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean(),
			User.countDocuments(filter)
		]);

		// Add computed fields
		const enrichedItems = items.map(user => ({
			...user,
			fullName: `${user.firstName} ${user.lastName}`,
			primaryRole: user.roles?.[0] || "N/A"
		}));

		return ApiResponseHandler.paginated(enrichedItems, page, limit, total, "Users fetched successfully");
	} catch (err) {
		console.error("List users error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}

// POST /api/users - create new user
export async function POST(request: NextRequest) {
	try {
		const auth = await requirePermission(request, "user:write");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		const body = await request.json();
		
		// Validate required fields
		const { firstName, lastName, email, password, mobile, companyName, roles } = body;
		if (!firstName || !lastName || !email || !password || !mobile || !companyName || !roles) {
			return ApiResponseHandler.error("Missing required fields", 400);
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email, deletedAt: null });
		if (existingUser) {
			return ApiResponseHandler.error("User with this email already exists", 400);
		}

		// Create user
		const user = new User({
			firstName,
			lastName,
			email,
			password,
			mobile,
			companyName,
			roles: Array.isArray(roles) ? roles : [roles],
			companyType: body.companyType || "individual",
			isActive: true,
			isVerified: false
		});

		await user.save();
		
		// Return user without password
		const userResponse = user.toObject();
		delete userResponse.password;
		
		return ApiResponseHandler.success(userResponse, "User created successfully");
	} catch (err) {
		console.error("Create user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}

// PUT /api/users - update user fields
export async function PUT(request: NextRequest) {
	try {
		const auth = await requirePermission(request, "user:write");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		const body = await request.json();
		const { id, ...updates } = body || {};
		
		if (!id) return ApiResponseHandler.error("id is required", 400);

		// Only allow updating specific fields
		const allowedUpdates = [
			'isActive', 'isVerified', 'isBlocked', 'roles', 'companyType'
		];
		
		const filteredUpdates: Record<string, unknown> = {};
		allowedUpdates.forEach(field => {
			if (updates[field] !== undefined) {
				filteredUpdates[field] = updates[field];
			}
		});

		if (Object.keys(filteredUpdates).length === 0) {
			return ApiResponseHandler.error("No valid fields to update", 400);
		}

		const updated = await User.findByIdAndUpdate(
			id, 
			filteredUpdates, 
			{ new: true, runValidators: true }
		);
		
		if (!updated) return ApiResponseHandler.notFound("User not found");
		
		return ApiResponseHandler.success(updated, "User updated successfully");
	} catch (err) {
		console.error("Update user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}

// DELETE /api/users - soft delete user
export async function DELETE(request: NextRequest) {
	try {
		const auth = await requirePermission(request, "user:write");
		if (!auth) return ApiResponseHandler.unauthorized("Unauthorized");
		await connectDB();
		const User = await getUserModel();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		
		if (!id) return ApiResponseHandler.error("id is required", 400);

		const user = await User.findById(id);
		if (!user) return ApiResponseHandler.notFound("User not found");

		// Soft delete
		//await user.softDelete();
		
		return ApiResponseHandler.success(null, "User deleted successfully");
	} catch (err) {
		console.error("Delete user error:", err);
		return ApiResponseHandler.error("Internal Server Error", 500);
	}
}



