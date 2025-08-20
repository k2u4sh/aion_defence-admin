import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import { generateTokenPair } from "@/utils/jwt";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const Admin = await getAdminModel();
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) return ApiResponseHandler.error("Email and password are required", 400);

    const admin = await Admin.findOne({ email: String(email).toLowerCase(), deletedAt: null }).select("+password");
    if (!admin) return ApiResponseHandler.error("Invalid credentials", 401);

    const ok = await admin.comparePassword(password);
    if (!ok) return ApiResponseHandler.error("Invalid credentials", 401);

    admin.lastLogin = new Date();
    await admin.save();

    const tokens = generateTokenPair({
      userId: admin._id.toString(),
      email: admin.email,
      roles: [admin.role],
      isVerified: true
    });

    const res = ApiResponseHandler.success({
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      },
      tokens
    }, "Login successful");

    // Set session cookie for middleware-based routing
    // This is a lightweight marker; sensitive auth should still use Authorization headers
    res.cookies.set('auth_session', String(admin._id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


