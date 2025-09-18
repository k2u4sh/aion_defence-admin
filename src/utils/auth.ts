import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader, type JWTPayload } from '@/utils/jwt';
import { ApiResponseHandler, ErrorMessages, SuccessMessages } from "@/utils/apiResponse";
import { Validator, ValidationSchemas } from "@/utils/validation";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * JWT Authentication middleware
 */
export function authenticateJWT(request: NextRequest): { 
  success: boolean; 
  user?: JWTPayload; 
  error?: string;
  response?: NextResponse;
} {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        success: false,
        error: 'No token provided',
        response: ApiResponseHandler.error("Access denied. No token provided.", 401)
      };
    }

    const decoded = verifyAccessToken(token);
    
    return {
      success: true,
      user: decoded
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
      response: ApiResponseHandler.error("Access denied. Invalid token.", 401)
    };
  }
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = authenticateJWT(request);
    
    if (!auth.success) {
      return auth.response as NextResponse;
    }
    
    return handler(request, auth.user as JWTPayload);
  };
}

/**
 * Role-based access control
 */
export function requireRoles(allowedRoles: string[]) {
  return (user: JWTPayload): { success: boolean; error?: string; response?: NextResponse } => {
    const hasRole = user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return {
        success: false,
        error: 'Insufficient permissions',
        response: ApiResponseHandler.error("Access denied. Insufficient permissions.", 403)
      };
    }
    
    return { success: true };
  };
}

/**
 * Verify account status
 */
export function requireVerifiedAccount(user: JWTPayload): { 
  success: boolean; 
  error?: string; 
  response?: NextResponse;
} {
  if (!user.isVerified) {
    return {
      success: false,
      error: 'Account not verified',
      response: ApiResponseHandler.error('Access denied. Please verify your account first.', 403)
    };
  }
  
  return { success: true };
}
