import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";
import User from "@/models/userModel";
import Company from "@/models/companyModel";
import { requireAdminAuth } from "@/utils/adminAccess";

const ensureModelsRegistered = () => {
  User;
  Company;
};

// GET /api/admin/users/[id]/company - Get company information for a user
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

    // Get user
    const user = await User.findById(id)
      .select("company companyName companyType")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Resolve company document: prefer populated ref, otherwise find by userId
    let companyDoc: any = null;
    if (user.company) {
      companyDoc = await Company.findById(user.company).lean();
    }
    if (!companyDoc) {
      companyDoc = await Company.findOne({ userId: id }).lean();
    }

    // Normalize response to include all model fields with sensible defaults
    const normalizedCompany = companyDoc ? {
      _id: companyDoc._id,
      userId: companyDoc.userId,
      slug: companyDoc.slug,
      name: companyDoc.name || "",
      logo: companyDoc.logo || "",
      description: companyDoc.description || "",
      addresses: Array.isArray(companyDoc.addresses) ? companyDoc.addresses : [],
      mailingAddresses: Array.isArray(companyDoc.mailingAddresses) ? companyDoc.mailingAddresses : [],
      parentCompany: companyDoc.parentCompany || "",
      parentCompanyNotAvailable: !!companyDoc.parentCompanyNotAvailable,
      parentCompanyDescription: companyDoc.parentCompanyDescription || "",
      website: companyDoc.website || "",
      brochures: Array.isArray(companyDoc.brochures) ? companyDoc.brochures : [],
      users: Array.isArray(companyDoc.users) ? companyDoc.users : [],
      subscriptionPlan: companyDoc.subscriptionPlan || "single",
      natureOfBusiness: Array.isArray(companyDoc.natureOfBusiness) ? companyDoc.natureOfBusiness : [],
      typeOfBusiness: Array.isArray(companyDoc.typeOfBusiness) ? companyDoc.typeOfBusiness : [],
      registrationNumber: companyDoc.registrationNumber || "",
      yearEstablished: companyDoc.yearEstablished || "",
      numEmployees: companyDoc.numEmployees || "",
      servicesOffered: companyDoc.servicesOffered || "",
      currency: companyDoc.currency || "",
      gstNumber: companyDoc.gstNumber || "",
      gstCertificates: Array.isArray(companyDoc.gstCertificates) ? companyDoc.gstCertificates : [],
      cin: companyDoc.cin || "",
      cinDocuments: Array.isArray(companyDoc.cinDocuments) ? companyDoc.cinDocuments : [],
      categories: Array.isArray(companyDoc.categories) ? companyDoc.categories : [],
      agreedToTerms: !!companyDoc.agreedToTerms,
      createdAt: companyDoc.createdAt || null,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        company: normalizedCompany,
        companyName: user.companyName || (normalizedCompany?.name ?? ""),
        companyType: user.companyType || "individual"
      }
    });

  } catch (error) {
    console.error("Error fetching company information:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch company information" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id]/company - Update company information for a user
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

    // If user has a company reference, update the company document
    if (existingUser.company) {
      const updatedCompany = await Company.findByIdAndUpdate(
        existingUser.company,
        {
          ...body.company,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedCompany) {
        return NextResponse.json(
          { success: false, message: "Company not found" },
          { status: 404 }
        );
      }
    } else if (body.company && existingUser.roles.includes('seller')) {
      // Create new company if user is a seller and doesn't have one
      const newCompany = new Company({
        ...body.company,
        userId: id,
        slug: body.company.name?.toLowerCase().replace(/\s+/g, '-') || `company-${id}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedCompany = await newCompany.save();

      // Update user to reference the new company
      await User.findByIdAndUpdate(id, {
        company: savedCompany._id,
        updatedBy: adminId,
        updatedAt: new Date()
      });
    }

    // Update user's company name and type
    const updateData: any = {
      updatedBy: adminId,
      updatedAt: new Date()
    };

    if (body.companyName !== undefined) {
      updateData.companyName = body.companyName;
    }

    if (body.companyType !== undefined) {
      updateData.companyType = body.companyType;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("company")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Company information updated successfully",
      data: updatedUser
    });

  } catch (error: any) {
    console.error("Error updating company information:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update company information" },
      { status: 500 }
    );
  }
}
