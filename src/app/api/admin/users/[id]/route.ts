import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import User from "@/models/userModel";
import Company from "@/models/companyModel";
import { requireAdminAuth } from "@/utils/adminAccess";

const ensureModelsRegistered = () => {
  User;
  Company;
};

// GET /api/admin/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureModelsRegistered();
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Get user with company information
    const user = await User.findById(id)
      .select("-password")
      .populate({
        path: "company",
        select: "name description website logo parentCompany parentCompanyNotAvailable parentCompanyDescription registrationNumber yearEstablished numEmployees servicesOffered currency gstNumber gstCertificates cin cinDocuments categories natureOfBusiness typeOfBusiness subscriptionPlan agreedToTerms addresses mailingAddresses users brochures createdAt updatedAt"
      })
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureModelsRegistered();
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const adminId = authCheck.admin?._id;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        ...body,
        updatedBy: adminId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("company")
      .lean();

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });

  } catch (error: any) {
    console.error("Error updating user:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureModelsRegistered();
    // Check admin authentication
    const authCheck = await requireAdminAuth(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message || "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Soft delete user
    await User.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      isActive: false
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
