import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";

export async function POST(_request: NextRequest) {
  const res = ApiResponseHandler.success(null, "Logged out");
  // Clear session cookie used by middleware routing
  res.cookies.set('auth_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}


