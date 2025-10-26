// In-memory rate limiting (for production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  
  // General API endpoints
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  
  // Read operations - more lenient
  read: { limit: 200, windowMs: 60 * 1000 }, // 200 requests per minute
  
  // Write operations - more restrictive
  write: { limit: 50, windowMs: 60 * 1000 }, // 50 requests per minute
  
  // File upload endpoints
  upload: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  
  // Password reset, etc.
  sensitive: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
};

export function createRateLimitKey(ip: string, endpoint: string, userId?: string): string {
  // Use user ID if available, otherwise IP
  const identifier = userId || ip;
  return `rate_limit:${identifier}:${endpoint}`;
}

export function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
}

export function checkRateLimit(
  request: Request, 
  endpoint: string, 
  config: { limit: number; windowMs: number },
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(request);
  const key = createRateLimitKey(ip, endpoint, userId);
  
  return rateLimiter.check(key, config.limit, config.windowMs);
}

// Middleware function for Next.js API routes
export function withRateLimit(
  config: { limit: number; windowMs: number },
  handler: (request: Request, context: any) => Promise<Response>
) {
  return async (request: Request, context: any) => {
    const url = new URL(request.url);
    const endpoint = url.pathname;
    
    const result = checkRateLimit(request, endpoint, config);
    
    if (!result.allowed) {
      const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: resetTimeSeconds,
          resetTime: new Date(result.resetTime).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': resetTimeSeconds.toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, context);
    
    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    
    newResponse.headers.set('X-RateLimit-Limit', config.limit.toString());
    newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    newResponse.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return newResponse;
  };
}

// Helper to apply rate limiting to existing API routes
export function applyRateLimit(
  request: Request,
  endpoint: string,
  config: { limit: number; windowMs: number },
  userId?: string
): Response | null {
  const result = checkRateLimit(request, endpoint, config, userId);
  
  if (!result.allowed) {
    const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: resetTimeSeconds,
        resetTime: new Date(result.resetTime).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': resetTimeSeconds.toString(),
        },
      }
    );
  }
  
  return null; // No rate limit exceeded
}

// Export the rate limiter instance for testing
export { rateLimiter }; 