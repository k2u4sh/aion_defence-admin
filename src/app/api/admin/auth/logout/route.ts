import { NextRequest } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";

export async function POST(_request: NextRequest) {
  // If you're using httpOnly cookies for tokens, clear them here.
  return ApiResponseHandler.success(null, "Logged out");
}


