// Structured logging utility for production use
export interface LogContext {
  userId?: string;
  userRole?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: LogContext;
  stack?: string;
  timestamp: string;
}

class Logger {
  private logToConsole(entry: ErrorLogEntry): void {
    const timestamp = new Date().toISOString();
    const logLine = {
      ...entry,
      timestamp,
      stack: entry.error?.stack,
      errorMessage: entry.error?.message,
    };
    
    switch (entry.level) {
      case 'error':
        console.error('[ERROR]', JSON.stringify(logLine, null, 2));
        break;
      case 'warn':
        console.warn('[WARN]', JSON.stringify(logLine, null, 2));
        break;
      case 'info':
        console.info('[INFO]', JSON.stringify(logLine, null, 2));
        break;
      case 'debug':
        console.debug('[DEBUG]', JSON.stringify(logLine, null, 2));
        break;
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logToConsole({
      level: 'error',
      message,
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  warn(message: string, context?: LogContext): void {
    this.logToConsole({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  info(message: string, context?: LogContext): void {
    this.logToConsole({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  debug(message: string, context?: LogContext): void {
    // Only log debug in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole({
        level: 'debug',
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Security-specific logging
  securityEvent(message: string, context?: LogContext): void {
    this.error(`[SECURITY] ${message}`, undefined, {
      ...context,
      securityEvent: true,
    });
  }

  // Authentication failures
  authFailure(message: string, context?: LogContext): void {
    this.warn(`[AUTH_FAILURE] ${message}`, {
      ...context,
      authFailure: true,
    });
  }

  // Permission denied events
  permissionDenied(message: string, context?: LogContext): void {
    this.warn(`[PERMISSION_DENIED] ${message}`, {
      ...context,
      permissionDenied: true,
    });
  }

  // Database errors
  databaseError(message: string, error: Error, context?: LogContext): void {
    this.error(`[DATABASE] ${message}`, error, {
      ...context,
      databaseError: true,
    });
  }

  // Validation errors
  validationError(message: string, context?: LogContext): void {
    this.warn(`[VALIDATION] ${message}`, {
      ...context,
      validationError: true,
    });
  }

  // API request logging
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`[API_REQUEST] ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
    });
  }

  // Rate limiting events
  rateLimitExceeded(message: string, context?: LogContext): void {
    this.warn(`[RATE_LIMIT] ${message}`, {
      ...context,
      rateLimitExceeded: true,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to extract request context
export function getRequestContext(request: Request, session?: any): LogContext {
  const url = new URL(request.url);
  
  return {
    method: request.method,
    endpoint: url.pathname,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    userId: session?.user?.id,
    userRole: session?.user?.user_metadata?.role,
    timestamp: new Date().toISOString(),
  };
}

// Helper to create error responses with logging
export function createErrorResponse(
  message: string, 
  status: number, 
  error?: Error, 
  context?: LogContext
) {
  if (status >= 500) {
    logger.error(message, error, context);
  } else if (status >= 400) {
    logger.warn(message, context);
  }
  
  return new Response(
    JSON.stringify({ 
      error: message,
      timestamp: new Date().toISOString(),
    }), 
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 