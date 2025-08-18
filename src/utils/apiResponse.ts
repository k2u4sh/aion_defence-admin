import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export class ApiResponseHandler {
  static success<T>(
    data: T,
    message: string = 'Success',
    status: number = 200,
    pagination?: ApiResponse['pagination']
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return NextResponse.json(response, { status });
  }

  static error(
    message: string = 'An error occurred',
    status: number = 500,
    errors?: Record<string, string[]>
  ): NextResponse<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    if (errors) {
      response.errors = errors;
    }

    return NextResponse.json(response, { status });
  }

  static validationError(
    errors: Record<string, string[]>,
    message: string = 'Validation failed'
  ): NextResponse<ApiResponse> {
    return this.error(message, 400, errors);
  }

  static notFound(
    message: string = 'Resource not found'
  ): NextResponse<ApiResponse> {
    return this.error(message, 404);
  }

  static unauthorized(
    message: string = 'Unauthorized access'
  ): NextResponse<ApiResponse> {
    return this.error(message, 401);
  }

  static forbidden(
    message: string = 'Access forbidden'
  ): NextResponse<ApiResponse> {
    return this.error(message, 403);
  }

  static conflict(
    message: string = 'Resource conflict'
  ): NextResponse<ApiResponse> {
    return this.error(message, 409);
  }

  static tooManyRequests(
    message: string = 'Too many requests'
  ): NextResponse<ApiResponse> {
    return this.error(message, 429);
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / limit);
    
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return this.success(data, message, 200, pagination);
  }
}

// Common error messages
export const ErrorMessages = {
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
    MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
    MAX_LENGTH: (field: string, max: number) => `${field} cannot exceed ${max} characters`,
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    PASSWORDS_DONT_MATCH: 'Passwords do not match'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_BLOCKED: 'Account is blocked. Please contact support.',
    ACCOUNT_LOCKED: 'Account is temporarily locked due to multiple failed login attempts',
    TOKEN_EXPIRED: 'Authentication token has expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',
    ACCOUNT_NOT_VERIFIED: 'Account verification required to access this feature'
  },
  RESOURCE: {
    NOT_FOUND: (resource: string) => `${resource} not found`,
    ALREADY_EXISTS: (resource: string) => `${resource} already exists`,
    DELETED: (resource: string) => `${resource} has been deleted`,
    INVALID_ID: 'Invalid ID format'
  },
  DATABASE: {
    CONNECTION_FAILED: 'Database connection failed',
    QUERY_FAILED: 'Database query failed',
    TRANSACTION_FAILED: 'Database transaction failed'
  }
};

// Common success messages
export const SuccessMessages = {
  CREATED: (resource: string) => `${resource} created successfully`,
  UPDATED: (resource: string) => `${resource} updated successfully`,
  DELETED: (resource: string) => `${resource} deleted successfully`,
  RETRIEVED: (resource: string) => `${resource} retrieved successfully`,
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  VERIFIED: 'Account verified successfully',
  PASSWORD_RESET: 'Password reset successfully'
};
