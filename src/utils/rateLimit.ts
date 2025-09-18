import { NextRequest, NextResponse } from "next/server";
import { ApiResponseHandler } from "@/utils/apiResponse";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Too many requests, please try again later"
};

// Simple in-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, maxRequests, message } = { ...defaultConfig, ...config };

  return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now);
    
    // Get or create request count for this identifier
    const requestData = requestCounts.get(identifier) || { count: 0, resetTime: now + windowMs };
    
    // Reset count if window has expired
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + windowMs;
    }
    
    // Increment count
    requestData.count++;
    requestCounts.set(identifier, requestData);
    
    // Check if limit exceeded
    if (requestData.count > maxRequests) {
      return ApiResponseHandler.error(message || 'Rate limit exceeded', 429);
    }
    
    return null; // No rate limit hit
  };
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for deployment behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return clientIp;
}

function cleanupExpiredEntries(now: number) {
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}
