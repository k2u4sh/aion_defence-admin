import { connectDB } from "@/utils/db";
import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";
import crypto from "crypto";

const getAdminModel = async () => (await import("@/models/adminModel")).default;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const Admin = await getAdminModel();
    const body = await request.json();
    const { email } = body || {};
    if (!email) return ApiResponseHandler.error("Email is required", 400);

    const admin = await Admin.findOne({ email: String(email).toLowerCase(), deletedAt: null });
    if (!admin) return ApiResponseHandler.success(null, "If the account exists, a reset link has been sent");

    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    admin.forgotPasswordToken = token;
    admin.forgotPasswordTokenExpiry = expires;
    await admin.save();

    // TODO: send token via email (integrate your mailer)
    console.log("Admin reset token:", token);

    return ApiResponseHandler.success(null, "If the account exists, a reset link has been sent");
  } catch (err) {
    console.error("Admin forgot password error:", err);
    return ApiResponseHandler.error("Internal Server Error", 500);
  }
}


